from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from collections import defaultdict
from dotenv import load_dotenv

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

# --- 2. EXECUTIVE INSIGHT GENERATOR ---
# Notice we added 'selected_location' to the end of the parameters
def generate_insights(total_vol, top_regions, commodity_split, historical_vals, forecast_vals, years, farmer_split, selected_commodity, selected_location):
    insights = []
    
    # --- SECTION A: MACRO (Province) vs MICRO (Municipal) INSIGHTS ---
    if selected_location == "All Locations":
        # Global/Provincial Insights
        if selected_commodity == "All Commodities":
            if forecast_vals and historical_vals and forecast_vals[-1] > historical_vals[-1]:
                growth_pct = ((forecast_vals[-1] - historical_vals[-1]) / historical_vals[-1]) * 100
                insights.append(f"📈 Macro Projection: Statistical linear models forecast a {growth_pct:.1f}% net yield expansion across the provincial sector over the next 24 months.")
            
            if commodity_split:
                top_comm = max(commodity_split, key=commodity_split.get)
                comm_pct = (commodity_split[top_comm] / total_vol) * 100 if total_vol > 0 else 0
                if comm_pct > 50:
                    insights.append(f"⚠️ Economic Vulnerability: Provincial output is heavily concentrated in {top_comm} ({comm_pct:.1f}%). Policy interventions supporting crop diversification are recommended.")
                else:
                    insights.append(f"⚖️ Portfolio Stability: The district currently exhibits a diversified agricultural portfolio, ensuring economic resilience.")
    else:
        # Localized/Municipal Insights (When a specific city is clicked)
        if forecast_vals and historical_vals and forecast_vals[-1] > historical_vals[-1]:
            growth_pct = ((forecast_vals[-1] - historical_vals[-1]) / historical_vals[-1]) * 100
            crop_text = selected_commodity if selected_commodity != "All Commodities" else "agricultural"
            insights.append(f"📈 Localized Growth: Trajectory models predict a {growth_pct:.1f}% growth in {crop_text} yield specifically for the municipality of {selected_location}.")
        elif forecast_vals and historical_vals:
            insights.append(f"📉 Attention Needed: Forecasts indicate a potential plateau or dip in {selected_location}'s output. Targeted LGU interventions or budget reviews may be required.")

        if commodity_split and selected_commodity == "All Commodities":
            top_comm = max(commodity_split, key=commodity_split.get)
            comm_pct = (commodity_split[top_comm] / total_vol) * 100 if total_vol > 0 else 0
            insights.append(f"🎯 Municipal Focus: {top_comm} is the primary economic driver for {selected_location}, representing {comm_pct:.1f}% of its local volume.")

    # --- SECTION B: COMMODITY-SPECIFIC POLICY BRIEFS ---
    commodity_facts = {
        "Rice": [
            "🍚 Food Security Mandate: Rice dictates the foundational stability of the local labor force. Priority must be given to modernizing NIA irrigation schedules.",
            "💧 Climate Vulnerability: Historical yields indicate high susceptibility to El Niño/La Niña cycles. Drought-resistant seed subsidies should be reviewed."
        ],
        "Corn": [
            "🌽 Agri-Economic Impact: Yellow corn production is the primary catalyst for the regional poultry and livestock supply chains.",
            "☀️ Infrastructure Need: High post-harvest losses remain a threat. CAPEX allocation for localized solar drying facilities is strongly advised."
        ],
        "Coconut": [
            "🥥 Export Reliance: Copra remains a vital export-oriented asset. However, market volatility directly impacts household income stability for thousands of farmers.",
            "⏳ Resource Depletion: Current data trends underscore an urgent need for government-sponsored replanting initiatives to replace senile trees."
        ],
        "Abaca": [
            "🧶 Strategic Export: Albay retains a competitive global advantage in Abaca. Budgetary focus must prioritize the distribution of Bunchy Top disease-resistant cultivars.",
            "🎨 Micro-Economy Catalyst: Raw fiber production directly sustains the provincial cottage industry and artisanal handicraft sectors."
        ],
        "Cacao": [
            "🍫 High-Value Potential: Cacao represents an emerging, high-margin market. Strategic grants for local value-added processing (e.g., Tablea manufacturing) will increase GDP.",
            "🌱 Land Optimization: Cacao demonstrates excellent viability for intercropping with Coconut, offering a dual-income stream for smallholder farmers."
        ]
    }

    if selected_commodity in commodity_facts:
        insights.extend(commodity_facts[selected_commodity])

    # --- SECTION C: PERFORMANCE METRICS ---
    # We hide the "Strategic Hub" insight if they are already looking at a specific city!
    if selected_location == "All Locations" and top_regions:
        insights.append(f"🏆 Strategic Hub: {top_regions[0][0]} serves as the primary engine for this sector, representing the highest concentration of output.")
        
    total_farmers = sum(farmer_split.values())
    if total_farmers > 0 and total_vol > 0:
        efficiency = total_vol / total_farmers
        # The text changes depending on if we are looking at a city or the province
        scope = f"in {selected_location}" if selected_location != "All Locations" else "across the province"
        insights.append(f"🧑‍🌾 Workforce Efficiency: The active agricultural labor force {scope} is currently yielding a per capita output of {efficiency:.2f} Metric Tons.")

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
    
    # --- 1. MAIN FILTERED DATA (Respects ALL filters) ---
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

    # --- 2. UPDATED: CONSTANT LEADERBOARD LOGIC ---
    # We create a new dataset that ignores 'location' but keeps 'year' and 'commodity'
    # This ensures the Top 5 cities always show up for comparison!
    regional_comparison_data = [d for d in all_data if (year == "All Years" or d["year"] == year) and (commodity == "All Commodities" or d["commodity"] == commodity)]
    
    region_split = defaultdict(float)
    for d in regional_comparison_data: region_split[d["municipality"]] += d["production"]
    
    # Sort them highest to lowest and grab the top 5
    top_regions = sorted(region_split.items(), key=lambda x: x[1], reverse=True)[:5]
    top_producers_list = [{"municipality": item[0], "production": round(item[1], 2)} for item in top_regions]
    
    # PREDICTION
    trend_split = defaultdict(float)
    trend_data_source = [d for d in all_data if (location == "All Locations" or d["municipality"] == location) and (commodity == "All Commodities" or d["commodity"] == commodity)]
    for d in trend_data_source:
        if d["year"] != "Unknown": trend_split[int(d["year"])] += d["production"]
            
    sorted_years = sorted(trend_split.keys())
    historical_values = [trend_split[y] for y in sorted_years]
    forecast_years, forecast_values = calculate_forecast(sorted_years, historical_values)

    ai_insights = generate_insights(total_volume, top_regions, commodity_split, historical_values, forecast_values, sorted_years, farmer_split, commodity, location)

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
        
        # New key for the modal!
        "topProducersList": top_producers_list, 
        
        "aiInsights": ai_insights
    }