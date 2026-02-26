from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from collections import defaultdict
from dotenv import load_dotenv

# --- DATABASE CONNECTION ---
# --- DATABASE CONNECTION ---
# Your exact Supabase URL with the '@' in the password safely encoded as '%40'
DATABASE_URL = "postgresql://postgres.jrabvvtvgtcffvewjgoq:BITanimapao2026@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"


# Add pool_pre_ping to keep the cloud connection stable
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

app = FastAPI(title="BitHarvest API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

def standardize_mun(mun):
    m = mun.title().strip()
    if "Ligao" in m: return "Ligao City"
    if "Tabaco" in m: return "Tabaco City"
    if "Legazpi" in m: return "Legazpi City"
    if "Pioduran" in m or "Pio" in m: return "Pio Duran"
    if "Sto. Domingo" in m or "Santo Domingo" in m: return "Santo Domingo"
    return m

def get_unified_data():
    query = """
        SELECT TRIM(c.municipality) as municipality, SUBSTRING(d.dataset_name FROM '[0-9]{4}') as year, 'Corn' as commodity, COALESCE(c.total_production, 0) as production FROM data_corn_harvesting c JOIN datasets d ON c.dataset_id = d.id WHERE c.municipality NOT ILIKE 'total'
        UNION ALL
        SELECT TRIM(r.municipality) as municipality, SUBSTRING(d.dataset_name FROM '[0-9]{4}') as year, 'Rice' as commodity, COALESCE(r.production, 0) as production FROM data_rice r JOIN datasets d ON r.dataset_id = d.id WHERE r.municipality NOT ILIKE 'total'
        UNION ALL
        SELECT TRIM(co.municipality) as municipality, SUBSTRING(d.dataset_name FROM '[0-9]{4}') as year, 'Coconut' as commodity, COALESCE(co.copra_mt, 0) as production FROM data_coconut co JOIN datasets d ON co.dataset_id = d.id WHERE co.municipality NOT ILIKE 'total'
        UNION ALL
        SELECT TRIM(a.municipality) as municipality, SUBSTRING(d.dataset_name FROM '[0-9]{4}') as year, 'Abaca' as commodity, COALESCE(a.annual_prod_kg, 0) / 1000.0 as production FROM data_abaca a JOIN datasets d ON a.dataset_id = d.id WHERE a.municipality NOT ILIKE 'total'
        UNION ALL
        SELECT TRIM(ca.municipality) as municipality, SUBSTRING(d.dataset_name FROM '[0-9]{4}') as year, 'Cacao' as commodity, COALESCE(ca.est_yield, 0) as production FROM data_cacao ca JOIN datasets d ON ca.dataset_id = d.id WHERE ca.municipality NOT ILIKE 'total'
    """
    with engine.connect() as conn:
        result = conn.execute(text(query)).fetchall()
        return [{"municipality": standardize_mun(row[0]) if row[0] else "Unknown", "year": row[1] if row[1] else "Unknown", "commodity": row[2], "production": float(row[3])} for row in result]

# --- 1. LINEAR REGRESSION MATH ---
def calculate_forecast(years, values, future_steps=2):
    if len(years) < 2: return [], []
    n = len(years)
    sum_x = sum(years)
    sum_y = sum(values)
    sum_x2 = sum(x*x for x in years)
    sum_xy = sum(x*y for x, y in zip(years, values))
    
    denominator = (n * sum_x2 - sum_x**2)
    slope = (n * sum_xy - sum_x * sum_y) / denominator if denominator != 0 else 0
    intercept = (sum_y - slope * sum_x) / n
    
    last_year = max(years)
    forecast_years = [str(last_year + i) for i in range(1, future_steps + 1)]
    forecast_values = [max(0, slope * int(y) + intercept) for y in forecast_years]
    
    return forecast_years, forecast_values

# --- 2. AUTOMATED INSIGHT GENERATOR ---
def generate_insights(total_vol, top_regions, commodity_split, historical_vals, forecast_vals, years, farmer_split, selected_commodity):
    insights = []
    
    # --- SECTION A: GLOBAL INSIGHTS (Shown for "All Commodities") ---
    if selected_commodity == "All Commodities":
        # 1. Growth/Trend Insight
        if forecast_vals and historical_vals and forecast_vals[-1] > historical_vals[-1]:
            growth_pct = ((forecast_vals[-1] - historical_vals[-1]) / historical_vals[-1]) * 100
            insights.append(f"📈 District Growth: Statistical models predict a {growth_pct:.1f}% rise in total yield across all sectors.")
        
        # 2. Portfolio/Risk Insight
        if commodity_split:
            top_comm = max(commodity_split, key=commodity_split.get)
            comm_pct = (commodity_split[top_comm] / total_vol) * 100 if total_vol > 0 else 0
            if comm_pct > 50:
                insights.append(f"⚠️ Production Focus: {top_comm} currently dominates {comm_pct:.1f}% of output. Consider encouraging alternative crops.")
            else:
                insights.append(f"⚖️ Stable Diversity: The district maintains a healthy balance between its primary commodities.")

    # --- SECTION B: UNIQUE COMMODITY INSIGHTS (Shown only when one is selected) ---
    commodity_facts = {
        "Rice": [
            "🍚 Food Security: Rice remains the staple pillar of the local economy and labor force.",
            "💧 Irrigation Note: Yields for Rice are heavily dependent on NIA water scheduling and seasonal rainfall."
        ],
        "Corn": [
            "🌽 Livestock Support: Most local yellow corn production directly supports the regional poultry and livestock industries.",
            "☀️ Post-Harvest: Strengthening solar drying facilities could reduce post-harvest losses for corn farmers."
        ],
        "Coconut": [
            "🥥 Industrial Value: Coconut (Copra) is a major export-oriented commodity; price fluctuations affect thousands of local households.",
            "⏳ Tree Management: The trend suggests a need for replanting senile trees to maintain long-term copra production."
        ],
        "Abaca": [
            "fiber Strongest Fiber: Albay is world-renowned for Abaca; focus should remain on disease-resistant (Bunchy Top) varieties.",
            "🎨 Handicrafts: Abaca production directly fuels the local cottage industries and artisanal handwoven products."
        ],
        "Cacao": [
            "🍫 Emerging Market: Cacao is a high-value crop with significant potential for value-added processing (Tablea).",
            "🌱 Intercropping: Cacao thrives well when intercropped with Coconut, maximizing land utility for small farmers."
        ]
    }

    if selected_commodity in commodity_facts:
        # Add the unique facts for that specific crop
        insights.extend(commodity_facts[selected_commodity])

    # --- SECTION C: DATA-DRIVEN INSIGHTS (Always shown based on the numbers) ---
    # 1. Top Region Leader
    if top_regions:
        insights.append(f"🏆 Leading Area: {top_regions[0][0]} is currently the most productive zone for {selected_commodity.lower()}.")
        
    # 2. Efficiency Insight
    total_farmers = sum(farmer_split.values())
    if total_farmers > 0 and total_vol > 0:
        efficiency = total_vol / total_farmers
        insights.append(f"🧑‍🌾 Efficiency: The current sector is averaging {efficiency:.2f} MT per registered farmer.")

    return insights

@app.get("/api/filters")
def get_filters():
    data = get_unified_data()
    return {
        "locations": ["All Locations"] + sorted(list(set(d["municipality"] for d in data))),
        "years": ["All Years"] + sorted(list(set(d["year"] for d in data if d["year"] != "Unknown")), reverse=True),
        "commodities": ["All Commodities"] + sorted(list(set(d["commodity"] for d in data)))
    }

@app.get("/api/dashboard-data")
def get_dashboard_data(location: str = "All Locations", year: str = "All Years", commodity: str = "All Commodities"):
    all_data = get_unified_data()
    
    # TOP PRODUCERS MODAL
    modal_data = [d for d in all_data if (year == "All Years" or d["year"] == year)]
    comm_mun_prod = defaultdict(lambda: defaultdict(float))
    for d in modal_data: comm_mun_prod[d["commodity"]][d["municipality"]] += d["production"]
    top_per_commodity = {comm: {"municipality": max(muns, key=muns.get), "production": round(muns[max(muns, key=muns.get)], 2)} for comm, muns in comm_mun_prod.items() if muns}

    # FILTERED DATA
    filtered_data = [d for d in all_data if (location == "All Locations" or d["municipality"] == location) and (year == "All Years" or d["year"] == year) and (commodity == "All Commodities" or d["commodity"] == commodity)]
                     
    total_volume = sum(d["production"] for d in filtered_data)
    active_areas = len(set(d["municipality"] for d in filtered_data if d["production"] > 0))
    
    commodity_split = defaultdict(float)
    for d in filtered_data: commodity_split[d["commodity"]] += d["production"]
        
    with engine.connect() as conn:
        f_corn = int(conn.execute(text(f"SELECT COALESCE(SUM(total_farmers), 0) FROM data_corn_harvesting WHERE municipality {'=' if location != 'All Locations' else '!='} '{location if location != 'All Locations' else 'total'}'")).scalar())
        f_rice = int(conn.execute(text(f"SELECT COALESCE(SUM(area_harvested), 0) FROM data_rice WHERE municipality {'=' if location != 'All Locations' else '!='} '{location if location != 'All Locations' else 'total'}'")).scalar()) 
        f_coco = int(conn.execute(text(f"SELECT COALESCE(SUM(no_of_farmers), 0) FROM data_coconut WHERE municipality {'=' if location != 'All Locations' else '!='} '{location if location != 'All Locations' else 'total'}'")).scalar())
        f_abaca = int(conn.execute(text(f"SELECT COALESCE(SUM(num_farmers), 0) FROM data_abaca WHERE municipality {'=' if location != 'All Locations' else '!='} '{location if location != 'All Locations' else 'total'}'")).scalar())
        f_cacao = int(conn.execute(text(f"SELECT COALESCE(SUM(num_farmers), 0) FROM data_cacao WHERE municipality {'=' if location != 'All Locations' else '!='} '{location if location != 'All Locations' else 'total'}'")).scalar())
        farmer_split = {"Corn": f_corn, "Rice": f_rice, "Coconut": f_coco, "Abaca": f_abaca, "Cacao": f_cacao}
        total_farmers = sum(farmer_split.values())

    region_split = defaultdict(float)
    for d in filtered_data: region_split[d["municipality"]] += d["production"]
    top_regions = sorted(region_split.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # PREDICTION
    trend_split = defaultdict(float)
    trend_data_source = [d for d in all_data if (location == "All Locations" or d["municipality"] == location) and (commodity == "All Commodities" or d["commodity"] == commodity)]
    for d in trend_data_source:
        if d["year"] != "Unknown": trend_split[int(d["year"])] += d["production"]
            
    sorted_years = sorted(trend_split.keys())
    historical_values = [trend_split[y] for y in sorted_years]
    forecast_years, forecast_values = calculate_forecast(sorted_years, historical_values)

    # GENERATE INSIGHTS (Now includes farmer_split!)
    ai_insights = generate_insights(total_volume, top_regions, commodity_split, historical_values, forecast_values, sorted_years, farmer_split, commodity)

    return {
        "kpis": {"totalVolume": round(total_volume, 2), "topRegion": top_regions[0][0] if top_regions else "N/A", "activeAreas": active_areas, "totalFarmers": total_farmers},
        "commoditySplit": {k: round(v, 2) for k, v in commodity_split.items()},
        "farmerSplit": farmer_split,
        "regionalLabels": [x[0] for x in top_regions],
        "regionalProduction": [round(x[1], 2) for x in top_regions],
        "historicalTrendLabels": [str(y) for y in sorted_years],
        "historicalTrendData": [round(v, 2) for v in historical_values],
        "forecastLabels": forecast_years,
        "forecastData": [round(v, 2) for v in forecast_values],
        "topPerCommodity": top_per_commodity,
        "aiInsights": ai_insights
    }