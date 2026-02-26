import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const albayCoords = {
    "Polangui": [13.29, 123.48], "Oas": [13.25, 123.49], "Ligao City": [13.18, 123.53], "Libon": [13.28, 123.43],
    "Tabaco City": [13.36, 123.73], "Legazpi City": [13.14, 123.74], "Guinobatan": [13.19, 123.59], "Daraga": [13.14, 123.71],
    "Camalig": [13.16, 123.63], "Pio Duran": [13.04, 123.45], "Jovellar": [13.06, 123.59], "Malinao": [13.40, 123.70],
    "Malilipot": [13.32, 123.73], "Santo Domingo": [13.23, 123.77], "Manito": [13.12, 123.87], "Bacacay": [13.29, 123.79]
};

const LegendRow = ({ title, value, percentage, color }) => (
    <div className="legend-row">
        <div className="legend-top">
            <span>{title} <span style={{fontSize:'0.65rem', color:'#94a3b8'}}>({value.toLocaleString()} MT)</span></span>
            <span>{percentage}%</span>
        </div>
        <div className="legend-bar-track">
            <div className="legend-bar-fill" style={{ width: `${percentage}%`, background: color }}></div>
        </div>
    </div>
);

function App() {
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true);
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

              L.circleMarker(coords, { radius: radiusSize, color: '#15803d', fillColor: '#22c55e', fillOpacity: 0.6, weight: 2 
              }).addTo(mapInstance).bindPopup(`<strong>${municipality}</strong><br/>${production.toLocaleString()} MT`);
          });
      }

      // CHARTS
      if (Chart) {
          Chart.defaults.color = '#64748b';
          Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
          const greenPalette = ['#052e16', '#15803d', '#22c55e', '#4ade80', '#bbf7d0'];

          // Predictive Line Chart
          chartRefs.current.lineChart = new Chart(document.getElementById('lineChart').getContext('2d'), {
              type: 'line',
              data: {
                  labels: [...apiData.historicalTrendLabels, ...apiData.forecastLabels],
                  datasets: [
                      {
                          label: 'Recorded Harvest (MT)',
                          data: [...apiData.historicalTrendData, ...Array(apiData.forecastLabels.length).fill(null)],
                          borderColor: '#15803d', backgroundColor: 'rgba(22,163,74,0.1)', fill: true, tension: 0.3, borderWidth: 3
                      },
                      {
                          label: 'AI Forecast (MT)',
                          // Stitch the prediction line to the last recorded data point
                          data: [...Array(apiData.historicalTrendData.length - 1).fill(null), apiData.historicalTrendData[apiData.historicalTrendData.length-1], ...apiData.forecastData],
                          borderColor: '#ca8a04', borderDash: [6, 6], backgroundColor: 'transparent', tension: 0.3, borderWidth: 3
                      }
                  ]
              },
              options: { maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
          });

          chartRefs.current.farmerChart = new Chart(document.getElementById('farmerChart').getContext('2d'), {
              type: 'bar',
              data: {
                  labels: Object.keys(apiData.farmerSplit),
                  datasets: [{ label: 'Farmers', data: Object.values(apiData.farmerSplit), backgroundColor: '#22c55e', borderRadius: 4 }]
              },
              options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });

          chartRefs.current.cityChart = new Chart(document.getElementById('cityChart').getContext('2d'), {
              type: 'bar',
              data: {
                  labels: apiData.regionalLabels,
                  datasets: [{ label: 'Production (MT)', data: apiData.regionalProduction, backgroundColor: greenPalette, borderRadius: 4 }]
              },
              options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });

          chartRefs.current.doughnutChart = new Chart(document.getElementById('doughnutChart').getContext('2d'), {
              type: 'doughnut',
              data: {
                  labels: Object.keys(apiData.commoditySplit),
                  datasets: [{ data: Object.values(apiData.commoditySplit), backgroundColor: greenPalette, borderWidth: 2, borderColor: '#fff' }]
              },
              options: { maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false } } }
          });
      }

      return () => { if (mapInstance) mapInstance.remove(); };
  }, [apiData]);

  if (!apiData) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading BitHarvest Predictive Analytics...</div>;

  const commKeys = Object.keys(apiData.commoditySplit);
  const commVals = Object.values(apiData.commoditySplit);
  const greenPalette = ['var(--green-950)', 'var(--green-700)', 'var(--green-500)', 'var(--green-400)', 'var(--green-200)'];

  return (
    <div>
        {isWelcomeModalOpen && (
            <div id="welcome-modal">
                <div className="modal-card">
                    <div className="modal-icon"><i className="fa-solid fa-seedling"></i></div>
                    <div className="modal-tag">Albay, Bicol Region</div>
                    <h2>BitHarvest Data Portal</h2>
                    <p>A smart dashboard featuring automated insights and future harvest predictions.</p>
                    <button className="btn-primary" onClick={() => setIsWelcomeModalOpen(false)}>View Dashboard</button>
                </div>
            </div>
        )}

        {isStatusModalOpen && (
            <div id="welcome-modal">
                <div className="modal-card" style={{ maxWidth: '500px' }}>
                    <div className="modal-icon" style={{ background: 'linear-gradient(135deg, var(--gold), #fef08a)'}}>
                        <i className="fa-solid fa-trophy" style={{color: '#854d0e'}}></i>
                    </div>
                    <h2>Top Producing Cities</h2>
                    <p style={{marginBottom: '1rem'}}>The cities that harvested the most crops based on your selected filters.</p>
                    <div style={{textAlign: 'left', marginBottom: '2rem', background: 'var(--slate-50)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--slate-200)'}}>
                        {Object.entries(apiData.topPerCommodity).map(([comm, data]) => (
                            <div key={comm} style={{display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--slate-200)'}}>
                                <strong style={{color: 'var(--green-800)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px'}}>{comm}</strong>
                                <span style={{fontWeight: '600', color: 'var(--slate-700)'}}>{data.municipality} <span style={{color: 'var(--slate-500)', fontWeight: 'normal'}}>({data.production.toLocaleString()} MT)</span></span>
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
                <nav className="header-nav"><span className="nav-pill active">Overview</span></nav>
            </div>
        </header>

        <main style={{ overflow: (isWelcomeModalOpen || isStatusModalOpen) ? 'hidden' : 'auto' }}>
            <div className="page-banner">
                <div className="banner-left">
                    <h1>Albay <em>Harvest</em> Report</h1>
                    <p>Live database tracking and AI-powered predictive analysis.</p>
                </div>
                <div className="banner-meta">
                    <div className="banner-badge"><span className="bval">{apiData.kpis.totalVolume.toLocaleString()}</span><span className="blabel">Total Metric Tons (MT)</span></div>
                    <div className="banner-badge"><span className="bval">{apiData.kpis.totalFarmers.toLocaleString()}</span><span className="blabel">Total Farmers</span></div>
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
                
                <div className="kpi-card" style={{ borderColor: 'var(--green-400)', background: 'var(--green-50)', gridColumn: 'span 2', cursor: 'pointer' }} onClick={() => setIsStatusModalOpen(true)}>
                    <div className="bg-icon" style={{ color: 'var(--green-700)' }}><i className="fa-solid fa-medal"></i></div>
                    <div className="kpi-label" style={{ color: 'var(--green-700)' }}>Top Producers</div>
                    <div className="kpi-value" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--green-900)', letterSpacing: 0, lineHeight: 1.3 }}>View Best Cities</div>
                    <div className="kpi-sub" style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>Click to see details →</div>
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
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--slate-100)' }}>
                        {commKeys.map((key, index) => {
                            const val = commVals[index];
                            const pct = apiData.kpis.totalVolume > 0 ? ((val / apiData.kpis.totalVolume) * 100).toFixed(1) : 0;
                            return <LegendRow key={key} title={key} value={val} percentage={pct} color={greenPalette[index]} />;
                        })}
                    </div>
                </div>
            </div>

            {/* NEW: AUTOMATED AI INSIGHTS SECTION */}
            <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--gold)', background: 'linear-gradient(to right, #fefce8, white)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gold)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#854d0e' }}>Automated Analyst Insights</h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: '2.5rem', color: 'var(--slate-700)', lineHeight: 1.8 }}>
                    {apiData.aiInsights.map((insight, index) => (
                        <li key={index} style={{ marginBottom: '0.5rem' }}>{insight}</li>
                    ))}
                </ul>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <span className="card-title">Harvest Totals & Future Forecast</span>
                    <span className="card-badge badge-gold" style={{borderColor: 'var(--gold)', color: '#854d0e', background: '#fef08a'}}>Linear Regression</span>
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