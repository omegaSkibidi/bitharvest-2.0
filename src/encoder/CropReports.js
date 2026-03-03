import React, { useState } from 'react';
import ReactDOM from 'react-dom'; 

export default function CropReports() {
  // --- STATE MANAGEMENT ---
  const [currentView, setCurrentView] = useState('list'); 
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportType, setReportType] = useState('table'); 

  // --- MOCK DATA ---
  const counts = { pending: 5 };
  
  const datasets = [
    { id: 'CACAO-2026-Q1', name: 'Cacao 2026 Q1', commodity: 'Cacao', date: 'Mar 2, 2026', status: 'Pending' },
    { id: 'CACAO-2025-Q4', name: 'Cacao 2025 Q4', commodity: 'Cacao', date: 'Jan 15, 2026', status: 'Approved' },
    { id: 'CACAO-2025-Q3', name: 'Cacao 2025 Q3', commodity: 'Cacao', date: 'Oct 10, 2025', status: 'Approved' },
  ];

  const rawData = [
    { municipality: 'Tiwi', farmers: 42, planted: 12.5, harvested: 10.2, volume: 45.8 },
    { municipality: 'Malinao', farmers: 18, planted: 5.0, harvested: 4.8, volume: 18.2 },
    { municipality: 'Tabaco City', farmers: 105, planted: 45.2, harvested: 42.0, volume: 210.5 },
    { municipality: 'Legazpi City', farmers: 0, planted: 2.75, harvested: 1.45, volume: 7.25 },
    { municipality: 'Guinobatan', farmers: 210, planted: 85.0, harvested: 80.5, volume: 405.0 },
  ];

  // --- RENDER HELPERS ---

  // 1. The List View
  const renderListView = () => (
    <>
      <header className="rm-header">
        <div className="rm-header-left">
          <div className="rm-header-avatar"><i className="fa-solid fa-file-circle-check" /></div>
          <div>
            <div className="rm-greeting-label"> Crop Reports</div>
            <h1 className="rm-title">Submit Reports</h1>
            <p className="rm-subtitle">{counts.pending} report{counts.pending !== 1 ? 's' : ''} waiting for approval</p>
          </div>
        </div>
        <div className="rm-header-right">
          <div className="rm-search-wrap">
            <i className="fa-solid fa-magnifying-glass" />
            <input className="rm-search-input" placeholder="Search datasets..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="rm-filter-btn"><i className="fa-solid fa-sliders" /> Filter</button>
        </div>
      </header>

      <div className="cr-card">
        <div className="cr-card-header">
          <h2 className="cr-card-title">Available Crop Datasets</h2>
          <span className="cr-badge cr-badge-outline">Assigned: Cacao</span>
        </div>
        
        <table className="cr-table">
          <thead>
            <tr>
              <th>Dataset Name</th>
              <th>Commodity</th>
              <th>Date Uploaded</th>
              {/* FIXED PADDING: Centered and given a specific width to keep it perfectly symmetrical */}
              <th style={{ textAlign: 'center', width: '120px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {datasets.map((ds) => (
              <tr key={ds.id}>
                <td style={{ fontWeight: '600', color: 'var(--text)' }}>{ds.name}</td>
                <td><span className="cr-badge cr-badge-green">{ds.commodity}</span></td>
                <td>{ds.date}</td>
                {/* FIXED PADDING: Centered to match the header perfectly */}
                <td style={{ textAlign: 'center' }}>
                  <button className="cr-btn-ghost-primary" onClick={() => setCurrentView('detail')}>
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

  // 2. The Detail View
  const renderDetailView = () => (
    <>
      <div className="cr-detail-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 className="rm-title" style={{ margin: 0 }}>Cacao 2026 Q1</h1>
            <span className="cr-badge cr-badge-green">CACAO</span>
          </div>
          <p className="rm-subtitle" style={{ margin: 0 }}>Uploaded on March 2, 2026</p>
        </div>
        
        <div className="cr-action-group">
          <button className="cr-btn-ghost" onClick={() => setCurrentView('list')}>
            <i className="fa-solid fa-arrow-left" /> Back
          </button>
          <button className="cr-btn-ghost"><i className="fa-solid fa-print" /> Print</button>
          <button className="cr-btn-ghost"><i className="fa-solid fa-download" /> Download <i className="fa-solid fa-chevron-down" style={{fontSize: '0.7em', marginLeft: '4px'}}/></button>
          <button className="cr-btn-primary" onClick={() => setIsModalOpen(true)}>
            <i className="fa-solid fa-file-export" /> Generate Report
          </button>
        </div>
      </div>

      <div className="cr-card">
        <div className="cr-card-header" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="cr-card-title">Raw Data Table</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="cr-table">
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
              {rawData.map((row, idx) => (
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
    </>
  );

  return (
    <div className="crop-reports-container" style={{ animation: 'slideUpFade 0.4s ease' }}>
      
      {currentView === 'list' ? renderListView() : renderDetailView()}

      {/* --- MODAL OVERLAY --- */}
      {isModalOpen && ReactDOM.createPortal(
        <div className="cr-modal-overlay">
          <div className="cr-modal">
            <div className="cr-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text)' }}>Configure Report</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Commodity: Cacao</p>
              </div>
              <button className="cr-modal-close" onClick={() => setIsModalOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="cr-modal-body">
              <div className="cr-form-group">
                <label>Report Name <span style={{color: 'var(--danger)'}}>*</span></label>
                <input type="text" placeholder="e.g. Q1 Cacao Analysis" className="cr-input" />
              </div>
              <div className="cr-form-group">
                <label>Description <span style={{color: 'var(--danger)'}}>*</span></label>
                <textarea placeholder="Context for this report..." className="cr-input" rows="3"></textarea>
              </div>

              <div className="cr-form-group">
                <label>REPORT TYPE</label>
                <div className="cr-type-cards">
                  <div className={`cr-type-card ${reportType === 'table' ? 'active' : ''}`} onClick={() => setReportType('table')}>
                    <i className="fa-solid fa-table" style={{color: 'var(--success)'}} />
                    <span>Data Table Only</span>
                  </div>
                  <div className={`cr-type-card ${reportType === 'mixed' ? 'active' : ''}`} onClick={() => setReportType('mixed')}>
                    <i className="fa-solid fa-chart-pie" style={{color: 'var(--warn)'}} />
                    <span>Table & Graphs</span>
                  </div>
                  <div className={`cr-type-card ${reportType === 'graph' ? 'active' : ''}`} onClick={() => setReportType('graph')}>
                    <i className="fa-solid fa-chart-line" style={{color: 'var(--primary)'}} />
                    <span>Graphs Only</span>
                  </div>
                </div>
              </div>

              <div className="cr-form-group">
                <label>TABLE COLUMNS (VISIBLE DATA)</label>
                <select className="cr-input">
                  <option>All columns selected</option>
                  <option>Production Volume Only</option>
                  <option>Area Harvested Only</option>
                </select>
              </div>
            </div>

            <div className="cr-modal-footer">
              <button className="cr-btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="cr-btn-primary" onClick={() => setIsModalOpen(false)}>Generate Report</button>
            </div>
          </div>
        </div>,
        document.body 
      )}

      {/* --- INTERNAL STYLES --- */}
      <style>{`
        /* Header */
        .rm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: var(--surface); padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border); }
        .rm-header-left { display: flex; align-items: center; gap: 1rem; }
        .rm-header-avatar { width: 48px; height: 48px; border-radius: 12px; background: var(--primary-glow); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .rm-greeting-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--secondary); }
        .rm-title { font-size: 1.4rem; font-weight: 800; color: var(--text); margin: 2px 0; }
        .rm-subtitle { font-size: 0.85rem; color: var(--text-muted); margin: 0; }
        
        .rm-header-right { display: flex; gap: 10px; align-items: center; }
        .rm-search-wrap { position: relative; display: flex; align-items: center; }
        .rm-search-wrap i { position: absolute; left: 12px; color: var(--text-muted); font-size: 0.9rem; }
        .rm-search-input { padding: 10px 12px 10px 36px; border-radius: 10px; border: 1px solid var(--border); font-family: inherit; font-size: 0.85rem; outline: none; width: 220px; transition: border 0.2s; }
        .rm-search-input:focus { border-color: var(--primary); }
        .rm-filter-btn { padding: 10px 16px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); color: var(--text-mid); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; font-family: inherit; font-size: 0.85rem; }
        .rm-filter-btn:hover { background: var(--surface-hover); color: var(--primary); }

        /* Detail View Header */
        .cr-detail-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
        .cr-action-group { display: flex; gap: 10px; }

        /* Cards and Tables */
        .cr-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .cr-card-header { padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
        .cr-card-title { font-size: 1.1rem; font-weight: 700; color: var(--text); margin: 0; }
        
        .cr-table { width: 100%; border-collapse: collapse; text-align: left; }
        .cr-table th { padding: 1rem 1.5rem; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--border); background: var(--surface-hover); }
        .cr-table td { padding: 1rem 1.5rem; font-size: 0.85rem; color: var(--text-mid); border-bottom: 1px solid var(--border); vertical-align: middle; }
        .cr-table tr:last-child td { border-bottom: none; }
        .cr-table tbody tr:hover td { background: var(--bg); }

        /* Badges */
        .cr-badge { padding: 4px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; display: inline-block; letter-spacing: 0.5px; }
        .cr-badge-outline { border: 1px solid var(--border-bright); color: var(--text-muted); background: var(--bg); }
        .cr-badge-green { background: var(--success-bg); color: var(--success); border: 1px solid rgba(22,163,74,0.2); }

        /* Buttons */
        .cr-btn-ghost-primary { padding: 8px 16px; border-radius: 8px; border: none; color: var(--primary); background: transparent; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; }
        .cr-btn-ghost-primary:hover { background: var(--primary-glow); }
        .cr-btn-ghost { padding: 8px 16px; border-radius: 8px; border: 1px solid transparent; color: var(--text-mid); background: transparent; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; }
        .cr-btn-ghost:hover { background: var(--surface-hover); color: var(--primary); border-color: var(--border); }
        .cr-btn-primary { padding: 8px 18px; border-radius: 8px; border: none; color: white; background: var(--primary); font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 10px rgba(61,86,42,0.2); }
        .cr-btn-primary:hover { background: var(--secondary); transform: translateY(-1px); }

        /* Global Modal Overlay via Portal */
        .cr-modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease; }
        .cr-modal { background: var(--surface); width: 100%; max-width: 500px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); overflow: hidden; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid var(--border); }
        .cr-modal-header { padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
        .cr-modal-close { background: none; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; }
        .cr-modal-close:hover { color: var(--danger); }
        .cr-modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .cr-form-group label { display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-mid); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .cr-input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); font-family: inherit; font-size: 0.9rem; color: var(--text); outline: none; transition: border 0.2s; }
        .cr-input:focus { border-color: var(--primary); }
        
        .cr-type-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .cr-type-card { border: 1px solid var(--border); border-radius: 10px; padding: 1rem 0.5rem; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 8px; background: var(--bg); }
        .cr-type-card i { font-size: 1.5rem; }
        .cr-type-card span { font-size: 0.75rem; font-weight: 600; color: var(--text-mid); }
        .cr-type-card:hover { border-color: var(--border-bright); background: var(--surface-hover); }
        .cr-type-card.active { border-color: var(--primary); background: var(--primary-glow); }
        .cr-type-card.active span { color: var(--primary); }

        .cr-modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; background: var(--bg); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}