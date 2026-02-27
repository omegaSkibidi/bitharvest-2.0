import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

function UserDashboard() {
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const notifications = [
    { id: 1, type: 'success', text: 'Admin approved report', highlight: 'CACAD-004', time: '10 mins ago', unread: true },
    { id: 2, type: 'warning', text: 'New data format guidelines uploaded for', highlight: 'Cacao crops', time: '1 hour ago', unread: true },
    { id: 3, type: 'danger', text: 'Report CACAD-003 denied. Please review your data inputs.', highlight: null, time: 'Yesterday', unread: false },
    { id: 4, type: 'success', text: 'Admin approved report', highlight: 'CACAD-002', time: 'Yesterday', unread: false },
  ];

  const recentLogs = [
    { id: 'CACAD-005', crop: 'Cacao', date: 'Feb 26, 11:45 AM', status: 'Pending' },
    { id: 'CACAD-004', crop: 'Cacao', date: 'Feb 25, 9:30 AM', status: 'Approved' },
    { id: 'CACAD-003', crop: 'Cacao', date: 'Feb 24, 2:15 PM', status: 'Denied' },
    { id: 'CACAD-002', crop: 'Cacao', date: 'Feb 22, 10:00 AM', status: 'Approved' },
    { id: 'CACAD-001', crop: 'Cacao', date: 'Feb 20, 8:00 AM', status: 'Approved' },
  ];

  const activityFeed = [
    { type: 'success', icon: 'fa-circle-check', text: <>Admin <strong>approved</strong> your report <strong>CACAD-004</strong></>, time: '10 mins ago' },
    { type: 'info', icon: 'fa-file-circle-plus', text: <>You <strong>submitted</strong> report <strong>CACAD-005</strong> for review</>, time: '1 hour ago' },
    { type: 'warn', icon: 'fa-triangle-exclamation', text: <>New <strong>data format guidelines</strong> uploaded by admin</>, time: '2 hours ago' },
    { type: 'danger', icon: 'fa-circle-xmark', text: <>Report <strong>CACAD-003</strong> was <strong>denied</strong>. Check admin feedback.</>, time: 'Yesterday' },
    { type: 'success', icon: 'fa-circle-check', text: <>Admin <strong>approved</strong> your report <strong>CACAD-002</strong></>, time: 'Yesterday' },
  ];

  useEffect(() => {
    const Chart = window.Chart;
    if (!Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    Chart.defaults.font.family = "'Poppins', sans-serif";
    const ctx = document.getElementById('activityChart').getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
        datasets: [{
          label: 'Submitted',
          data: [12, 19, 15, 22, 18, 5],
          backgroundColor: (ctx) => ctx.dataIndex === 4 ? '#5F783D' : '#758E4E',
          borderRadius: 8,
          borderSkipped: false,
        }, {
          label: 'Approved',
          data: [10, 17, 12, 20, 14, 0],
          backgroundColor: '#DCE3D0',
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: '#333333', font: { size: 11, weight: '600' }, usePointStyle: true, pointStyleWidth: 8, boxHeight: 6 } },
          tooltip: { backgroundColor: '#FAF9F6', borderColor: '#DCE3D0', borderWidth: 1, titleColor: '#000000', bodyColor: '#333333', padding: 10 }
        }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, []);

  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const getStatusClass = (s) => s === 'Approved' ? 'approved' : s === 'Denied' ? 'denied' : 'pending';

  return (
    <div className="dashboard-root">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* ─── FIXED SIDEBAR ─── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><i className="fa-solid fa-leaf" /></div>
          <div className="logo-text">Bit<span>Harvest</span></div>
        </div>

        <div className="sidebar-section-label">Navigation</div>
        <nav>
          <button className="nav-item active">
            <i className="fa-solid fa-border-all" /> Dashboard
          </button>
          <button className="nav-item">
            <i className="fa-regular fa-file-lines" /> Crop Reports
            <span className="nav-badge">5</span>
          </button>
          <button className="nav-item">
            <i className="fa-solid fa-list-check" /> My Submissions
          </button>
          <button className="nav-item">
            <i className="fa-solid fa-chart-line" /> Analytics
          </button>
        </nav>

        <div className="sidebar-divider" />

        <div className="sidebar-quick">
          <div className="sidebar-quick-title">This Month</div>
          <div className="sidebar-quick-row">
            <span className="sidebar-quick-label">Reports filed</span>
            <span className="sidebar-quick-val" style={{ color: 'var(--primary)' }}>18</span>
          </div>
          <div className="sidebar-quick-row">
            <span className="sidebar-quick-label">Approval rate</span>
            <span className="sidebar-quick-val" style={{ color: 'var(--success)' }}>80%</span>
          </div>
          <div className="sidebar-quick-row">
            <span className="sidebar-quick-label">Pending</span>
            <span className="sidebar-quick-val" style={{ color: 'var(--warn)' }}>5</span>
          </div>
        </div>

        {/* PROFILE SECTION */}
        <div className="sidebar-profile">
          <div className="profile-card">
            <div className="profile-top">
              <div className="user-avatar"><i className="fa-solid fa-user" /></div>
              <div>
                <div className="user-name">Ken Alcazar</div>
                <div className="user-role-badge">
                  <span className="online-dot" />
                  Encoder · Cacao Division
                </div>
              </div>
            </div>
            <div className="profile-actions">
              {/* Removed settings button, left only Sign Out */}
              <button className="profile-action-btn signout" onClick={() => navigate('/')}>
                <i className="fa-solid fa-arrow-right-from-bracket" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT (SCROLLABLE) ─── */}
      <main className="main-content">
        {/* HEADER */}
        <header className="main-header">
          <div className="header-left">
            <div className="header-avatar-wrap">
              <i className="fa-solid fa-seedling" />
            </div>
            <div>
              <div className="header-greeting-label">Encoder Dashboard</div>
              <h1 className="header-title">Good day, Ken!</h1>
              <p className="header-subtitle">Here's what's happening with your reports today.</p>
            </div>
          </div>

          <div className="header-right">
            <div className="datetime-chip">
              <div className="datetime-icon"><i className="fa-regular fa-clock" /></div>
              <div>
                <div className="datetime-time">{timeStr}</div>
                <div className="datetime-date">{dateStr}</div>
              </div>
            </div>

            <div className="header-divider" />

            <div style={{ position: 'relative' }}>
              <button className="notif-btn" onClick={() => setShowNotifs(!showNotifs)}>
                <i className="fa-regular fa-bell" />
                <span className="notif-dot" />
              </button>
              {showNotifs && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span className="notif-header-title">Notifications</span>
                    <span className="notif-mark-all">Mark all read</span>
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} className={`notif-item${n.unread ? ' unread' : ''}`}>
                      <div className={`notif-icon ${n.type === 'danger' ? 'danger' : n.type === 'warning' ? 'warning' : 'success'}`}>
                        <i className={`fa-solid ${n.type === 'success' ? 'fa-circle-check' : n.type === 'danger' ? 'fa-circle-xmark' : 'fa-circle-exclamation'}`} />
                      </div>
                      <div>
                        <div className="notif-text">
                          {n.text}{n.highlight ? <> <strong>{n.highlight}</strong></> : ''}
                        </div>
                        <div className="notif-time">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* TIP BANNER */}
        <div className="tip-banner">
          <span className="tip-icon"><i className="fa-solid fa-circle-info" /></span>
          <span className="tip-text"><strong>CACAD-005</strong> is currently pending review. Admin typically responds within 24 hours.</span>
        </div>

        {/* STATS */}
        <div className="section-label">Report Summary</div>
        <div className="stats-grid">
          <div className="stat-card card-total">
            <div className="stat-card-glow" />
            <div className="stat-icon"><i className="fa-solid fa-file-lines" /></div>
            <div className="stat-label">Total Reports</div>
            <div className="stat-value">20</div>
            <div className="stat-change up"><i className="fa-solid fa-arrow-up" style={{ fontSize: '0.65rem' }} /> 18% vs last month</div>
          </div>
          <div className="stat-card card-success">
            <div className="stat-card-glow" />
            <div className="stat-icon"><i className="fa-solid fa-check" /></div>
            <div className="stat-label">Approved</div>
            <div className="stat-value">12</div>
            <div className="stat-change up"><i className="fa-solid fa-arrow-up" style={{ fontSize: '0.65rem' }} /> 80% rate</div>
          </div>
          <div className="stat-card card-danger">
            <div className="stat-card-glow" />
            <div className="stat-icon"><i className="fa-solid fa-xmark" /></div>
            <div className="stat-label">Denied</div>
            <div className="stat-value">3</div>
            <div className="stat-change down"><i className="fa-solid fa-arrow-down" style={{ fontSize: '0.65rem' }} /> Needs attention</div>
          </div>
          <div className="stat-card card-warn">
            <div className="stat-card-glow" />
            <div className="stat-icon"><i className="fa-solid fa-clock" /></div>
            <div className="stat-label">Pending</div>
            <div className="stat-value">5</div>
            <div className="stat-change" style={{ color: 'var(--warn)' }}>Awaiting review</div>
          </div>
        </div>

        {/* CHART + RECENT LOGS */}
        <div className="section-label">Analytics & Logs</div>
        <div className="analytics-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Submission Activity</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Oct 2025 – Mar 2026</div>
              </div>
              <span className="panel-tag">Last 6 Months</span>
            </div>
            <div className="chart-wrap"><canvas id="activityChart" /></div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Recent Logs</div>
              <button className="panel-link">View All →</button>
            </div>
            <table className="logs-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Crop</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log, i) => (
                  <tr key={i}>
                    <td><span className="report-id">{log.id}</span></td>
                    <td className="crop-cell"><span className="crop-tag"><i className="fa-solid fa-seedling" style={{ fontSize: '0.65rem' }} />{log.crop}</span></td>
                    <td className="date-cell">{log.date}</td>
                    <td className="status-cell">
                      <span className={`status-pill ${getStatusClass(log.status)}`}>
                        <span className="status-dot" />{log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM: Quick Actions + Activity Feed */}
        <div className="bottom-grid" style={{ marginTop: '1.25rem' }}>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Quick Actions</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { icon: 'fa-file-circle-plus', label: 'New Cacao Report', sub: 'Submit a new crop data entry', color: 'var(--secondary)' },
                { icon: 'fa-magnifying-glass', label: 'Review Denied Reports', sub: '3 reports need your attention', color: 'var(--danger)' },
                { icon: 'fa-file-export', label: 'Export to CSV', sub: 'Download your submission history', color: 'var(--text-muted)' },
              ].map((a, i) => (
                <button key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '0.875rem 1rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', fontFamily: "'Poppins', sans-serif" }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(61,86,42,0.1)', color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', flexShrink: 0 }}>
                    <i className={`fa-solid ${a.icon}`} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', fontFamily: "'Poppins', sans-serif" }}>{a.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{a.sub}</div>
                  </div>
                  <i className="fa-solid fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Activity Feed</div>
              <button className="panel-link">See all</button>
            </div>
            {activityFeed.map((a, i) => (
              <div key={i} className="activity-item">
                <div className={`activity-icon ${a.type}`}><i className={`fa-solid ${a.icon}`} /></div>
                <div className="activity-body">
                  <div className="activity-text">{a.text}</div>
                  <div className="activity-time"><i className="fa-regular fa-clock" style={{ fontSize: '0.6rem' }} />{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserDashboard;