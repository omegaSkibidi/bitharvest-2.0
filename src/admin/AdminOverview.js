import React, { useState, useEffect, useRef } from 'react';
import './AdminDashboard.css';

export default function AdminOverview() {
  const chartRef = useRef(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const notifications = [
    { id: 1, type: 'warning', text: 'New report pending review from', highlight: 'Ken Alcazar', time: '5 mins ago', unread: true },
    { id: 2, type: 'warning', text: '3 reports have been waiting for review for over', highlight: '48 hours', time: '1 hour ago', unread: true },
    { id: 3, type: 'info', text: 'New encoder account registered:', highlight: 'Maria Santos', time: 'Today', unread: false },
    { id: 4, type: 'success', text: 'System data export completed successfully.', highlight: null, time: 'Yesterday', unread: false },
  ];

  // Reports awaiting admin action
  const pendingReports = [
    { id: 'CACAD-005', encoder: 'Ken Alcazar', crop: 'Cacao', date: 'Feb 26, 11:45 AM', waiting: '1 day' },
    { id: 'BANAN-012', encoder: 'Maria Santos', crop: 'Banana', date: 'Feb 25, 3:00 PM', waiting: '2 days' },
    { id: 'RICE-088', encoder: 'Jose Reyes', crop: 'Rice', date: 'Feb 24, 9:00 AM', waiting: '3 days' },
    { id: 'CORN-031', encoder: 'Ana Cruz', crop: 'Corn', date: 'Feb 23, 1:30 PM', waiting: '4 days' },
  ];

  // Top encoders by submissions this month
  const topEncoders = [
    { name: 'Ken Alcazar', division: 'Cacao Division', count: 18, initials: 'KA' },
    { name: 'Maria Santos', division: 'Banana Division', count: 15, initials: 'MS' },
    { name: 'Jose Reyes', division: 'Rice Division', count: 14, initials: 'JR' },
    { name: 'Ana Cruz', division: 'Corn Division', count: 11, initials: 'AC' },
    { name: 'Luis Garcia', division: 'Vegetable Division', count: 9, initials: 'LG' },
  ];

  const activityFeed = [
    { type: 'success', icon: 'fa-circle-check', text: <>You <strong>approved</strong> report <strong>CACAD-004</strong> from Ken Alcazar</>, time: '10 mins ago' },
    { type: 'info', icon: 'fa-file-circle-plus', text: <>New report <strong>CACAD-005</strong> submitted by <strong>Ken Alcazar</strong></>, time: '1 hour ago' },
    { type: 'danger', icon: 'fa-circle-xmark', text: <>You <strong>denied</strong> report <strong>CACAD-003</strong> — Reason: Incomplete data</>, time: '3 hours ago' },
    { type: 'info', icon: 'fa-user-plus', text: <>New encoder <strong>Luis Garcia</strong> registered and assigned to Vegetable Division</>, time: 'Today' },
    { type: 'warn', icon: 'fa-triangle-exclamation', text: <><strong>3 reports</strong> have been pending for over 48 hours</>, time: 'Today' },
  ];

  useEffect(() => {
    const Chart = window.Chart;
    if (!Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    Chart.defaults.font.family = "'Poppins', sans-serif";

    const chartCanvas = document.getElementById('adminActivityChart');
    if (chartCanvas) {
      const ctx = chartCanvas.getContext('2d');
      chartRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
          datasets: [
            {
              label: 'Total Submitted',
              data: [42, 58, 51, 73, 65, 18],
              //  green for highlighted (most recent complete month), medium green for others
              backgroundColor: (ctx) => ctx.dataIndex === 4 ? '#02C937' : '#04A82E',     
              borderRadius: 8,
              borderSkipped: false,
            },
            {
              label: 'Approved',
              data: [35, 48, 40, 60, 50, 0],
              //  green for Approved bars
              backgroundColor: 'rgba(2, 201, 55, 0.25)',              
              borderRadius: 8,
              borderSkipped: false,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: {
                color: '#333333',
                font: { size: 11, weight: '600' },
                usePointStyle: true,
                pointStyleWidth: 8,
                boxHeight: 6,
              },
            },
            tooltip: {
              backgroundColor: '#FAF9F6',
              borderColor: '#DCE3D0',
              borderWidth: 1,
              titleColor: '#000000',
              bodyColor: '#333333',
              padding: 10,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#64748B', font: { size: 11 } },
            },
            y: {
              grid: { color: '#EEF2E8' },
              ticks: { color: '#64748B', font: { size: 11 } },
            },
          },
        },
      });
    }
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, []);

  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="admin-overview-container">
      {/* HEADER */}
      <header className="main-header">
        <div className="header-left">
          <div className="header-avatar-wrap">
            <i className="fa-solid fa-shield-halved" />
          </div>
          <div>
            <div className="header-greeting-label">Admin Dashboard</div>
            <h1 className="header-title">Good day, Admin!</h1>
            <p className="header-subtitle">You have 8 reports awaiting your review.</p>
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
                    <div className={`notif-icon ${n.type === 'danger' ? 'danger' : n.type === 'warning' ? 'warning' : n.type === 'info' ? 'info' : 'success'}`}>
                      <i className={`fa-solid ${n.type === 'success' ? 'fa-circle-check' : n.type === 'danger' ? 'fa-circle-xmark' : n.type === 'info' ? 'fa-circle-info' : 'fa-circle-exclamation'}`} />
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


      {/* STATS */}
      <div className="section-label">System Summary</div>
      <div className="stats-grid">
        <div className="stat-card card-primary">
          <div className="stat-card-glow" />
          <div className="stat-icon"><i className="fa-solid fa-file-lines" /></div>
          <div className="stat-label">Total Reports</div>
          <div className="stat-value">247</div>
          <div className="stat-change up"><i className="fa-solid fa-arrow-up" style={{ fontSize: '0.65rem' }} /> 21% vs last month</div>
        </div>
        <div className="stat-card card-warn">
          <div className="stat-card-glow" />
          <div className="stat-icon"><i className="fa-solid fa-hourglass-half" /></div>
          <div className="stat-label">Pending Review</div>
          <div className="stat-value">8</div>
          <div className="stat-change" style={{ color: 'var(--warn)' }}>Needs your action</div>
        </div>
        <div className="stat-card card-success">
          <div className="stat-card-glow" />
          <div className="stat-icon"><i className="fa-solid fa-check" /></div>
          <div className="stat-label">Approved</div>
          <div className="stat-value">189</div>
          <div className="stat-change up"><i className="fa-solid fa-arrow-up" style={{ fontSize: '0.65rem' }} /> 76% approval rate</div>
        </div>
        <div className="stat-card card-danger">
          <div className="stat-card-glow" />
          <div className="stat-icon"><i className="fa-solid fa-xmark" /></div>
          <div className="stat-label">Denied</div>
          <div className="stat-value">50</div>
          <div className="stat-change down"><i className="fa-solid fa-arrow-down" style={{ fontSize: '0.65rem' }} /> 24% denial rate</div>
        </div>
      </div>

      {/* CHART + PENDING QUEUE */}
      <div className="section-label">Analytics & Pending Queue</div>
      <div className="analytics-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">System-wide Submission Activity</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>All encoders · Oct 2025 – Mar 2026</div>
            </div>
            <span className="panel-tag">Last 6 Months</span>
          </div>
          <div className="chart-wrap"><canvas id="adminActivityChart" /></div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Pending Reports</div>
            <button className="panel-link">View All →</button>
          </div>
          <table className="logs-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Encoder</th>
                <th>Waiting</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingReports.map(r => (
                <tr key={r.id}>
                  <td><span className="report-id">{r.id}</span></td>
                  <td className="encoder-cell">{r.encoder}</td>
                  <td className="date-cell" style={{ color: r.waiting.includes('3') || r.waiting.includes('4') ? 'var(--danger)' : 'var(--warn)' }}>
                    <i className="fa-regular fa-clock" style={{ marginRight: '4px' }} />{r.waiting}
                  </td>
                  <td className="status-cell">
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button className="action-btn approve"><i className="fa-solid fa-check" /></button>
                      <button className="action-btn deny"><i className="fa-solid fa-xmark" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTTOM: Encoder Leaderboard + Activity Feed */}
      <div className="bottom-grid" style={{ marginTop: '1.25rem' }}>
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Top Encoders This Month</div>
            <span className="panel-tag">Feb 2026</span>
          </div>
          {topEncoders.map((enc, i) => (
            <div key={i} className="encoder-row">
              <div className={`encoder-rank ${i < 3 ? 'top' : ''}`}>#{i + 1}</div>
              <div className="encoder-avatar">{enc.initials}</div>
              <div className="encoder-info">
                <div className="encoder-name">{enc.name}</div>
                <div className="encoder-sub">{enc.division}</div>
              </div>
              <div className="encoder-count">{enc.count} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>reports</span></div>
            </div>
          ))}
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
    </div>
  );
}