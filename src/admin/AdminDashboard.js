import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/admin', icon: 'fa-border-all', label: 'Dashboard', end: true },
    { path: '/admin/reports', icon: 'fa-file-circle-check', label: 'Report Management', badge: 8 },
    { path: '/admin/data', icon: 'fa-database', label: 'Data Management' },
    { path: '/admin/table-creation', icon: 'fa-table-list', label: 'Table Creation'}
  ];

  const activeIndex = navItems.findIndex(item =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );

  // 42px height + 4px margin = 46px per item
  const slideOffset = activeIndex !== -1 ? activeIndex * 46 : 0;

  return (
    <div className="dashboard-root admin-root">

      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* ─── FIXED SIDEBAR ─── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><i className="fa-solid fa-shield-halved" /></div>
          <div>
            <div className="logo-text">Bit<span>Harvest</span></div>
            <div className="admin-badge"><i className="fa-solid fa-circle-dot" style={{ fontSize: '0.5rem' }} /> Admin Portal</div>
          </div>
        </div>

        <div className="sidebar-section-label">Navigation</div>

        <nav>
          <div
            className="nav-active-indicator"
            style={{
              transform: `translateY(${slideOffset}px)`,
              opacity: activeIndex === -1 ? 0 : 1,
            }}
          />
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

        <div className="sidebar-profile">
          <div className="profile-card">
            <div className="profile-top">
              <div className="user-avatar"><i className="fa-solid fa-user-shield" /></div>
              <div>
                <div className="user-name">Admin User</div>
                <div className="user-role-badge">
                  <span className="online-dot" />
                  APAO · System Administrator
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

      {/* ─── DYNAMIC MAIN CONTENT ─── */}
      <main className="main-content">
        <div key={location.pathname} className="page-transition-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}