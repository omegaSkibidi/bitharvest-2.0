import React, { useState } from 'react';

export default function MySubmissions() {
  // --- STATE MANAGEMENT ---
  const [currentView, setCurrentView] = useState('list'); 
  const [search, setSearch] = useState('');
  
  const [selectedReport, setSelectedReport] = useState(null); 

  // --- MOCK DATA ---
  const submissions = [
    { 
      id: 1, 
      name: 'Cacao Q1 Analysis', 
      commodity: 'CACAO',
      type: 'TABLE', 
      description: 'Quarterly review of municipal harvest outputs.', 
      comments: '"Looks accurate, ready for provincial consolidation."', 
      date: 'Mar 01, 2026', 
      time: '05:03 PM',
      status: 'Approved' 
    },
    { 
      id: 2, 
      name: 'Cacao Q4 Summary', 
      commodity: 'CACAO',
      type: 'BOTH', 
      description: 'Annual wrap-up including visual forecasting.', 
      comments: '"Please verify the planted area for Ligao City."', 
      date: 'Feb 27, 2026', 
      time: '06:11 PM',
      status: 'Pending' 
    },
    { 
      id: 3, 
      name: 'Special TY Report', 
      commodity: 'CACAO',
      type: 'GRAPH', 
      description: 'Typhoon impact assessment.', 
      comments: '"Missing data for coastal municipalities. Revise and resubmit."', 
      date: 'Feb 15, 2026', 
      time: '10:00 AM',
      status: 'Denied' 
    },
  ];

  const detailTableData = [
    { municipality: 'Tiwi', farmers: 42, planted: 12.5, harvested: 10.2, volume: 45.8 },
    { municipality: 'Malinao', farmers: 18, planted: 145.0, harvested: 120.0, volume: 380.0 },
    { municipality: 'Tabaco City', farmers: 105, planted: 45.2, harvested: 42.0, volume: 210.5 },
    { municipality: 'Legazpi City', farmers: 0, planted: 2.75, harvested: 1.45, volume: 7.25 },
  ];

  // --- HELPER FUNCTIONS ---
  const getStatusBadge = (status) => {
    switch(status) {
      case 'Approved': return <span className="ms-badge ms-badge-success"><i className="fa-solid fa-check"></i> Approved</span>;
      case 'Pending': return <span className="ms-badge ms-badge-warn"><i className="fa-solid fa-clock"></i> Pending</span>;
      case 'Denied': return <span className="ms-badge ms-badge-danger"><i className="fa-solid fa-xmark"></i> Denied</span>;
      default: return <span className="ms-badge">{status}</span>;
    }
  };

  const getTypeBadge = (type) => {
    if (type === 'TABLE') return <span className="ms-badge-type">TABLE</span>;
    if (type === 'BOTH') return <span className="ms-badge-type both">BOTH</span>;
    if (type === 'GRAPH') return <span className="ms-badge-type graph">GRAPH</span>;
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setCurrentView('detail');
  };

  // --- 1. LIST VIEW ---
  const renderListView = () => (
    <>
      <header className="ms-header">
        <div className="ms-header-left">
          <div className="ms-header-avatar"><i className="fa-solid fa-list-check" /></div>
          <div>
            <div className="ms-greeting-label">Submissions</div>
            <h1 className="ms-title">My Submitted Reports</h1>
            <p className="ms-subtitle">Track the approval status of your generated reports.</p>
          </div>
        </div>
        <div className="ms-header-right">
          <div className="ms-search-wrap">
            <i className="fa-solid fa-magnifying-glass" />
            <input className="ms-search-input" placeholder="Search submissions..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="ms-filter-btn"><i className="fa-solid fa-sliders" /> Filter</button>
        </div>
      </header>

      <div className="ms-card">
        <table className="ms-table">
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Type</th>
              <th>Description</th>
              <th>Comments</th>
              <th>Date & Time</th>
              <th>Status</th>
              {/* FIXED ALIGNMENT: Centered with fixed width */}
              <th style={{ textAlign: 'center', width: '120px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <tr key={sub.id}>
                <td>
                  <div style={{ fontWeight: '700', color: 'var(--text)' }}>{sub.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', letterSpacing: '0.5px' }}>{sub.commodity}</div>
                </td>
                <td>{getTypeBadge(sub.type)}</td>
                <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sub.description}
                </td>
                <td style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{sub.comments}</td>
                <td>
                  <div style={{ fontWeight: '500', color: 'var(--text-mid)' }}>{sub.date}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sub.time}</div>
                </td>
                <td>{getStatusBadge(sub.status)}</td>
                {/* FIXED ALIGNMENT: Centered matching header */}
                <td style={{ textAlign: 'center' }}>
                  <button className="ms-btn-ghost-primary" onClick={() => handleViewReport(sub)}>
                    <i className="fa-regular fa-eye" /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  // --- 2. DETAIL VIEW ---
  const renderDetailView = () => {
    const report = selectedReport || submissions[0];

    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {/* Detail Header */}
        <div className="ms-detail-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 className="ms-title" style={{ margin: 0 }}>{report.name}</h1>
              {getStatusBadge(report.status)}
            </div>
            <p className="ms-subtitle" style={{ margin: 0 }}>Submitted on {report.date} at {report.time}</p>
          </div>
          <button className="ms-btn-outline" onClick={() => setCurrentView('list')}>
            <i className="fa-solid fa-arrow-left" /> Back to List
          </button>
        </div>

        {/* Info Blocks Grid */}
        <div className="ms-info-grid">
          <div className="ms-info-card">
            <div className="ms-info-card-header">
              <i className="fa-regular fa-pen-to-square" style={{ color: 'var(--primary)' }}></i>
              <span>Report Description</span>
            </div>
            <div className="ms-info-card-body">
              {report.description}
            </div>
          </div>

          <div className="ms-info-card highlight">
            <div className="ms-info-card-header">
              <i className="fa-solid fa-chart-pie" style={{ color: 'var(--secondary)' }}></i>
              <span>Key Findings & Stats</span>
            </div>
            <div className="ms-info-card-body">
              <ul className="ms-stats-list">
                <li>Total <strong>Production Volume</strong> across all areas is <strong>643.55 MT</strong>.</li>
                <li><strong>Malinao</strong> is the leading contributor with <strong>380.00 MT</strong>.</li>
                <li>The average <strong>Yield Efficiency</strong> for this dataset is <strong>3.15 MT per Hectare</strong>.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="ms-card" style={{ marginTop: '1.5rem' }}>
          <div className="ms-card-header" style={{ borderBottom: '1px solid var(--border)', padding: '1.25rem 1.5rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', margin: 0 }}>
              <i className="fa-solid fa-bars-staggered" style={{ marginRight: '8px' }}></i> Selected Data Table
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="ms-table">
              <thead>
                <tr>
                  <th>Municipality</th>
                  <th>Number of Farmers</th>
                  <th>Planted Area (HA)</th>
                  <th>Area Harvested (HA)</th>
                  <th>Production Volume (MT)</th>
                </tr>
              </thead>
              <tbody>
                {detailTableData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600' }}>{row.municipality}</td>
                    <td>{row.farmers}</td>
                    <td>{row.planted.toFixed(2)}</td>
                    <td>{row.harvested.toFixed(2)}</td>
                    <td style={{ color: 'var(--text)' }}>{row.volume.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="my-submissions-container" style={{ animation: 'slideUpFade 0.4s ease' }}>
      
      {currentView === 'list' ? renderListView() : renderDetailView()}

      {/* --- INTERNAL STYLES --- */}
      <style>{`
        /* Header Layout */
        .ms-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: var(--surface); padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .ms-header-left { display: flex; align-items: center; gap: 1rem; }
        .ms-header-avatar { width: 48px; height: 48px; border-radius: 12px; background: var(--primary-glow); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .ms-greeting-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--secondary); }
        .ms-title { font-size: 1.4rem; font-weight: 800; color: var(--text); margin: 2px 0; }
        .ms-subtitle { font-size: 0.85rem; color: var(--text-muted); margin: 0; }
        
        .ms-header-right { display: flex; gap: 10px; align-items: center; }
        .ms-search-wrap { position: relative; display: flex; align-items: center; }
        .ms-search-wrap i { position: absolute; left: 12px; color: var(--text-muted); font-size: 0.9rem; }
        .ms-search-input { padding: 10px 12px 10px 36px; border-radius: 10px; border: 1px solid var(--border); font-family: inherit; font-size: 0.85rem; outline: none; width: 240px; transition: border 0.2s; background: var(--bg); }
        .ms-search-input:focus { border-color: var(--primary); }
        .ms-filter-btn { padding: 10px 16px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text-mid); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; font-family: inherit; font-size: 0.85rem; }
        .ms-filter-btn:hover { background: var(--surface-hover); color: var(--primary); border-color: var(--border-bright); }

        /* Detail View Specific Header */
        .ms-detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; background: var(--surface); padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border); }

        /* Cards & Tables */
        .ms-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .ms-table { width: 100%; border-collapse: collapse; text-align: left; }
        .ms-table th { padding: 1rem 1.5rem; font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); background: var(--surface-hover); }
        .ms-table td { padding: 1.25rem 1.5rem; font-size: 0.85rem; color: var(--text-mid); border-bottom: 1px solid var(--border); vertical-align: middle; }
        .ms-table tr:last-child td { border-bottom: none; }
        .ms-table tbody tr:hover td { background: var(--bg); }

        /* Badges */
        .ms-badge { padding: 4px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; letter-spacing: 0.5px; text-transform: uppercase; }
        .ms-badge-success { background: var(--success-bg); color: var(--success); border: 1px solid rgba(22,163,74,0.2); }
        .ms-badge-warn { background: var(--warn-bg); color: var(--warn); border: 1px solid rgba(217,119,6,0.2); }
        .ms-badge-danger { background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(220,38,38,0.2); }

        .ms-badge-type { font-size: 0.65rem; font-weight: 800; letter-spacing: 1px; color: var(--text-muted); background: var(--bg); border: 1px solid var(--border-bright); padding: 4px 8px; border-radius: 6px; }
        .ms-badge-type.both { color: var(--primary); background: var(--primary-glow); border-color: rgba(61,86,42,0.2); }
        .ms-badge-type.graph { color: var(--secondary); background: var(--surface-hover); border-color: var(--border); }

        /* Buttons */
        .ms-btn-ghost-primary { padding: 8px 16px; border-radius: 8px; border: none; color: var(--primary); background: transparent; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; }
        .ms-btn-ghost-primary:hover { background: var(--primary-glow); }
        
        .ms-btn-outline { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border-bright); color: var(--text-mid); background: var(--surface); font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; }
        .ms-btn-outline:hover { background: var(--surface-hover); color: var(--primary); border-color: var(--primary); }

        /* Detail View Info Grids */
        .ms-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .ms-info-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; }
        .ms-info-card.highlight { background: var(--surface-hover); border-color: var(--border-bright); }
        .ms-info-card-header { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-mid); letter-spacing: 0.5px; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; }
        .ms-info-card-body { font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; }
        
        .ms-stats-list { margin: 0; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 8px; }
        .ms-stats-list li { color: var(--text-muted); }
        .ms-stats-list strong { color: var(--text); font-weight: 700; }

        @keyframes slideUpFade { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}