import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import WelcomeModal from './WelcomeModal';

const albayCoords = {
    "Polangui": [13.29, 123.48], "Oas": [13.25, 123.49], "Ligao City": [13.18, 123.53], "Libon": [13.28, 123.43],
    "Tabaco City": [13.36, 123.73], "Legazpi City": [13.14, 123.74], "Guinobatan": [13.19, 123.59], "Daraga": [13.14, 123.71],
    "Camalig": [13.16, 123.63], "Pio Duran": [13.04, 123.45], "Jovellar": [13.06, 123.59], "Malinao": [13.40, 123.70],
    "Malilipot": [13.32, 123.73], "Santo Domingo": [13.23, 123.77], "Manito": [13.12, 123.87], "Bacacay": [13.29, 123.79]
};

const LegendRow = ({ title, value, percentage, color }) => (
    <div className="legend-row">
        <div className="legend-top">
            <span>{title} <span style={{fontSize:'0.65rem', color:'var(--text-muted)'}}>({value.toLocaleString()} MT)</span></span>
            <span>{percentage}%</span>
        </div>
        <div className="legend-bar-track">
            <div className="legend-bar-fill" style={{ width: `${percentage}%`, background: color }}></div>
        </div>
    </div>
);

function App() {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [filters, setFilters] = useState({ locations: [], years: [], commodities: [] });
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [selectedCommodity, setSelectedCommodity] = useState("All Commodities");
  const [apiData, setApiData] = useState(null);
  const chartRefs = useRef({});

  useEffect(() => {
      fetch('http://localhost:8000/api/filters').then(res => res.json()).then(data => setFilters(data));
  }, []);

  useEffect(() => {
      const url = `http://localhost:8000/api/dashboard-data?location=${encodeURIComponent(selectedLocation)}&year=${encodeURIComponent(selectedYear)}&commodity=${encodeURIComponent(selectedCommodity)}`;
      fetch(url).then(res => res.json()).then(data => setApiData(data));
  }, [selectedLocation, selectedYear, selectedCommodity]);

  useEffect(() => {
      if (!apiData) return;
      const L = window.L;
      const Chart = window.Chart;

      Object.values(chartRefs.current).forEach(chart => chart && chart.destroy());

      // MAP
      let mapInstance = null;
      const mapElement = document.getElementById('map');
      if (mapElement && L && !mapElement._leaflet_id) {
          mapInstance = L.map('map', { zoomControl: true }).setView([13.20, 123.60], 10);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapInstance);

          apiData.regionalLabels.forEach((municipality, index) => {
              const coords = albayCoords[municipality] || [13.20 + (Math.random()*0.1), 123.60 + (Math.random()*0.1)]; 
              const production = apiData.regionalProduction[index];
              const radiusSize = Math.max(10, Math.min(30, (production / 5000) * 5));

              // Map Marker uses Primary (#3D562A) and Secondary (#5F783D)
              L.circleMarker(coords, { radius: radiusSize, color: '#3D562A', fillColor: '#5F783D', fillOpacity: 0.7, weight: 2 
              }).addTo(mapInstance).bindPopup(`<strong>${municipality}</strong><br/>${production.toLocaleString()} MT`);
          });
      }

      // CHARTS
      if (Chart) {
          Chart.defaults.color = '#4A5240'; // Text muted color
          Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
          
          // Using your exact palette + derived shades
          const customPalette = ['#3D562A', '#4E6A34', '#5F783D', '#758E4E', '#8F9A75'];

          chartRefs.current.lineChart = new Chart(document.getElementById('lineChart').getContext('2d'), {
              type: 'line',
              data: {
                  labels: [...apiData.historicalTrendLabels, ...apiData.forecastLabels],
                  datasets: [
                      {
                          label: 'Recorded Harvest (MT)',
                          data: [...apiData.historicalTrendData, ...Array(apiData.forecastLabels.length).fill(null)],
                          borderColor: '#3D562A', backgroundColor: 'rgba(61, 86, 42, 0.1)', fill: true, tension: 0.3, borderWidth: 3
                      },
                      {
                          label: 'AI Forecast (MT)',
                          data: [...Array(apiData.historicalTrendData.length - 1).fill(null), apiData.historicalTrendData[apiData.historicalTrendData.length-1], ...apiData.forecastData],
                          borderColor: '#758E4E', borderDash: [6, 6], backgroundColor: 'transparent', tension: 0.3, borderWidth: 3
                      }
                  ]
              },
              options: { maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
          });

          chartRefs.current.farmerChart = new Chart(document.getElementById('farmerChart').getContext('2d'), {
              type: 'bar',
              data: {
                  labels: Object.keys(apiData.farmerSplit),
                  datasets: [{ label: 'Farmers', data: Object.values(apiData.farmerSplit), backgroundColor: '#5F783D', borderRadius: 4 }]
              },
              options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });

          chartRefs.current.cityChart = new Chart(document.getElementById('cityChart').getContext('2d'), {
              type: 'bar',
              data: {
                  labels: apiData.regionalLabels,
                  datasets: [{ label: 'Production (MT)', data: apiData.regionalProduction, backgroundColor: customPalette, borderRadius: 4 }]
              },
              options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });

          chartRefs.current.doughnutChart = new Chart(document.getElementById('doughnutChart').getContext('2d'), {
              type: 'doughnut',
              data: {
                  labels: Object.keys(apiData.commoditySplit),
                  datasets: [{ data: Object.values(apiData.commoditySplit), backgroundColor: customPalette, borderWidth: 2, borderColor: '#FAF9F6' }]
              },
              options: { maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false } } }
          });
      }

      return () => { if (mapInstance) mapInstance.remove(); };
  }, [apiData]);

  if (!apiData) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--primary)' }}>Loading BitHarvest Predictive Analytics...</div>;

  const commKeys = Object.keys(apiData.commoditySplit);
  const commVals = Object.values(apiData.commoditySplit);
  // Match custom palette
  const customPalette = ['#3D562A', '#4E6A34', '#5F783D', '#758E4E', '#8F9A75'];

  return (
    <div>
        <WelcomeModal />

        {isStatusModalOpen && (
            <div id="welcome-modal">
                <div className="modal-card" style={{ maxWidth: '500px' }}>
                    <div className="modal-icon" style={{ background: 'linear-gradient(135deg, var(--gold), #fef08a)'}}>
                        <i className="fa-solid fa-trophy" style={{color: '#854d0e'}}></i>
                    </div>
                    <h2>Top Producing Cities {selectedCommodity !== 'All Commodities' ? `for ${selectedCommodity}` : 'Overall'}</h2>
                    <p style={{marginBottom: '1rem'}}>The highest yielding municipalities based on current filters.</p>
                    
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
                    <button className="btn-primary" onClick={() => setIsStatusModalOpen(false)}>Close Details</button>
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
                    <span className="nav-pill active">Overview</span>
                    <button className="admin-btn">Admin Portal</button>
                </nav>
            </div>
        </header>

        <main style={{ overflow: isStatusModalOpen ? 'hidden' : 'auto' }}>
            <div className="page-banner">
                <div className="banner-left">
                    <h1>Provincial <em>Agriculture</em> Analytics</h1>
                    <p>Official data portal for Albay crop production, demographics, and AI forecasting.</p>
                </div>
                
                <div className="banner-meta" style={{ display: 'flex', gap: '15px' }}>
                    <div className="banner-badge" style={{ alignItems: 'flex-start', padding: '12px 20px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                        <span className="blabel" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, marginBottom: '6px' }}>
                            <i className="fa-solid fa-sliders" style={{ marginRight: '6px' }}></i> Data Scope
                        </span>
                        <span className="bval" style={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '0' }}>
                            {selectedCommodity === 'All Commodities' ? 'All Crops' : selectedCommodity} • {selectedYear}
                        </span>
                    </div>
                    
                    <div className="banner-badge" style={{ alignItems: 'flex-start', padding: '12px 20px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                        <span className="blabel" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, marginBottom: '6px' }}>
                            <i className="fa-solid fa-database" style={{ marginRight: '6px' }}></i> System Status
                        </span>
                        <span className="bval" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#e8efe1', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0' }}>
                            <span style={{ display: 'block', width: '8px', height: '8px', backgroundColor: '#e8efe1', borderRadius: '50%', boxShadow: '0 0 10px #e8efe1' }}></span>
                            Live Cloud Sync
                        </span>
                    </div>
                </div>
            </div>

            <div className="filters-bar">
                <select className="filter-select" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                    {filters.locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <select className="filter-select" value={selectedCommodity} onChange={(e) => setSelectedCommodity(e.target.value)}>
                    {filters.commodities.map(com => <option key={com} value={com}>{com}</option>)}
                </select>
                <select className="filter-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    {filters.years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card accent">
                    <div className="bg-icon"><i className="fa-solid fa-box"></i></div>
                    <div className="kpi-label">Total Harvest</div>
                    <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{apiData.kpis.totalVolume.toLocaleString()}<span className="kpi-unit">MT</span></div>
                    <div className="kpi-sub"><i className="fa-solid fa-database"></i> Live Data</div>
                </div>
                <div className="kpi-card">
                    <div className="bg-icon"><i className="fa-solid fa-users"></i></div>
                    <div className="kpi-label">Total Farmers</div>
                    <div className="kpi-value">{apiData.kpis.totalFarmers.toLocaleString()}</div>
                    <div className="kpi-sub neutral">Registered People</div>
                </div>
                <div className="kpi-card">
                    <div className="bg-icon"><i className="fa-solid fa-leaf"></i></div>
                    <div className="kpi-label">Crop Types</div>
                    <div className="kpi-value">{commKeys.length}</div>
                    <div className="kpi-sub"><i className="fa-solid fa-check"></i> Counted in MT</div>
                </div>
                <div className="kpi-card">
                    <div className="bg-icon"><i className="fa-solid fa-map"></i></div>
                    <div className="kpi-label">Cities Reporting</div>
                    <div className="kpi-value">{apiData.kpis.activeAreas}<span className="kpi-unit">Cities</span></div>
                    <div className="kpi-sub neutral">In Albay District</div>
                </div>
                
                <div className="kpi-card" style={{ borderColor: 'var(--border-color)', background: 'var(--primary-light)', gridColumn: 'span 2', cursor: 'pointer' }} onClick={() => setIsStatusModalOpen(true)}>
                    <div className="bg-icon" style={{ color: 'var(--primary)' }}><i className="fa-solid fa-medal"></i></div>
                    <div className="kpi-label" style={{ color: 'var(--primary)' }}>Top Producers</div>
                    <div className="kpi-value" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: 0, lineHeight: 1.3 }}>View Best Cities</div>
                    <div className="kpi-sub" style={{ textDecoration: 'underline', textUnderlineOffset: '2px', color: 'var(--secondary)' }}>Click to see details →</div>
                </div>
            </div>
            
            <div className="grid-main">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Map of Harvests</span>
                        <span className="card-badge badge-green">Larger Bubble = More Crops</span>
                    </div>
                    <div id="map"></div> 
                </div>
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Crops by Percentage</span>
                        <span className="card-badge badge-slate">Metric Tons</span>
                    </div>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <canvas id="doughnutChart"></canvas>
                    </div>
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        {commKeys.map((key, index) => {
                            const val = commVals[index];
                            const pct = apiData.kpis.totalVolume > 0 ? ((val / apiData.kpis.totalVolume) * 100).toFixed(1) : 0;
                            return <LegendRow key={key} title={key} value={val} percentage={pct} color={customPalette[index]} />;
                        })}
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)', background: 'var(--container-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)' }}>Automated Analyst Insights</h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: '2.5rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                    {apiData.aiInsights.map((insight, index) => (
                        <li key={index} style={{ marginBottom: '0.5rem' }}>{insight}</li>
                    ))}
                </ul>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <span className="card-title">Harvest Totals & Future Forecast</span>
                    <span className="card-badge" style={{borderColor: 'var(--complementary)', color: 'var(--primary)', background: 'var(--primary-light)'}}>Linear Regression</span>
                </div>
                <div style={{ height: '250px' }}><canvas id="lineChart"></canvas></div>
            </div>

            <div className="grid-bottom" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Number of Farmers by Crop</span>
                        <span className="card-badge badge-green">People</span>
                    </div>
                    <div style={{ height: '250px' }}><canvas id="farmerChart"></canvas></div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Highest Producing Cities</span>
                        <span className="card-badge badge-slate">Top 5 Cities (MT)</span>
                    </div>
                    <div style={{ height: '250px' }}><canvas id="cityChart"></canvas></div>
                </div>
            </div>
        </main>
    </div>
  );
}

export default App;