from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from collections import defaultdict

DATABASE_URL = "postgresql://postgres.jrabvvtvgtcffvewjgoq:BITanimapao2026@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


app = FastAPI(title="BitHarvest API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- CROP CATEGORIZATION ENGINE ---
CROP_GROUPS = {
    "Grains & Cereals": ["Corn", "Rice", "Sweet Corn", "White Corn"],
    "Industrial Crops": ["Abaca", "Coconut", "Cacao"],
    "Fruiting Vegetables": ["Squash", "Ampalaya", "Okra", "Eggplant", "Tomato", "Hot Pepper", "Cucumber", "Patola", "Chayote", "Upo", "Gourd", "Watermelon", "Melon", "Papaya"],
    "Leafy Vegetables": ["Pechay", "Cabbage", "Upland Kangkong", "Green Onion", "Spring Onion", "Collard", "Onion Leak", "Mustasa", "Lettuce", "Lemon Grass"],
    "Legumes & Pulses": ["Pole Sitao", "Peanut", "Winged Bean", "Beans", "Baguio Beans", "Mungbean", "Cowpea", "String Beans", "Snap Bean", "Percoles", "Patani"],
    "Root & Tuber Crops": ["Sweet Potato", "Gabi", "Cassava", "Radish", "Yam", "Ginger", "Onion", "Garlic", "Singkamas", "Camiguing"],
    "Fruits": ["Banana", "Dragon Fruit", "Kalamansi"]
}

def get_crop_group(commodity_name):
    for group, crops in CROP_GROUPS.items():
        if commodity_name.lower() in [c.lower() for c in crops]:
            return group
    return "Other Crops"

def standardize_mun(mun):
    if not mun: return "Unknown"
    m = mun.title().strip()
    if "Ligao" in m: return "Ligao City"
    if "Tabaco" in m: return "Tabaco City"
    if "Legazpi" in m: return "Legazpi City"
    if "Pioduran" in m or "Pio" in m: return "Pio Duran"
    if "Sto. Domingo" in m or "Santo Domingo" in m: return "Santo Domingo"
    return m

def get_unified_data():
    query = """
        SELECT TRIM(c.municipality) as municipality, 
               COALESCE(SUBSTRING(d.dataset_name FROM '[0-9]{4}'), 'Unknown') as year,
               COALESCE(SUBSTRING(d.dataset_name FROM 'Q[1-4]'), 'Annual') as quarter,
               'Corn' as commodity, COALESCE(c.total_production, 0) as production, COALESCE(c.total_farmers, 0) as farmers 
        FROM data_corn_harvesting c JOIN datasets d ON c.dataset_id = d.id WHERE c.municipality NOT ILIKE 'total'
        UNION ALL
        SELECT TRIM(r.municipality), COALESCE(SUBSTRING(d.dataset_name FROM '[0-9]{4}'), 'Unknown'), COALESCE(SUBSTRING(d.dataset_name FROM 'Q[1-4]'), 'Annual'), 'Rice', COALESCE(r.production, 0), COALESCE(r.area_harvested, 0) FROM data_rice r JOIN datasets d ON r.dataset_id = d.id WHERE r.municipality NOT ILIKE 'total'
        UNION ALL
        SELECT TRIM(co.municipality), COALESCE(SUBSTRING(d.dataset_name FROM '[0-9]{4}'), 'Unknown'), COALESCE(SUBSTRING(d.dataset_name FROM 'Q[1-4]'), 'Annual'), 'Coconut', COALESCE(co.copra_mt, 0), COALESCE(co.no_of_farmers, 0) FROM data_coconut co JOIN datasets d ON co.dataset_id = d.id WHERE co.municipality NOT ILIKE 'total'
        UNION ALL
        SELECT TRIM(a.municipality), COALESCE(SUBSTRING(d.dataset_name FROM '[0-9]{4}'), 'Unknown'), COALESCE(SUBSTRING(d.dataset_name FROM 'Q[1-4]'), 'Annual'), 'Abaca', COALESCE(a.annual_prod_kg, 0) / 1000.0, COALESCE(a.num_farmers, 0) FROM data_abaca a JOIN datasets d ON a.dataset_id = d.id WHERE a.municipality NOT ILIKE 'total'
        UNION ALL
        SELECT TRIM(ca.municipality), COALESCE(SUBSTRING(d.dataset_name FROM '[0-9]{4}'), 'Unknown'), COALESCE(SUBSTRING(d.dataset_name FROM 'Q[1-4]'), 'Annual'), 'Cacao', COALESCE(ca.est_yield, 0), COALESCE(ca.num_farmers, 0) FROM data_cacao ca JOIN datasets d ON ca.dataset_id = d.id WHERE ca.municipality NOT ILIKE 'total'
        UNION ALL
        SELECT TRIM(h.municipality), COALESCE(SUBSTRING(d.dataset_name FROM '[0-9]{4}'), 'Unknown'), COALESCE(SUBSTRING(d.dataset_name FROM 'Q[1-4]'), 'Annual'), INITCAP(REPLACE(d.commodity, '_', ' ')), COALESCE(h.quarterly_production, 0), COALESCE(h.num_farmers, 0) FROM data_hvc_production h JOIN datasets d ON h.dataset_id = d.id WHERE h.municipality NOT ILIKE 'total'
    """
    with engine.connect() as conn:
        result = conn.execute(text(query)).fetchall()
        parsed_data = []
        for row in result:
            yr = row[1]
            qtr = row[2]
            comm = row[3]
            chronological_period = f"{yr} {qtr}" if qtr != "Annual" else yr
            
            parsed_data.append({
                "municipality": standardize_mun(row[0]),
                "year": yr,
                "quarter": qtr,
                "period": chronological_period,
                "commodity": comm,
                "crop_group": get_crop_group(comm),
                "production": float(row[4]),
                "farmers": int(row[5])
            })
        return parsed_data

# --- UPDATED SMART FORECAST LABELS ---
def calculate_forecast(periods, values, future_steps=3):
    if len(periods) < 2: return [], []
    n = len(periods)
    x = list(range(n))
    sum_x, sum_y = sum(x), sum(values)
    sum_x2 = sum(i*i for i in x)
    sum_xy = sum(i*y for i, y in zip(x, values))
    
    denominator = (n * sum_x2 - sum_x**2)
    slope = (n * sum_xy - sum_x * sum_y) / denominator if denominator != 0 else 0
    intercept = (sum_y - slope * sum_x) / n
    
    last_period = periods[-1]
    forecast_labels = []
    
    # Generates names like "2025 Q4 (Proj.)" instead of "+1 Qtr"
    if " Q" in last_period:
        try:
            yr_str, qtr_str = last_period.split(" Q")
            yr, qtr = int(yr_str), int(qtr_str)
            for _ in range(future_steps):
                qtr += 1
                if qtr > 4:
                    qtr = 1
                    yr += 1
                forecast_labels.append(f"{yr} Q{qtr} (Proj.)")
        except:
            forecast_labels = [f"Proj. +{i} Qtr" for i in range(1, future_steps + 1)]
    else:
        try:
            yr = int(last_period)
            for _ in range(future_steps):
                yr += 1
                forecast_labels.append(f"{yr} (Proj.)")
        except:
            forecast_labels = [f"Proj. +{i}" for i in range(1, future_steps + 1)]

    forecast_values = [max(0, slope * (n - 1 + i) + intercept) for i in range(1, future_steps + 1)]
    return forecast_labels, forecast_values

def generate_insights(total_vol, group_split, top_regions, hist_vals, forecast_vals, total_farmers, selected_group, selected_commodity, location, top_crop_overall):
    insights = []
    
    if len(hist_vals) >= 2 and hist_vals[-2] > 0:
        growth = ((hist_vals[-1] - hist_vals[-2]) / hist_vals[-2]) * 100
        if growth >= 5:
            insights.append(f"📈 Yield Expansion: Recent harvests grew by {growth:.1f}%. Consider establishing localized trading posts or cold storage to prevent market oversupply.")
        elif growth <= -5:
            insights.append(f"📉 Supply Warning: Volume contracted by {abs(growth):.1f}%. Immediate review of recent weather impacts, pest outbreaks, or fertilizer shortages is advised.")

    crop_intel = {
        "Rice": "Food Security Mandate: Highly sensitive to El Niño. Prioritize NIA irrigation scheduling and drought-resistant seed subsidies.",
        "Corn": "Livestock Catalyst: Primary driver for local poultry feeds. CAPEX for solar drying facilities is critical to reduce post-harvest moisture loss.",
        "Coconut": "Export & Senility: Production is threatened by aging trees. Coordinate with PCA for aggressive replanting.",
        "Abaca": "Global Fiber Export: Albay holds a strategic global advantage. Budget should target 'Bunchy Top' disease eradication.",
        "Cacao": "High-Margin Cash Crop: Excellent intercropping potential. Grants for fermentation boxes will significantly increase farmer ROI.",
        "Squash": "Shelf-Life Advantage: Has a longer shelf-life than other fruiting veggies, making it highly viable for long-distance transport to NCR markets.",
        "Tomato": "Perishability Risk: Highly vulnerable to transport damage. Establish cold-storage logistics or promote value-added processing.",
        "Sweet Potato": "Climate Buffer: Highly resilient to heavy winds. Promote as a primary food security buffer during typhoon season.",
        "Cassava": "Industrial Processing: High demand for animal feed. Requires strict soil nutrient management to prevent land depletion.",
        "Pechay": "Weather Vulnerability: Extremely sensitive to heavy monsoon rains. Subsidize protective farming structures.",
        "Eggplant": "Pest Management: Highly susceptible to Fruit and Shoot Borer (FSB). Introduce Integrated Pest Management (IPM) training."
    }

    group_intel = {
        "Grains & Cereals": "Macro-Economic Pillar: Dictates regional inflation. Post-harvest mechanization is the highest priority for this group.",
        "Fruiting Vegetables": "Market Volatility: Prone to 'boom and bust' pricing. Encourage staggered planting schedules among barangays.",
        "Leafy Vegetables": "Fast Cash Cycle: Provides immediate income (30-45 days) but suffers high post-harvest loss. Improve farm-to-market roads.",
        "Root & Tuber Crops": "Disaster Resilience: The ultimate typhoon-proof calorie source. Best candidates for LGU emergency agriculture programs.",
        "Legumes & Pulses": "Soil Regeneration: Naturally fixes nitrogen in the soil. Mandate crop rotation with this group to rehabilitate degraded fields."
    }

    if selected_commodity != "All Commodities":
        if selected_commodity in crop_intel: insights.append(f"🌱 {selected_commodity} Strategy: {crop_intel[selected_commodity]}")
        else: insights.append(f"🌱 {selected_commodity} Strategy: Monitor local market absorption rates to ensure farmers receive profitable farmgate prices.")
    elif selected_group != "All Groups":
        if selected_group in group_intel: insights.append(f"📋 {selected_group} Policy: {group_intel[selected_group]}")
        if top_crop_overall and top_crop_overall != "N/A": insights.append(f"👑 Group Leader: {top_crop_overall} dominates this category.")
    else:
        if top_crop_overall and top_crop_overall != "N/A":
            if top_crop_overall in crop_intel: insights.append(f"👑 Provincial Anchor ({top_crop_overall}): {crop_intel[top_crop_overall]}")

    if total_farmers > 0 and total_vol > 0:
        efficiency = total_vol / total_farmers
        if efficiency > 15: insights.append(f"⚙️ Advanced Mechanization: Labor efficiency is exceptionally high ({efficiency:.1f} MT/farmer).")
        elif efficiency < 5: insights.append(f"🧑‍🌾 Labor Constraint: Low yield per capita ({efficiency:.1f} MT/farmer). High priority for agricultural extension training.")

    if location != "All Locations":
        insights.append(f"📍 Municipal Action Plan ({location}): Align LGU budget with the dominant crop to capture more economic value locally.")

    return insights

@app.get("/api/filters")
def get_filters():
    data = get_unified_data()
    locations = ["All Locations"] + sorted(list(set(d["municipality"] for d in data)))
    years = ["All Years"] + sorted(list(set(d["year"] for d in data if d["year"] != "Unknown")), reverse=True)
    quarters = ["All Quarters"] + sorted(list(set(d["quarter"] for d in data if d["quarter"] != "Unknown")))
    groups = ["All Groups"] + sorted(list(set(d["crop_group"] for d in data)))
    
    grouped_commodities = defaultdict(list)
    for d in data:
        if d["commodity"] not in grouped_commodities[d["crop_group"]]:
            grouped_commodities[d["crop_group"]].append(d["commodity"])
    for k in grouped_commodities: grouped_commodities[k].sort()
        
    return {"locations": locations, "years": years, "quarters": quarters, "groups": groups, "groupedCommodities": grouped_commodities}

@app.get("/api/dashboard-data")
def get_dashboard_data(location: str = "All Locations", year: str = "All Years", quarter: str = "All Quarters", group: str = "All Groups", commodity: str = "All Commodities"):
    all_data = get_unified_data()
    
    filtered_data = [
        d for d in all_data 
        if (location == "All Locations" or d["municipality"] == location) 
        and (year == "All Years" or d["year"] == year) 
        and (quarter == "All Quarters" or d["quarter"] == quarter) 
        and (group == "All Groups" or d["crop_group"] == group)
        and (commodity == "All Commodities" or d["commodity"] == commodity)
    ]
    
    total_volume = sum(d["production"] for d in filtered_data)
    active_areas = len(set(d["municipality"] for d in filtered_data if d["production"] > 0))
    total_farmers = sum(d["farmers"] for d in filtered_data)
    
    raw_comm = defaultdict(float)
    group_split = defaultdict(float)
    farm_split = defaultdict(int)
    
    for d in filtered_data: 
        raw_comm[d["commodity"]] += d["production"]
        group_split[d["crop_group"]] += d["production"]
        farm_split[d["commodity"]] += d["farmers"]
        
    top_comms = dict(sorted(raw_comm.items(), key=lambda x: x[1], reverse=True)[:10])
    top_farmers = dict(sorted(farm_split.items(), key=lambda x: x[1], reverse=True)[:10])

    regional_comp = [d for d in all_data if (year == "All Years" or d["year"] == year) and (quarter == "All Quarters" or d["quarter"] == quarter) and (group == "All Groups" or d["crop_group"] == group) and (commodity == "All Commodities" or d["commodity"] == commodity)]
    region_split = defaultdict(float)
    for d in regional_comp: region_split[d["municipality"]] += d["production"]
    top_regions = sorted(region_split.items(), key=lambda x: x[1], reverse=True)[:5]
    top_cities_list = [x[0] for x in top_regions]

    stacked_city_data = {city: defaultdict(float) for city in top_cities_list}
    for d in regional_comp:
        if d["municipality"] in top_cities_list:
            stacked_city_data[d["municipality"]][d["crop_group"]] += d["production"]

    # --- THE FIX: Trend Logic ignores 'year' and 'quarter' to always show the full chronological line ---
    trend_split = defaultdict(float)
    for d in [x for x in all_data if (location == "All Locations" or x["municipality"] == location) and (group == "All Groups" or x["crop_group"] == group) and (commodity == "All Commodities" or x["commodity"] == commodity)]:
        if d["period"] != "Unknown": trend_split[d["period"]] += d["production"]
    
    sorted_periods = sorted(trend_split.keys())
    hist_vals = [trend_split[p] for p in sorted_periods]
    f_labels, f_vals = calculate_forecast(sorted_periods, hist_vals, future_steps=3)

    labor_efficiency = round(total_volume / total_farmers, 2) if total_farmers > 0 else 0
    top_crop = max(raw_comm, key=raw_comm.get) if raw_comm else "N/A"
    top_city = top_regions[0][0] if top_regions else "N/A"
    qoq_growth = 0
    if len(hist_vals) >= 2 and hist_vals[-2] > 0:
        qoq_growth = round(((hist_vals[-1] - hist_vals[-2]) / hist_vals[-2]) * 100, 1)

    return {
        "kpis": {
            "totalVolume": round(total_volume, 2), 
            "activeAreas": active_areas, 
            "totalFarmers": total_farmers,
            "laborEfficiency": labor_efficiency,
            "topCrop": top_crop,
            "topCity": top_city,
            "qoqGrowth": qoq_growth
        },
        "commoditySplit": {k: round(v, 2) for k, v in top_comms.items()},
        "groupSplit": {k: round(v, 2) for k, v in sorted(group_split.items(), key=lambda x: x[1], reverse=True)},
        "farmerSplit": top_farmers,
        "regionalLabels": top_cities_list,
        "regionalProduction": [round(x[1], 2) for x in top_regions],
        "stackedCityData": {k: dict(v) for k, v in stacked_city_data.items()},
        "historicalTrendLabels": sorted_periods,
        "historicalTrendData": [round(v, 2) for v in hist_vals],
        "forecastLabels": f_labels,
        "forecastData": [round(v, 2) for v in f_vals],
        "topProducersList": [{"municipality": x[0], "production": round(x[1], 2)} for x in top_regions],
        "aiInsights": generate_insights(total_volume, group_split, top_regions, hist_vals, f_vals, total_farmers, group, commodity, location, top_crop)
    }