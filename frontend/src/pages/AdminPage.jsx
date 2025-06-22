// frontend/src/pages/AdminPage.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminDashboard from '../components/admin/AdminDashboard';
import FunctionManager from '../components/admin/FunctionManager/FunctionManager';
import ReportGenerator from '../components/admin/ReportGenerator/ReportGenerator';

function AdminPage() {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="gestionar-funciones/*" element={<FunctionManager />} />
      <Route path="generar-reportes" element={<ReportGenerator />} />
    </Routes>
  );
}

export default AdminPage;