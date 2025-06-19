// src/components/admin/FunctionManager/FunctionManager.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';

function FunctionManager() {
    return (
        <div>
            <h2>Gestión de Funciones</h2>
            <Outlet /> {/* Aquí se renderizarán FunctionList, FunctionForm, etc. */}
        </div>
    );
}

export default FunctionManager;