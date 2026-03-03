import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom'; // Added for the Modal Portal
// Ensure your CSS file is imported correctly based on your folder structure
import '../App.css'; 

const albayCoords = {
    "Polangui": [13.29, 123.48], "Oas": [13.25, 123.49], "Ligao City": [13.18, 123.53], "Libon": [13.28, 123.43],
    "Tabaco City": [13.36, 123.73], "Legazpi City": [13.14, 123.74], "Guinobatan": [13.19, 123.59], "Daraga": [13.14, 123.71],
    "Camalig": [13.16, 123.63], "Pio Duran": [13.04, 123.45], "Jovellar": [13.06, 123.59], "Malinao": [13.40, 123.70],
    "Malilipot": [13.32, 123.73], "Santo Domingo": [13.23, 123.77], "Manito": [13.12, 123.87], "Bacacay": [13.29, 123.79],
    "Tiwi": [13.45, 123.68], "Rapu-Rapu": [13.18, 124.12]
};

const LegendRow = ({ title, value, percentage, color }) => (
    <div className="legend-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
        <div className="legend-top" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600' }}>
            <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%'}}>{title}</span>
            <span>{percentage}%</span>
        </div>
        <div className="legend-bar-track" style={{ height: '6px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div className="legend-bar-fill" style={{ height: '100%', width: `${percentage}%`, background: color }}></div>
        </div>
    </div>
);

export default function Analytics() {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [filters, setFilters] = useState({ locations: [], years: [], quarters: [], groupedCommodities: {} });
  
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [selectedQuarter, setSelectedQuarter] = useState("All Quarters");
  
  // --- CUSTOM SEARCHABLE DROPDOWN STATE ---
  const [allCommodities, setAllCommodities] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState("All Commodities");
  const [cropSearchTerm, setCropSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [apiData, setApiData] = useState(null);
  const chartRefs = useRef({});

  // 1. Fetch Filters
  useEffect(() => {
      fetch('http://localhost:8000/api/filters')
        .then(res => res.json())
        .then(data => {
            setFilters(data);
            if (data.groupedCommodities) {
                const flatList = Object.values(data.groupedCommodities).flat();
                setAllCommodities([...new Set(flatList)]); // Remove duplicates
            }
        });
  }, []);

  // 2. Fetch Dashboard Data
  useEffect(() => {
      const url = `http://localhost:8000/api/dashboard-data?location=${encodeURIComponent(selectedLocation)}&year=${encodeURIComponent(selectedYear)}&quarter=${encodeURIComponent(selectedQuarter)}&commoditySearch=${encodeURIComponent(selectedCommodity === "All Commodities" ? "" : selectedCommodity)}`;
      fetch(url).then(res => res.json()).then(data => setApiData(data));
  }, [selectedLocation, selectedYear, selectedQuarter, selectedCommodity]);

  // 3. Handle Outside Clicks for Custom Dropdown
  useEffect(() => {
      const handleClickOutside = (event) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
              setIsDropdownOpen(false);
              setCropSearchTerm(selectedCommodity === "All Commodities" ? "" : selectedCommodity);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedCommodity]);

  // Filter logic (max 8 results)
  const filteredCommodities = allCommodities
      .filter(c => c.toLowerCase().includes(cropSearchTerm.toLowerCase()))
      .slice(0, 8); 

  // --- CHART RENDERING LOGIC ---
  useEffect(() => {
      if (!apiData) return;
      const L = window.L;
      const Chart = window.Chart;

      Object.values(chartRefs.current).forEach(chart => chart && chart.destroy());

      // --- MAP ---
      let mapInstance = null;
      const mapElement = document.getElementById('map-analytics');
      if (mapElement && L && !mapElement._leaflet_id) {
          mapInstance = L.map('map-analytics', { zoomControl: true }).setView([13.20, 123.60], 10);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapInstance);

          apiData.regionalLabels.forEach((municipality, index) => {
              const coords = albayCoords[municipality] || [13.20 + (Math.random()*0.1), 123.60 + (Math.random()*0.1)]; 
              const production = apiData.regionalProduction[index];
              const radiusSize = Math.max(8, Math.min(25, (production / 5000) * 5));

              L.circleMarker(coords, { radius: radiusSize, color: '#3D562A', fillColor: '#5F783D', fillOpacity: 0.7, weight: 2 
              }).addTo(mapInstance).bindPopup(`<strong>${municipality}</strong><br/>${production.toLocaleString()} MT`);
          });
      }

      // --- CHARTS ---
      if (Chart) {
          Chart.defaults.color = '#4A5240';
          Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
          const customPalette = ['#3D562A', '#4E6A34', '#5F783D', '#758E4E', '#8F9A75', '#A5B08E', '#DCE3D0'];

          // 1. Area Chart
          const lineCanvas = document.getElementById('lineChartAnalytics');
          if (lineCanvas) {
              chartRefs.current.lineChart = new Chart(lineCanvas.getContext('2d'), {
                  type: 'line',
                  data: {
                      labels: [...apiData.historicalTrendLabels, ...apiData.forecastLabels],
                      datasets: [
                          { label: 'Recorded', data: [...apiData.historicalTrendData, ...Array(apiData.forecastLabels.length).fill(null)], borderColor: '#3D562A', backgroundColor: 'rgba(61, 86, 42, 0.1)', fill: true, tension: 0.4, borderWidth: 2 },
                          { label: 'AI Forecast', data: [...Array(apiData.historicalTrendData.length - 1).fill(null), apiData.historicalTrendData[apiData.historicalTrendData.length-1], ...apiData.forecastData], borderColor: '#758E4E', borderDash: [5, 5], backgroundColor: 'rgba(117, 142, 78, 0.05)', fill: true, tension: 0.4, borderWidth: 2 }
                      ]
                  },
                  options: { maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
              });
          }

          // 2. Doughnut Chart
          const doughnutCanvas = document.getElementById('doughnutChartAnalytics');
          if (doughnutCanvas) {
              chartRefs.current.doughnutChart = new Chart(doughnutCanvas.getContext('2d'), {
                  type: 'doughnut',
                  data: {
                      labels: Object.keys(apiData.commoditySplit),
                      datasets: [{ data: Object.values(apiData.commoditySplit), backgroundColor: customPalette, borderWidth: 2, borderColor: '#FAF9F6' }]
                  },
                  options: { maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } } }
              });
          }

          // 3. Bar Chart
          const groupCanvas = document.getElementById('groupChartAnalytics');
          if (groupCanvas) {
              chartRefs.current.groupChart = new Chart(groupCanvas.getContext('2d'), {
                  type: 'bar',
                  data: {
                      labels: Object.keys(apiData.groupSplit),
                      datasets: [{ label: 'MT', data: Object.values(apiData.groupSplit), backgroundColor: '#758E4E', borderRadius: 4 }]
                  },
                  options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } } }
              });
          }

          // 4. Vertical Bar for Farmers
          const farmerCanvas = document.getElementById('farmerChartAnalytics');
          if (farmerCanvas) {
              chartRefs.current.farmerChart = new Chart(farmerCanvas.getContext('2d'), {
                  type: 'bar',
                  data: {
                      labels: Object.keys(apiData.farmerSplit),
                      datasets: [{ label: 'Registered Farmers', data: Object.values(apiData.farmerSplit), backgroundColor: '#5F783D', borderRadius: 4 }]
                  },
                  options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
              });
          }

          // 5. Regional Comparison Chart (Volume vs Farmers)
          const regionalCanvas = document.getElementById('regionalCompChartAnalytics');
          if (regionalCanvas) {
              chartRefs.current.regionalCompChart = new Chart(regionalCanvas.getContext('2d'), {
                  type: 'bar',
                  data: {
                      labels: apiData.regionalLabels,
                      datasets: [
                          {
                              label: 'Production Volume (MT)',
                              data: apiData.regionalProduction,
                              backgroundColor: '#3D562A',
                              yAxisID: 'y'
                          },
                          {
                              label: 'Active Farmers',
                              data: apiData.regionalFarmers,
                              backgroundColor: '#A5B08E',
                              yAxisID: 'y1'
                          }
                      ]
                  },
                  options: {
                      maintainAspectRatio: false,
                      interaction: { mode: 'index', intersect: false },
                      scales: {
                          y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Metric Tons (MT)' } },
                          y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Headcount' } }
                      },
                      plugins: { legend: { position: 'bottom', labels: {boxWidth: 10} } }
                  }
              });
          }
      }

      return () => { if (mapInstance) mapInstance.remove(); };
  }, [apiData]);

  if (!apiData) return null; 

  const topCrops = Object.keys(apiData.commoditySplit).slice(0, 4);
  const activeDataLabel = selectedCommodity !== "All Commodities" ? `Search: "${selectedCommodity}"` : "All Categories";

  return (
    <div className="analytics-internal-view" style={{ animation: 'fadeIn 0.5s ease' }}>
        
        {/* MODAL OVERLAY PORTAL FOR TOP PRODUCERS */}
        {isStatusModalOpen && ReactDOM.createPortal(
            <div className="cr-modal-overlay">
                <div className="cr-modal" style={{ maxWidth: '500px' }}>
                    <div className="cr-modal-header">
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text)' }}>Top Producing Cities</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {selectedCommodity === "All Commodities" ? "Highest overall yields" : `Highest yields for ${selectedCommodity}`}
                            </p>
                        </div>
                        <button className="cr-modal-close" onClick={() => setIsStatusModalOpen(false)}>
                            <i className="fa-solid fa-xmark" />
                        </button>
                    </div>

                    <div className="cr-modal-body" style={{ padding: '1.5rem' }}>
                        <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                            {apiData.topProducersList.map((data, index) => (
                                <div key={data.municipality} style={{display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: index < apiData.topProducersList.length - 1 ? '1px solid var(--border)' : 'none'}}>
                                    <strong style={{color: 'var(--primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px'}}>
                                        <span style={{ color: 'var(--gold)', fontSize: '1.2rem' }}>#{index + 1}</span> {data.municipality}
                                    </strong>
                                    <span style={{fontWeight: '700', color: 'var(--text)'}}>{data.production.toLocaleString()} MT</span>
                                </div>
                            ))}
                            {apiData.topProducersList.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>No production data available for this selection.</div>
                            )}
                        </div>
                    </div>
                    
                    <div className="cr-modal-footer">
                        <button className="cr-btn-primary" onClick={() => setIsStatusModalOpen(false)}>Close Leaderboard</button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* UNIFIED HEADER: Fixed position using Sticky, scaled down fonts */}
        <header className="rm-header">
            <div className="rm-header-left">
                <div className="rm-header-avatar"><i className="fa-solid fa-chart-line" /></div>
                <div>
                    <div className="rm-greeting-label">Data Explorer</div>
                    <h1 className="rm-title">Agricultural Analytics</h1>
                    <p className="rm-subtitle">Internal view of provincial crop performance and AI forecasting.</p>
                </div>
            </div>
            <div className="rm-header-right" />
        </header>

        {/* CASCADING FILTERS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '10px', marginBottom: '1.5rem' }}>
            <select className="filter-select-sm" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {filters.years?.map(y => <option key={y} value={y}>{y}</option>) || <option>All Years</option>}
            </select>

            <select className="filter-select-sm" value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)}>
                {filters.quarters?.map(q => <option key={q} value={q}>{q}</option>) || <option>All Quarters</option>}
            </select>

            <select className="filter-select-sm" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                {filters.locations?.map(loc => <option key={loc} value={loc}>{loc}</option>) || <option>All Locations</option>}
            </select>

            {/* THE CUSTOM SEARCHABLE DROPDOWN */}
            <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2, fontSize: '0.8rem' }}></i>
                
                <input 
                    type="text" 
                    className="filter-select-sm dropdown-input" 
                    placeholder="Search specific crop (e.g. Cacao)..." 
                    value={isDropdownOpen ? cropSearchTerm : (selectedCommodity === "All Commodities" ? "" : selectedCommodity)}
                    onChange={(e) => {
                        setCropSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                    }}
                    onFocus={() => {
                        setIsDropdownOpen(true);
                        if (selectedCommodity !== "All Commodities") setCropSearchTerm('');
                    }}
                    style={{ width: '100%', paddingLeft: '32px', cursor: 'text', border: isDropdownOpen ? '1px solid var(--primary)' : '1px solid var(--border-color)' }}
                />

                {isDropdownOpen && (
                    <div className="custom-dropdown-menu" style={{ top: 'calc(100% + 2px)' }}>
                        <div 
                            className={`custom-dropdown-item ${selectedCommodity === "All Commodities" ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedCommodity("All Commodities");
                                setCropSearchTerm("");
                                setIsDropdownOpen(false);
                            }}
                            style={{ borderBottom: '1px solid var(--border-color)' }}
                        >
                            All Commodities
                        </div>

                        {filteredCommodities.length > 0 ? (
                            filteredCommodities.map(crop => (
                                <div 
                                    key={crop} 
                                    className={`custom-dropdown-item ${selectedCommodity === crop ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedCommodity(crop);
                                        setCropSearchTerm(crop);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    {crop}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                No crops match "{cropSearchTerm}"
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* SCALED DOWN KPI CARDS (Internal Dashboard Size) */}
        <div className="kpi-grid">
            <div className="kpi-card accent">
                <div className="bg-icon"><i className="fa-solid fa-seedling"></i></div>
                <div className="kpi-label">Total Harvest</div>
                <div className="kpi-value">
                    {apiData.kpis.totalVolume.toLocaleString()}<span className="kpi-unit">MT</span>
                </div>
                <div className="kpi-sub">
                    <i className={`fa-solid ${apiData.kpis.qoqGrowth >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i> 
                    <span style={{ color: apiData.kpis.qoqGrowth >= 0 ? '#A8C17A' : '#FF5A5A', fontWeight: 'bold' }}>
                        {apiData.kpis.qoqGrowth >= 0 ? '+' : ''}{apiData.kpis.qoqGrowth}%
                    </span> vs prev. record
                </div>
            </div>

            <div className="kpi-card">
                <div className="bg-icon"><i className="fa-solid fa-users"></i></div>
                <div className="kpi-label">Registered Farmers</div>
                <div className="kpi-value">{apiData.kpis.totalFarmers.toLocaleString()}</div>
                <div className="kpi-sub neutral">
                    <i className="fa-solid fa-tractor"></i> 
                    Efficiency: <strong style={{color: 'var(--text)'}}>{apiData.kpis.laborEfficiency} MT/Farmer</strong>
                </div>
            </div>

            <div className="kpi-card">
                <div className="bg-icon"><i className="fa-solid fa-layer-group"></i></div>
                <div className="kpi-label">Top Commodity</div>
                <div className="kpi-value" style={{ textTransform: 'capitalize' }}>{apiData.kpis.topCrop}</div>
                <div className="kpi-sub neutral">
                    <i className="fa-solid fa-check-circle" style={{color: 'var(--success)'}}></i> 
                    Dominating selected filters
                </div>
            </div>

            {/* Clickable Card triggers modal */}
            <div className="kpi-card" style={{ borderColor: 'var(--border-color)', background: 'var(--surface-hover)', cursor: 'pointer' }} onClick={() => setIsStatusModalOpen(true)}>
                <div className="bg-icon" style={{ color: 'var(--primary)' }}><i className="fa-solid fa-crown"></i></div>
                <div className="kpi-label" style={{ color: 'var(--primary)' }}>Dominant City</div>
                <div className="kpi-value">{apiData.kpis.topCity}</div>
                <div className="kpi-sub" style={{ textDecoration: 'underline', textUnderlineOffset: '2px', color: 'var(--secondary)' }}>
                    View top producers leaderboard →
                </div>
            </div>
        </div>

        {/* MAIN VISUALS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="panel" style={{ padding: '15px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div className="panel-header" style={{ marginBottom: '10px' }}>
                    <span className="panel-title" style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)' }}>Regional Yield Map</span>
                </div>
                <div id="map-analytics" style={{ height: '350px', borderRadius: '8px', border: '1px solid var(--border)' }}></div>
            </div>

            <div className="panel" style={{ padding: '15px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div className="panel-header" style={{ marginBottom: '10px' }}>
                    <span className="panel-title" style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)' }}>Specific Crop Breakdown</span>
                </div>
                <div style={{ height: '160px' }}><canvas id="doughnutChartAnalytics"></canvas></div>
                <div style={{ marginTop: '15px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    {topCrops.map((key, index) => {
                        const val = apiData.commoditySplit[key];
                        const pct = apiData.kpis.totalVolume > 0 ? ((val / apiData.kpis.totalVolume) * 100).toFixed(1) : 0;
                        const palette = ['#3D562A', '#4E6A34', '#5F783D', '#758E4E'];
                        return <LegendRow key={key} title={key} value={val} percentage={pct} color={palette[index]} />;
                    })}
                </div>
            </div>
        </div>

        {/* FULL WIDTH FORECAST */}
        <div className="panel" style={{ padding: '15px', marginBottom: '1.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div className="panel-header" style={{ marginBottom: '10px' }}>
                <span className="panel-title" style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)' }}>Trend Analysis & AI Forecast</span>
            </div>
            <div style={{ height: '250px' }}><canvas id="lineChartAnalytics"></canvas></div>
        </div>

        {/* ROW 4: REGIONAL DISTRIBUTION & FARMERS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', width: '100%', marginBottom: '1.25rem' }}>
            <div className="panel" style={{ padding: '15px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div className="panel-header" style={{ marginBottom: '10px' }}>
                    <span className="panel-title" style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)' }}>Production vs Labor Force per City</span>
                </div>
                <div style={{ height: '250px' }}><canvas id="regionalCompChartAnalytics"></canvas></div>
            </div>
            <div className="panel" style={{ padding: '15px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div className="panel-header" style={{ marginBottom: '10px' }}>
                    <span className="panel-title" style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)' }}>Total Active Farmers</span>
                </div>
                <div style={{ height: '250px' }}><canvas id="farmerChartAnalytics"></canvas></div>
            </div>
        </div>

        {/* BOTTOM INSIGHTS */}
        <div className="panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--secondary)', background: 'var(--surface)', borderRadius: '16px', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontWeight: '800', color: 'var(--secondary)', marginBottom: '10px', fontSize: '0.95rem' }}>
                <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '8px' }}></i> AI Sector Insights
            </div>
            <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '20px', margin: 0, lineHeight: '1.7' }}>
                {apiData.aiInsights.map((insight, i) => <li key={i} style={{ marginBottom: '8px' }}>{insight}</li>)}
            </ul>
        </div>

        {/* INTERNAL CSS FOR ANALYTICS ONLY */}
        <style>{`
            /* Unified Header Layout - STICKY Position */
            .rm-header { position: sticky; top: 0; z-index: 1050; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: var(--surface); padding: 1.25rem 1.5rem; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
            .rm-header-left { display: flex; align-items: center; gap: 1rem; }
            .rm-header-avatar { width: 44px; height: 44px; border-radius: 12px; background: var(--primary-glow); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
            .rm-greeting-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--secondary); }
            .rm-title { font-size: 1.25rem; font-weight: 800; color: var(--text); margin: 2px 0; }
            .rm-subtitle { font-size: 0.8rem; color: var(--text-muted); margin: 0; }

            /* Z-index fix for the Map */
            #map-analytics { position: relative; z-index: 10 !important; }

            /* SCALED DOWN KPI Cards CSS for internal dashboard */
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
            .kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: center; }
            .kpi-card.accent { background: var(--primary); color: white; border: none; }
            .kpi-card .bg-icon { position: absolute; right: -10px; bottom: -20px; font-size: 5rem; opacity: 0.03; color: var(--text-main); pointer-events: none; }
            .kpi-card.accent .bg-icon { color: white; opacity: 0.1; }
            .kpi-label { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem; }
            .kpi-card.accent .kpi-label { color: rgba(255,255,255,0.8); }
            
            .kpi-value { font-size: 1.5rem; font-weight: 800; color: var(--text); line-height: 1; display: flex; align-items: baseline; gap: 4px; }
            .kpi-card.accent .kpi-value { color: white; }
            .kpi-unit { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); }
            .kpi-card.accent .kpi-unit { color: rgba(255,255,255,0.7); }
            .kpi-sub { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-top: 0.6rem; display: flex; align-items: center; gap: 5px; }
            .kpi-card.accent .kpi-sub { color: rgba(255,255,255,0.9); }

            /* Filter Inputs & Custom Dropdown Styles */
            .filter-select-sm { padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border); font-size: 0.8rem; background: var(--surface); cursor: pointer; color: var(--text-mid); outline: none; font-family: inherit; font-weight: 500; transition: border 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.01); }
            .filter-select-sm:focus { border-color: var(--primary); }
            
            /* High Z-index for dropdown so it covers map */
            .custom-dropdown-menu {
                position: absolute;
                top: calc(100% + 4px);
                left: 0;
                width: 100%;
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: 8px;
                z-index: 1050; 
                box-shadow: 0 8px 24px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .custom-dropdown-item {
                padding: 10px 14px;
                cursor: pointer;
                font-size: 0.8rem;
                color: var(--text-mid);
                font-weight: 500;
                transition: all 0.15s;
            }
            .custom-dropdown-item:hover {
                background: var(--surface-hover);
                color: var(--primary);
            }
            .custom-dropdown-item.active {
                background: var(--primary-glow);
                color: var(--primary);
                font-weight: 700;
            }
            .dropdown-input:focus {
                box-shadow: 0 0 0 3px var(--primary-glow);
            }

            /* PORTAL MODAL STYLES */
            .cr-modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease; }
            .cr-modal { background: var(--surface); width: 100%; max-width: 500px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); overflow: hidden; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid var(--border); }
            .cr-modal-header { padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
            .cr-modal-close { background: none; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; }
            .cr-modal-close:hover { color: var(--danger); }
            .cr-modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; background: var(--bg); }
            .cr-btn-primary { padding: 8px 18px; border-radius: 8px; border: none; color: white; background: var(--primary); font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 10px rgba(61,86,42,0.2); }
            .cr-btn-primary:hover { background: var(--secondary); transform: translateY(-1px); }
        `}</style>
    </div>
  );
}