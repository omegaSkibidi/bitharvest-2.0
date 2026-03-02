import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './UserDashboard.css';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Map out your exact links
  const navItems = [
    { path: '/encoder', icon: 'fa-border-all', label: 'Dashboard', end: true },
    { path: '/encoder/reports', icon: 'fa-file-lines', label: 'Crop Reports', badge: 5 },
    { path: '/encoder/submissions', icon: 'fa-list-check', label: 'My Submissions' },
    { path: '/encoder/analytics', icon: 'fa-chart-line', label: 'Analytics' }
  ];

  // 2. Find which index is currently active
  const activeIndex = navItems.findIndex(item => 
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );

  // 3. Calculate how far down the pill needs to slide
  // 42px height + 4px margin bottom = 46px offset per item
  const slideOffset = activeIndex !== -1 ? activeIndex * 46 : 0;

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
          {/* THE SLIDING HIGHLIGHT PILL */}
          <div 
            className="nav-active-indicator" 
            style={{ 
              transform: `translateY(${slideOffset}px)`,
              opacity: activeIndex === -1 ? 0 : 1 
            }} 
          />

          {/* THE ACTUAL LINKS */}
          {navItems.map((item, index) => (
            <NavLink 
              key={index} 
              to={item.path} 
              end={item.end} 
              className="nav-item"
            >
              <i className={`fa-solid ${item.icon}`} /> {item.label}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
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
              <button className="profile-action-btn signout" onClick={() => navigate('/')}>
                <i className="fa-solid fa-arrow-right-from-bracket" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT (SCROLLABLE & DYNAMIC) ─── */}
      <main className="main-content" style={{ overflowY: 'auto', height: '100vh' }}>
        <div key={location.pathname} className="page-transition-wrapper">
            <Outlet />
        </div>
      </main>
    </div>
  );
}