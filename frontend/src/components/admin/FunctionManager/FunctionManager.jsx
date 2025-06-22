// frontend/src/components/admin/FunctionManager/FunctionManager.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FunctionList from './FunctionList';
import FunctionForm from './FunctionForm';
import SeatGridManager from '../SeatManager/SeatGridManager';

function FunctionManager() {
  return (
    <div>
      <Routes>
        <Route index element={<FunctionList />} />
        <Route path="nueva" element={<FunctionForm />} />
        <Route path=":funcionId/editar" element={<FunctionForm />} />
        <Route path=":funcionId/butacas" element={<SeatGridManager />} />
      </Routes>
    </div>
  );
}

export default FunctionManager;