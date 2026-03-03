import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './UserDashboard.css';

function UserDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Define your navigation links to calculate the sliding animation
  const navItems = [
    { path: '/encoder', icon: 'fa-border-all', label: 'Dashboard', end: true },
    { path: '/encoder/analytics', icon: 'fa-chart-line', label: 'Agricultural Analytics' },
    { path: '/encoder/reports', icon: 'fa-file-lines', label: 'Crop Reports', badge: 5 },
    { path: '/encoder/submissions', icon: 'fa-list-check', label: 'My Submissions' }
    
  ];

  // 2. Find which index is currently active based on the URL
  const activeIndex = navItems.findIndex(item => 
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );

  // 3. Calculate how far down the highlight pill needs to slide
  // 42px height + 4px margin = 46px offset per item (Adjust based on your CSS)
  const slideOffset = activeIndex !== -1 ? activeIndex * 46 : 0;

  return (
    <div className="dashboard-root">
      {/* Background Orbs */}
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
              opacity: activeIndex === -1 ? 0 : 1 // Hides if the URL doesn't match
            }} 
          />

          {/* GENERATE THE NAV LINKS */}
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
              <button className="profile-action-btn signout" onClick={() => navigate('/')}>
                <i className="fa-solid fa-arrow-right-from-bracket" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── DYNAMIC MAIN CONTENT AREA ─── */}
      <main className="main-content">
        
        {/* This key={location.pathname} is what triggers the slide-up animation 
          in your CSS every time the URL changes!
        */}
        <div key={location.pathname} className="page-transition-wrapper">
            
            {/* The <Outlet /> acts as a portal. React Router looks at the URL, 
              grabs the right component (like EncoderOverview.js), and injects it here. 
            */}
            <Outlet />

        </div>
      </main>
    </div>
  );
}

export default UserDashboard;