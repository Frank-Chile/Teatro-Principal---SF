// src/components/admin/AdminDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
    return (
        <div className="form-container"> {/* Reutilizando clase para un estilo similar */}
            <h2>Dashboard de Administrador</h2>
            <p>Bienvenido al panel de administración.</p>
            <p>Desde aquí podrás gestionar las funciones del teatro, las butacas y generar reportes.</p>
            
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Botón para Crear/Modificar Función */}
                <Link to="/admin/gestionar-funciones" style={{ textDecoration: 'none', width: '80%', marginBottom: '10px' }}>
                    <button style={{ width: '100%' }}>Crear/Modificar Función</button>
                </Link>
                {/* Botón para Generar Reportes */}
                <Link to="/admin/generar-reportes" style={{ textDecoration: 'none', width: '80%' }}>
                    <button style={{ width: '100%' }}>Generar Reportes</button>
                </Link>
            </div>
        </div>
    );
}

export default AdminDashboard;