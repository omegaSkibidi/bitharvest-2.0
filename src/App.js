import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// These are still in the main folder, so they stay the same:
import PublicDashboard from './PublicDashboard';
import Login from './Login';

// THESE MOVED: Update the paths to point inside the "encoder" folder:
import UserDashboard from './encoder/UserDashboard'; 
import EncoderOverview from './encoder/EncoderOverview'; 
import CropReports from './encoder/CropReports'; 
import MySubmissions from './encoder/MySubmissions'; 
import Analytics from './encoder/Analytics'; 

import './App.css'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicDashboard />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/encoder" element={<UserDashboard />}>
          <Route index element={<EncoderOverview />} />
          <Route path="reports" element={<CropReports />} />
          <Route path="submissions" element={<MySubmissions />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;