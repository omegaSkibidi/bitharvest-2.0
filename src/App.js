import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicDashboard from './PublicDashboard';
import UserDashboard from './UserDashboard';
import Login from './Login';
import './App.css'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The main dashboard loads on the default "/" path */}
        <Route path="/" element={<PublicDashboard />} />
        
        {/* The login page loads when the URL is "/login" */}
        <Route path="/login" element={<Login />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;