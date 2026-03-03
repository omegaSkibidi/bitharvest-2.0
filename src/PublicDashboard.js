import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import WelcomeModal from './WelcomeModal';
import { useNavigate } from 'react-router-dom';

const albayCoords = {
    "Polangui": [13.29, 123.48], "Oas": [13.25, 123.49], "Ligao City": [13.18, 123.53], "Libon": [13.28, 123.43],
    "Tabaco City": [13.36, 123.73], "Legazpi City": [13.14, 123.74], "Guinobatan": [13.19, 123.59], "Daraga": [13.14, 123.71],
    "Camalig": [13.16, 123.63], "Pio Duran": [13.04, 123.45], "Jovellar": [13.06, 123.59], "Malinao": [13.40, 123.70],
    "Malilipot": [13.32, 123.73], "Santo Domingo": [13.23, 123.77], "Manito": [13.12, 123.87], "Bacacay": [13.29, 123.79],
    "Tiwi": [13.45, 123.68], "Rapu-Rapu": [13.18, 124.12]
};

const LegendRow = ({ title, value, percentage, color }) => (
    <div className="legend-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
        <div className="legend-top" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600' }}>
            <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%'}}>{title}</span>
            <span>{percentage}%</span>
        </div>
        <div className="legend-bar-track" style={{ height: '6px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div className="legend-bar-fill" style={{ height: '100%', width: `${percentage}%`, background: color }}></div>
        </div>
    </div>
);

function PublicDashboard() {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [filters, setFilters] = useState({ locations: [], years: [], quarters: [], groups: [], groupedCommodities: {} });
  
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [selectedQuarter, setSelectedQuarter] = useState("All Quarters");
  const [selectedGroup, setSelectedGroup] = useState("All Groups");
  const [selectedCommodity, setSelectedCommodity] = useState("All Commodities");
  
  const [apiData, setApiData] = useState(null);
  const chartRefs = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
      fetch('http://localhost:8000/api/filters').then(res => res.json()).then(data => setFilters(data));
  }, []);

  useEffect(() => {
      setSelectedCommodity("All Commodities");
  }, [selectedGroup]);

  useEffect(() => {
      const url = `http://localhost:8000/api/dashboard-data?location=${encodeURIComponent(selectedLocation)}&year=${encodeURIComponent(selectedYear)}&quarter=${encodeURIComponent(selectedQuarter)}&group=${encodeURIComponent(selectedGroup)}&commodity=${encodeURIComponent(selectedCommodity)}`;
      fetch(url).then(res => res.json()).then(data => setApiData(data));
  }, [selectedLocation, selectedYear, selectedQuarter, selectedGroup, selectedCommodity]);

  useEffect(() => {
      if (!apiData) return;
      const L = window.L;
      const Chart = window.Chart;

      Object.values(chartRefs.current).forEach(chart => chart && chart.destroy());

      // --- MAP ---
      let mapInstance = null;
      const mapElement = document.getElementById('map');
      if (mapElement && L && !mapElement._leaflet_id) {
          mapInstance = L.map('map', { zoomControl: true }).setView([13.20, 123.60], 10);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapInstance);

          apiData.regionalLabels.forEach((municipality, index) => {
              const coords = albayCoords[municipality] || [13.20 + (Math.random()*0.1), 123.60 + (Math.random()*0.1)]; 
              const production = apiData.regionalProduction[index];
              const radiusSize = Math.max(8, Math.min(30, (production / 5000) * 5));

              L.circleMarker(coords, { radius: radiusSize, color: '#3D562A', fillColor: '#5F783D', fillOpacity: 0.7, weight: 2 
              }).addTo(mapInstance).bindPopup(`<strong>${municipality}</strong><br/>${production.toLocaleString()} MT`);
          });
      }

      // --- USER-FRIENDLY CHARTS ---
      if (Chart) {
          Chart.defaults.color = '#4A5240';
          Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
          const customPalette = ['#3D562A', '#4E6A34', '#5F783D', '#758E4E', '#8F9A75', '#A5B08E', '#DCE3D0'];

          // 1. Area Chart
          chartRefs.current.lineChart = new Chart(document.getElementById('lineChart').getContext('2d'), {
              type: 'line',
              data: {
                  labels: [...apiData.historicalTrendLabels, ...apiData.forecastLabels],
                  datasets: [
                      {
                          label: 'Recorded Harvest (MT)',
                          data: [...apiData.historicalTrendData, ...Array(apiData.forecastLabels.length).fill(null)],
                          borderColor: '#3D562A', backgroundColor: 'rgba(61, 86, 42, 0.2)', fill: true, tension: 0.4, borderWidth: 3
                      },
                      {
                          label: 'AI Forecast (MT)',
                          data: [...Array(apiData.historicalTrendData.length - 1).fill(null), apiData.historicalTrendData[apiData.historicalTrendData.length-1], ...apiData.forecastData],
                          borderColor: '#758E4E', borderDash: [6, 6], backgroundColor: 'rgba(117, 142, 78, 0.1)', fill: true, tension: 0.4, borderWidth: 3
                      }
                  ]
              },
              options: { maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
          });

          // 2. Horizontal Bar
          chartRefs.current.groupChart = new Chart(document.getElementById('groupChart').getContext('2d'), {
              type: 'bar',
              data: {
                  labels: Object.keys(apiData.groupSplit),
                  datasets: [{ label: 'Production (MT)', data: Object.values(apiData.groupSplit), backgroundColor: '#758E4E', borderRadius: 4 }]
              },
              options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });

          // 3. Doughnut
          chartRefs.current.doughnutChart = new Chart(document.getElementById('doughnutChart').getContext('2d'), {
              type: 'doughnut',
              data: {
                  labels: Object.keys(apiData.commoditySplit),
                  datasets: [{ data: Object.values(apiData.commoditySplit), backgroundColor: customPalette, borderWidth: 2, borderColor: '#FAF9F6' }]
              },
              options: { maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } } }
          });

          // 4. Vertical Bar for Farmers
          chartRefs.current.farmerChart = new Chart(document.getElementById('farmerChart').getContext('2d'), {
              type: 'bar',
              data: {
                  labels: Object.keys(apiData.farmerSplit),
                  datasets: [{ label: 'Registered Farmers', data: Object.values(apiData.farmerSplit), backgroundColor: '#5F783D', borderRadius: 4 }]
              },
              options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });

          // 5. Stacked City Data - Filters Legend dynamically
          let activeGroups = Object.keys(filters.groupedCommodities);
          if (selectedGroup !== "All Groups") {
              activeGroups = [selectedGroup]; 
          }

          const stackedDatasets = activeGroups.map((group, idx) => {
              return {
                  label: group,
                  data: apiData.regionalLabels.map(city => apiData.stackedCityData[city]?.[group] || 0),
                  backgroundColor: customPalette[idx % customPalette.length]
              }
          });

          chartRefs.current.stackedChart = new Chart(document.getElementById('stackedChart').getContext('2d'), {
              type: 'bar',
              data: { labels: apiData.regionalLabels, datasets: stackedDatasets },
              options: { 
                  maintainAspectRatio: false, 
                  scales: { x: { stacked: true }, y: { stacked: true } },
                  plugins: { legend: { position: 'bottom', labels: {boxWidth: 10} } } 
              }
          });
      }

      return () => { if (mapInstance) mapInstance.remove(); };
  }, [apiData, filters.groupedCommodities, selectedGroup]);

  if (!apiData) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--primary)' }}>Loading Quarterly Analytics...</div>;

  const topCrops = Object.keys(apiData.commoditySplit).slice(0, 5);
  
  const activeDataLabel = selectedCommodity !== "All Commodities" 
        ? selectedCommodity 
        : selectedGroup !== "All Groups" 
            ? selectedGroup 
            : "All Categories";

  return (
    <div>
        <WelcomeModal />

        {isStatusModalOpen && (
            <div id="welcome-modal">
                <div className="modal-card" style={{ maxWidth: '500px' }}>
                    <div className="modal-icon" style={{ background: 'linear-gradient(135deg, var(--gold), #fef08a)'}}>
                        <i className="fa-solid fa-trophy" style={{color: '#854d0e'}}></i>
                    </div>
                    <h2>Top Producing Cities</h2>
                    <p style={{marginBottom: '1rem'}}>Highest yielding municipalities based on current selections.</p>
                    <div style={{textAlign: 'left', marginBottom: '2rem', background: 'var(--bg-color)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border-color)'}}>
                        {apiData.topProducersList.map((data, index) => (
                            <div key={data.municipality} style={{display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: index < apiData.topProducersList.length - 1 ? '1px solid var(--border-color)' : 'none'}}>
                                <strong style={{color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    <span style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>#{index + 1}</span> {data.municipality}
                                </strong>
                                <span style={{fontWeight: '600', color: 'var(--text-main)'}}>{data.production.toLocaleString()} MT</span>
                            </div>
                        ))}
                    </div>
                    <button className="btn-primary" onClick={() => setIsStatusModalOpen(false)}>Close</button>
                </div>
            </div>
        )}

        <header>
            <div className="header-inner">
                <div className="logo">
                    <div className="logo-icon"><i className="fa-solid fa-leaf"></i></div>
                    <span className="logo-text">BitHarvest</span>
                </div>
                <nav className="header-nav" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span className="nav-pill active">Analytics</span>
                    <button className="admin-btn" onClick={() => navigate('/login')}>Admin Portal</button>
                </nav>
            </div>
        </header>

        <main style={{ overflow: isStatusModalOpen ? 'hidden' : 'auto' }}>
            <div className="page-banner">
                <div className="banner-left">
                    <h1>Quarterly <em>Agriculture</em> Analytics</h1>
                    <p>Track multi-sector crop yields, group distributions, and forecasting.</p>
                </div>
            </div>

            {/* --- 5 SMART CASCADING FILTERS --- */}
            <div className="filters-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', width: '100%', marginBottom: '2rem' }}>
                <select className="filter-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    {filters.years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select className="filter-select" value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)}>
                    {filters.quarters.map(q => <option key={q} value={q}>{q}</option>)}
                </select>

                <select className="filter-select" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                    {filters.locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>

                <select className="filter-select" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                    {filters.groups.map(grp => <option key={grp} value={grp}>{grp}</option>)}
                </select>

                <select className="filter-select" value={selectedCommodity} onChange={(e) => setSelectedCommodity(e.target.value)} disabled={selectedGroup === "All Groups"}>
                    <option value="All Commodities">All {selectedGroup === "All Groups" ? "Specific Crops" : "Crops in Category"}</option>
                    {selectedGroup !== "All Groups" && filters.groupedCommodities[selectedGroup]?.map(crop => (
                        <option key={crop} value={crop}>{crop}</option>
                    ))}
                </select>
            </div>

            {/* --- 8 FULL WIDTH KPI CARDS --- */}
            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', width: '100%', marginBottom: '2rem' }}>
                
                <div className="kpi-card accent" style={{ background: 'var(--primary)', color: 'white' }}>
                    <div className="bg-icon"><i className="fa-solid fa-seedling"></i></div>
                    <div className="kpi-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Total Harvest</div>
                    <div className="kpi-value" style={{ fontSize: '1.4rem', color: 'white' }}>
                        {apiData.kpis.totalVolume.toLocaleString()}<span className="kpi-unit" style={{ color: 'rgba(255,255,255,0.6)' }}>MT</span>
                    </div>
                    <div className="kpi-sub" style={{ color: 'rgba(255,255,255,0.9)' }}>
                        <i className={`fa-solid ${apiData.kpis.qoqGrowth >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i> 
                        <span style={{ color: apiData.kpis.qoqGrowth >= 0 ? '#A8C17A' : '#FF5A5A', marginLeft: '5px', fontWeight: 'bold' }}>
                            {apiData.kpis.qoqGrowth >= 0 ? '+' : ''}{apiData.kpis.qoqGrowth}%
                        </span> vs prev. record
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="bg-icon"><i className="fa-solid fa-users"></i></div>
                    <div className="kpi-label">Registered Farmers</div>
                    <div className="kpi-value">{apiData.kpis.totalFarmers.toLocaleString()}</div>
                    <div className="kpi-sub neutral">
                        <i className="fa-solid fa-tractor" style={{marginRight: '5px'}}></i> 
                        Efficiency: <strong style={{color: 'var(--text-main)'}}>{apiData.kpis.laborEfficiency} MT/Farmer</strong>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="bg-icon"><i className="fa-solid fa-layer-group"></i></div>
                    <div className="kpi-label">Top Commodity</div>
                    <div className="kpi-value" style={{ fontSize: '1.2rem', textTransform: 'capitalize' }}>{apiData.kpis.topCrop}</div>
                    <div className="kpi-sub neutral">
                        <i className="fa-solid fa-check-circle" style={{color: 'var(--success)', marginRight: '5px'}}></i> 
                        Across <strong>{Object.keys(apiData.groupSplit).length}</strong> active categories
                    </div>
                </div>

                <div className="kpi-card" style={{ borderColor: 'var(--border-color)', background: 'var(--surface-hover)', cursor: 'pointer' }} onClick={() => setIsStatusModalOpen(true)}>
                    <div className="bg-icon" style={{ color: 'var(--primary)' }}><i className="fa-solid fa-crown"></i></div>
                    <div className="kpi-label" style={{ color: 'var(--primary)' }}>Dominant City</div>
                    <div className="kpi-value" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: 0 }}>{apiData.kpis.topCity}</div>
                    <div className="kpi-sub" style={{ textDecoration: 'underline', textUnderlineOffset: '2px', color: 'var(--secondary)' }}>
                        View top producers leaderboard →
                    </div>
                </div>
            </div>
            
            {/* ROW 1: Map and Doughnut */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem', width: '100%', marginBottom: '1.5rem' }}>
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Geographic Harvest Heatmap</span>
                    </div>
                    <div id="map" style={{ height: '400px' }}></div> 
                </div>
                <div className="card">
                    <div className="card-header">
                        <div>
                            <span className="card-title">Specific Crop Breakdown</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Showing: <strong>{activeDataLabel}</strong>
                            </div>
                        </div>
                    </div>
                    <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <canvas id="doughnutChart"></canvas>
                    </div>
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        {topCrops.map((key, index) => {
                            const val = apiData.commoditySplit[key];
                            const pct = apiData.kpis.totalVolume > 0 ? ((val / apiData.kpis.totalVolume) * 100).toFixed(1) : 0;
                            const palette = ['#3D562A', '#4E6A34', '#5F783D', '#758E4E', '#8F9A75'];
                            return <LegendRow key={key} title={key} value={val} percentage={pct} color={palette[index]} />;
                        })}
                    </div>
                </div>
            </div>

            {/* ROW 2: Insights and Categories */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', width: '100%', marginBottom: '1.5rem' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--primary)', background: 'var(--container-bg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)' }}>Automated Sector Insights</h3>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                        {apiData.aiInsights.map((insight, index) => (
                            <li key={index} style={{ marginBottom: '0.5rem' }}>{insight}</li>
                        ))}
                    </ul>
                </div>
                <div className="card">
                    <div className="card-header">
                        <div>
                            <span className="card-title">Production by Category</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Showing: <strong>{activeDataLabel}</strong>
                            </div>
                        </div>
                        <span className="card-badge badge-green">Crop Types</span>
                    </div>
                    <div style={{ height: '220px' }}><canvas id="groupChart"></canvas></div>
                </div>
            </div>

            {/* ROW 3: Full Width Area Chart */}
            <div className="card" style={{ width: '100%', marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <span className="card-title">Historical Trend & Forecast (All-Time)</span>
                    <span className="card-badge" style={{borderColor: 'var(--complementary)', color: 'var(--primary)', background: 'var(--primary-light)'}}>Linear Regression</span>
                </div>
                <div style={{ height: '300px' }}><canvas id="lineChart"></canvas></div>
            </div>

            {/* ROW 4: Stacked City Data & Farmers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', width: '100%' }}>
                <div className="card">
                    <div className="card-header">
                        <div>
                            <span className="card-title">Regional Category Distribution</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Filtered by: <strong>{activeDataLabel}</strong>
                            </div>
                        </div>
                        <span className="card-badge badge-slate">Top 5 Cities</span>
                    </div>
                    <div style={{ height: '250px' }}><canvas id="stackedChart"></canvas></div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Labor Force Allocation</span>
                        <span className="card-badge badge-green">Farmers per Crop</span>
                    </div>
                    <div style={{ height: '250px' }}><canvas id="farmerChart"></canvas></div>
                </div>
            </div>

        </main>
    </div>
  );
}

export default PublicDashboard;