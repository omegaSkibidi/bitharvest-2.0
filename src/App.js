import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Main folder
import PublicDashboard from './PublicDashboard';
import Login from './Login';

// Encoder folder
import UserDashboard from './encoder/UserDashboard'; 
import EncoderOverview from './encoder/EncoderOverview'; 
import CropReports from './encoder/CropReports'; 
import MySubmissions from './encoder/MySubmissions'; 
import Analytics from './encoder/Analytics'; 

// Admin folder
import AdminDashboard from './admin/AdminDashboard';
import AdminOverview from './admin/AdminOverview';
import ReportManagement from './admin/ReportManagement';
import DataManagement from './admin/DataManagement';
import TableCreation from './admin/TableCreation';


import './App.css'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicDashboard />} />
        <Route path="/login" element={<Login />} />
        
        {/* Encoder routes */}
        <Route path="/encoder" element={<UserDashboard />}>
          <Route index element={<EncoderOverview />} />
          <Route path="reports" element={<CropReports />} />
          <Route path="submissions" element={<MySubmissions />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      <Route path="/admin" element={<AdminDashboard />}>
  <Route index element={<AdminOverview />} />
  <Route path="reports" element={<ReportManagement />} />
  <Route path="data" element={<DataManagement />} />
  <Route path="table-creation" element={<TableCreation />} />
</Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;