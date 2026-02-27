import React, { useState, useEffect } from 'react';
import './WelcomeModal.css';

const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Check local storage when the app loads
  useEffect(() => {
    const isHidden = localStorage.getItem('hideBitHarvestModal');
    if (isHidden !== 'true') {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideBitHarvestModal', 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        
        {/* Left Section - Logo */}
        <div className="modal-left">
          {/* REPLACE the src below with the actual path to your logo image */}
          <img 
            src="/logo.png" 
            alt="BitHarvest Logo" 
            className="modal-logo" 
          />
        </div>

        {/* Right Section - Content */}
        <div className="modal-right">
          <div className="modal-badge">ALBAY PROVINCIAL AGRICULTURE OFFICE</div>
          
          <h2 className="modal-title">Welcome to <span>BitHarvest</span></h2>
          <p className="modal-desc">
            An official data analytics platform by APAO — tracking agricultural production, harvest areas, and commodity data across all municipalities of Albay Province.
          </p>

          <div className="explore-divider">WHAT YOU CAN EXPLORE</div>

          <div className="feature-list">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
              </div>
              <div className="feature-text">
                <h4>Production By Area</h4>
                <p>View harvest volumes across every municipality via geographic heat maps.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 6 4 10 4 15a8 8 0 0 0 16 0c0-5-4-9-8-13Z"/><path d="M12 12v6"/><path d="M8 12c1.5 1.5 4 1.5 5.5 0"/></svg>
              </div>
              <div className="feature-text">
                <h4>Commodity Reports</h4>
                <p>Filter by rice, corn, and other key crops with year-over-year breakdowns.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="18" y="3" width="4" height="18"></rect><rect x="10" y="8" width="4" height="13"></rect><rect x="2" y="13" width="4" height="8"></rect></svg>
              </div>
              <div className="feature-text">
                <h4>Visual Analytics</h4>
                <p>Interactive charts, split views, and production summaries at a glance.</p>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              Don't show this again
            </label>
            <button className="explore-btn" onClick={handleClose}>
              Explore Dashboard 
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;