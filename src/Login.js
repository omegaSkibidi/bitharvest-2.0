import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // TEMPORARY: Skipping backend validation for the APAO presentation
    console.log("Bypassing login for presentation purposes...");
    
    // Redirect straight to the internal staff dashboard
    navigate('/user-dashboard'); 
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ backgroundColor: 'var(--container-bg)', padding: '3rem', borderRadius: '1.5rem', boxShadow: '0 10px 25px rgba(61, 86, 42, 0.1)', width: '100%', maxWidth: '420px', border: '1px solid var(--border-color)' }}>
        
        {/* Back to Dashboard Button */}
        <button 
          onClick={() => navigate('/')} 
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '2rem', fontWeight: 600 }}
        >
          <i className="fa-solid fa-arrow-left"></i> Back to Public Portal
        </button>

        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--secondary), var(--complementary))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 8px 16px rgba(95, 120, 61, 0.2)' }}>
            <i className="fa-solid fa-leaf" style={{ color: 'var(--container-bg)', fontSize: '1.8rem' }}></i>
          </div>
          <h2 style={{ color: 'var(--primary)', fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem', marginBottom: '0.5rem' }}>APAO Secure Login</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Authorized provincial office staff only.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Official Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="encoder@albay.gov.ph"
              style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
            Secure Sign In
          </button>
        </form>

      </div>
    </div>
  );
}

export default Login;