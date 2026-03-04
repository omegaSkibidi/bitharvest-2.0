import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './ReportManagement.css';

const allReports = [
  { id: 'REP-001', name: 'Squash Q6', desc: '9999 units recorded in Q6 harvest cycle', type: 'table', by: 'Cedy', date: 'Mar 01, 2026', status: 'approved' },
  { id: 'REP-002', name: 'Squash Q3', desc: 'Q3 harvest summary with variance notes', type: 'both', by: 'Cedy', date: 'Feb 27, 2026', status: 'approved' },
  { id: 'REP-003', name: 'Cacao Q4 Yield', desc: 'Quarterly cacao production totals', type: 'chart', by: 'Ken Alcazar', date: 'Feb 26, 2026', status: 'pending' },
  { id: 'REP-004', name: 'Banana Harvest Feb', desc: 'February banana division summary', type: 'table', by: 'Maria Santos', date: 'Feb 25, 2026', status: 'pending' },
  { id: 'REP-005', name: 'Rice Yield Q1', desc: 'First quarter rice production data', type: 'both', by: 'Jose Reyes', date: 'Feb 24, 2026', status: 'pending' },
  { id: 'REP-006', name: 'Corn Monthly Jan', desc: 'January corn output analysis', type: 'chart', by: 'Ana Cruz', date: 'Feb 10, 2026', status: 'denied' },
  { id: 'REP-007', name: 'Vegetable Weekly', desc: 'Weekly vegetable yield snapshot', type: 'table', by: 'Luis Garcia', date: 'Feb 05, 2026', status: 'denied' },
  { id: 'REP-008', name: 'Cacao Batch 12', desc: 'Batch 12 post-harvest encoding', type: 'both', by: 'Ken Alcazar', date: 'Jan 30, 2026', status: 'approved' },
];

export default function ReportManagement() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [reports, setReports] = useState(allReports);
  const [viewReport, setViewReport] = useState(null);
  const [comment, setComment] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [selectedExports, setSelectedExports] = useState([]);
  const [exportSearch, setExportSearch] = useState('');
  const [showFormatPicker, setShowFormatPicker] = useState(false);
  const [reportFormats, setReportFormats] = useState({});

  const filtered = reports.filter(r => {
    const matchTab = tab === 'all' || r.status === tab;
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.by.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    approved: reports.filter(r => r.status === 'approved').length,
    denied: reports.filter(r => r.status === 'denied').length,
  };

  const approvedReports = reports.filter(r => r.status === 'approved');

  const handleApprove = (id) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    setViewReport(null);
  };

  const handleDeny = (id) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'denied' } : r));
    setViewReport(null);
  };

  const toggleExportItem = (id) => {
    setSelectedExports(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedExports.length === approvedReports.length) {
      setSelectedExports([]);
    } else {
      setSelectedExports(approvedReports.map(r => r.id));
    }
  };

  const openExportModal = () => {
    setSelectedExports([]);
    setExportSearch('');
    setShowExport(true);
  };

  const TypeTag = ({ type }) => (
    <span className={`rm-type-tag ${type}`}>
      {type === 'table' ? <><i className="fa-solid fa-table" /> Table</> :
       type === 'chart' ? <><i className="fa-solid fa-chart-bar" /> Chart</> :
       <><i className="fa-solid fa-layer-group" /> Both</>}
    </span>
  );

  return (
    <div className="rm-root">

      {/* HEADER */}
      <header className="rm-header">
        <div className="rm-header-left">
          <div className="rm-header-avatar">
            <i className="fa-solid fa-file-circle-check" />
          </div>
          <div>
            <div className="rm-greeting-label">Report Management</div>
            <h1 className="rm-title">Review Submitted Reports</h1>
          </div>
        </div>
        <div className="rm-header-right">
          <div className="rm-search-wrap">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              className="rm-search-input"
              placeholder="Search reports, encoders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="rm-filter-btn">
            <i className="fa-solid fa-sliders" /> Filter
          </button>
        </div>
      </header>

      {/* TABLE PANEL */}
      <div className="rm-section-label">All Submissions</div>
      <div className="rm-panel">
        <div className="rm-panel-header">
          <div className="rm-panel-title">Submitted Reports</div>
          <div className="rm-panel-right">
            <button className="rm-export-btn" onClick={openExportModal}>
              <i className="fa-solid fa-file-arrow-down" /> Export
            </button>
            <span className="rm-panel-tag">Mar 2026</span>
          </div>
        </div>

        {/* TABS */}
        <div className="rm-tabs">
          {[
            { key: 'all', label: 'All', countClass: '' },
            { key: 'pending', label: 'Pending', countClass: 'warn' },
            { key: 'approved', label: 'Approved', countClass: 'success' },
            { key: 'denied', label: 'Denied', countClass: 'danger' },
          ].map(t => (
            <button
              key={t.key}
              className={`rm-tab${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span className={`rm-tab-count ${t.countClass}`}>{counts[t.key]}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rm-empty">
            <i className="fa-solid fa-inbox" />
            No reports found
          </div>
        ) : (
          <table className="rm-table">
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Description</th>
                <th>Type</th>
                <th>Details</th>
                <th>Comments</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="rm-report-name">{r.name}</div>
                    <div className="rm-report-id">{r.id}</div>
                  </td>
                  <td><div className="rm-desc">{r.desc}</div></td>
                  <td><TypeTag type={r.type} /></td>
                  <td>
                    <div className="rm-by">By {r.by}</div>
                    <div className="rm-date">{r.date}</div>
                  </td>
                  <td>
                    <button className="rm-comment-btn" title="View comments">
                      <i className="fa-regular fa-message" />
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`rm-status-pill ${r.status}`}>
                      <span className="rm-status-dot" />
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="rm-view-btn"
                      onClick={() => { setViewReport(r); setComment(''); }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── VIEW MODAL (Portal) ── */}
      {viewReport && createPortal(
        <div
          className="rm-modal-overlay"
          onClick={e => e.target === e.currentTarget && setViewReport(null)}
        >
          <div className="rm-modal">
            <div className="rm-modal-header">
              <div>
                <div className="rm-modal-title">{viewReport.name}</div>
                <div className="rm-modal-sub">{viewReport.id} · Submitted by {viewReport.by}</div>
              </div>
              <button className="rm-modal-close" onClick={() => setViewReport(null)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="rm-modal-row">
              <div className="rm-modal-field">
                <div className="rm-modal-label">Report Type</div>
                <span style={{ marginTop: 4, display: 'inline-flex' }}>
                  <TypeTag type={viewReport.type} />
                </span>
              </div>
              <div className="rm-modal-field">
                <div className="rm-modal-label">Status</div>
                <span
                  className={`rm-status-pill ${viewReport.status}`}
                  style={{ marginTop: 4, display: 'inline-flex' }}
                >
                  <span className="rm-status-dot" />
                  {viewReport.status.charAt(0).toUpperCase() + viewReport.status.slice(1)}
                </span>
              </div>
              <div className="rm-modal-field">
                <div className="rm-modal-label">Date Submitted</div>
                <div className="rm-modal-val" style={{ fontSize: '0.82rem' }}>{viewReport.date}</div>
              </div>
            </div>

            <div>
              <div className="rm-modal-label" style={{ marginBottom: 6 }}>Description</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-mid)', lineHeight: 1.6 }}>
                {viewReport.desc}
              </div>
            </div>

            <div className="rm-modal-divider" />

            <div style={{ marginBottom: '1rem' }}>
              <div className="rm-modal-label" style={{ marginBottom: 6 }}>Admin Comment (optional)</div>
              <textarea
                className="rm-textarea"
                placeholder="Leave a note for the encoder..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>

            {viewReport.status === 'pending' ? (
              <div className="rm-modal-actions">
                <button
                  className="rm-modal-btn approve"
                  onClick={() => handleApprove(viewReport.id)}
                >
                  <i className="fa-solid fa-circle-check" /> Approve Report
                </button>
                <button
                  className="rm-modal-btn deny"
                  onClick={() => handleDeny(viewReport.id)}
                >
                  <i className="fa-solid fa-circle-xmark" /> Deny Report
                </button>
              </div>
            ) : (
              <div className="rm-modal-actions">
                <button className="rm-modal-btn close" onClick={() => setViewReport(null)}>
                  <i className="fa-solid fa-arrow-left" /> Back to List
                </button>
                {comment.trim() && (
                  <button className="rm-modal-btn save" onClick={() => setViewReport(null)}>
                    <i className="fa-solid fa-floppy-disk" /> Save Comment
                  </button>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── EXPORT MODAL (Portal) ── */}
      {showExport && createPortal(
        <div
          className="rm-modal-overlay"
          onClick={e => e.target === e.currentTarget && setShowExport(false)}
        >
          <div className="rm-modal rm-export-modal">
            <div className="rm-modal-header">
              <div>
                <div className="rm-modal-title">Export Reports</div>
                <div className="rm-modal-sub">Select approved reports to export</div>
              </div>
              <button className="rm-modal-close" onClick={() => setShowExport(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {approvedReports.length === 0 ? (
              <div className="rm-empty" style={{ padding: '2rem 1rem' }}>
                <i className="fa-solid fa-circle-check" />
                No approved reports available
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className="rm-search-wrap" style={{ flex: 1, padding: '7px 12px' }}>
                    <i className="fa-solid fa-magnifying-glass" />
                    <input
                      className="rm-search-input"
                      style={{ width: '100%' }}
                      placeholder="Search approved reports..."
                      value={exportSearch}
                      onChange={e => setExportSearch(e.target.value)}
                    />
                  </div>
                  <div
                    className="rm-export-select-all"
                    style={{ margin: 0, whiteSpace: 'nowrap' }}
                    onClick={toggleSelectAll}
                  >
                    <i
                      className={`fa-${selectedExports.length === approvedReports.length
                        ? 'solid fa-square-check'
                        : 'regular fa-square'}`}
                      style={{
                        color: selectedExports.length === approvedReports.length
                          ? 'var(--primary)'
                          : undefined,
                      }}
                    />
                    Select all
                  </div>
                </div>

                <div className="rm-export-list">
                  {approvedReports
                    .filter(r =>
                      r.name.toLowerCase().includes(exportSearch.toLowerCase()) ||
                      r.id.toLowerCase().includes(exportSearch.toLowerCase()) ||
                      r.by.toLowerCase().includes(exportSearch.toLowerCase())
                    )
                    .map(r => {
                      const isSelected = selectedExports.includes(r.id);
                      return (
                        <div
                          key={r.id}
                          className={`rm-export-item${isSelected ? ' selected' : ''}`}
                          onClick={() => toggleExportItem(r.id)}
                        >
                          <div className="rm-export-checkbox">
                            {isSelected && <i className="fa-solid fa-check" />}
                          </div>
                          <div className="rm-export-item-info">
                            <div className="rm-export-item-name">{r.name}</div>
                            <div className="rm-export-item-meta">
                              {r.id} · By {r.by} · {r.date}
                            </div>
                          </div>
                          <TypeTag type={r.type} />
                        </div>
                      );
                    })}

                  {approvedReports.filter(r =>
                    r.name.toLowerCase().includes(exportSearch.toLowerCase()) ||
                    r.id.toLowerCase().includes(exportSearch.toLowerCase()) ||
                    r.by.toLowerCase().includes(exportSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="rm-empty" style={{ padding: '1.5rem 1rem' }}>
                      <i className="fa-solid fa-magnifying-glass" />
                      No reports match your search
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="rm-modal-divider" style={{ margin: '0 0 1rem' }} />

            <div className="rm-modal-actions">
              <button className="rm-modal-btn close" onClick={() => setShowExport(false)}>
                Cancel
              </button>
              <button
                className="rm-modal-btn approve"
                style={selectedExports.length === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                disabled={selectedExports.length === 0}
                onClick={() => {
                  if (selectedExports.length > 0) {
                    setReportFormats({});
                    setShowExport(false);
                    setShowFormatPicker(true);
                  }
                }}
              >
                <i className="fa-solid fa-arrow-right" /> Next — Choose Format
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── FORMAT PICKER MODAL (Portal) ── */}
      {showFormatPicker && createPortal(
        <div
          className="rm-modal-overlay"
          onClick={e => e.target === e.currentTarget && setShowFormatPicker(false)}
        >
          <div className="rm-modal rm-export-modal">
            <div className="rm-modal-header">
              <div>
                <div className="rm-modal-title">Assign Export Format</div>
                <div className="rm-modal-sub">Choose PDF or CSV for each selected report</div>
              </div>
              <button className="rm-modal-close" onClick={() => setShowFormatPicker(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* COLUMN HEADERS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 80px',
              gap: 8,
              padding: '0 4px 8px',
              borderBottom: '1px solid var(--border)',
              marginBottom: 10,
            }}>
              <div style={{
                fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '1.5px', color: 'var(--text-muted)',
              }}>
                Report
              </div>
              <div style={{
                fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '1.5px', color: '#DC2626', textAlign: 'center',
              }}>
                PDF
              </div>
              <div style={{
                fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '1.5px', color: 'var(--secondary)', textAlign: 'center',
              }}>
                CSV
              </div>
            </div>

            {/* PER-REPORT ROWS */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 6,
              maxHeight: 320, overflowY: 'auto', marginBottom: '1.25rem',
            }}>
              {selectedExports.map(id => {
                const r = reports.find(x => x.id === id);
                const fmt = reportFormats[id] || null;
                return (
                  <div
                    key={id}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 80px 80px',
                      gap: 8, alignItems: 'center',
                      padding: '10px 4px', borderRadius: 10,
                      borderBottom: '1px solid var(--bg)',
                    }}
                  >
                    {/* Report info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: 'var(--success-bg)', color: 'var(--secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem',
                      }}>
                        <i className="fa-solid fa-file-lines" />
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.83rem', fontWeight: 700,
                          color: 'var(--text)', lineHeight: 1.2,
                        }}>
                          {r.name}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {r.id}
                        </div>
                      </div>
                    </div>

                    {/* PDF toggle */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        onClick={() => setReportFormats(prev => ({
                          ...prev,
                          [id]: fmt === 'pdf' ? null : 'pdf',
                        }))}
                        style={{
                          width: 36, height: 36, borderRadius: 9,
                          border: 'none', cursor: 'pointer',
                          fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          transition: 'all 0.15s',
                          background: fmt === 'pdf' ? '#FEE2E2' : 'var(--bg)',
                          color: fmt === 'pdf' ? '#DC2626' : 'var(--text-muted)',
                          boxShadow: fmt === 'pdf'
                            ? '0 0 0 2px #DC262633'
                            : '0 0 0 1px var(--border)',
                          transform: fmt === 'pdf' ? 'scale(1.1)' : 'scale(1)',
                        }}
                        title="Export as PDF"
                      >
                        <i className="fa-solid fa-file-pdf" />
                      </button>
                    </div>

                    {/* CSV toggle */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        onClick={() => setReportFormats(prev => ({
                          ...prev,
                          [id]: fmt === 'csv' ? null : 'csv',
                        }))}
                        style={{
                          width: 36, height: 36, borderRadius: 9,
                          border: 'none', cursor: 'pointer',
                          fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          transition: 'all 0.15s',
                          background: fmt === 'csv' ? 'var(--success-bg)' : 'var(--bg)',
                          color: fmt === 'csv' ? 'var(--secondary)' : 'var(--text-muted)',
                          boxShadow: fmt === 'csv'
                            ? '0 0 0 2px rgba(2,201,55,0.2)'
                            : '0 0 0 1px var(--border)',
                          transform: fmt === 'csv' ? 'scale(1.1)' : 'scale(1)',
                        }}
                        title="Export as CSV"
                      >
                        <i className="fa-solid fa-file-csv" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SUMMARY FOOTER */}
            {Object.values(reportFormats).some(Boolean) && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: '1rem',
                background: 'var(--primary-glow)', border: '1px solid rgba(2,201,55,0.15)',
                display: 'flex', gap: 16, alignItems: 'center',
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-mid)', fontWeight: 600 }}>
                  <i className="fa-solid fa-circle-info" style={{ marginRight: 6, color: 'var(--secondary)' }} />
                  Ready to export:
                </div>
                {['pdf', 'csv'].map(f => {
                  const count = Object.values(reportFormats).filter(v => v === f).length;
                  if (!count) return null;
                  return (
                    <div
                      key={f}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: '0.75rem', fontWeight: 700,
                        color: f === 'pdf' ? '#DC2626' : 'var(--secondary)',
                      }}
                    >
                      <i className={`fa-solid fa-file-${f}`} />
                      {count} {f.toUpperCase()}
                    </div>
                  );
                })}
                {selectedExports.length - Object.values(reportFormats).filter(Boolean).length > 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {selectedExports.length - Object.values(reportFormats).filter(Boolean).length} unassigned
                  </div>
                )}
              </div>
            )}

            <div className="rm-modal-actions">
              <button
                className="rm-modal-btn close"
                onClick={() => { setShowFormatPicker(false); setShowExport(true); }}
              >
                <i className="fa-solid fa-arrow-left" /> Back
              </button>
              <button
                className="rm-modal-btn approve"
                style={
                  !Object.values(reportFormats).some(Boolean)
                    ? { opacity: 0.4, cursor: 'not-allowed' }
                    : {}
                }
                disabled={!Object.values(reportFormats).some(Boolean)}
              >
                <i className="fa-solid fa-file-arrow-down" /> Export Selected
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}