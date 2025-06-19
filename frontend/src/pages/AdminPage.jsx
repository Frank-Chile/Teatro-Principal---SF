// src/pages/AdminPage.jsx
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

function AdminPage() {
    const location = useLocation();
    // Podrías tener una barra lateral o sub-navegación aquí
    return (
        <div>
            <h1>Panel de Administración</h1>
            {/* Sub-navegación específica del admin (opcional) */}
            <nav style={{ backgroundColor: '#e9ecef', padding: '10px', marginBottom: '20px', borderRadius: '5px' }}>
                <ul style={{ display: 'flex', listStyle: 'none', padding: 0, justifyContent: 'flex-start' }}>
                    <li style={{ marginRight: '15px' }}><Link to="/admin">Dashboard</Link></li>
                    {/* <li style={{ marginRight: '15px' }}><Link to="/admin/funciones">Gestionar Funciones</Link></li> */}
                    {/* <li style={{ marginRight: '15px' }}><Link to="/admin/reportes">Generar Reportes</Link></li> */}
                    {/* Añade más links a medida que crees los componentes */}
                </ul>
            </nav>

            {/* El contenido de las rutas anidadas (index, funciones, reportes) se renderizará aquí */}
            <Outlet />
        </div>
    );
}

export default AdminPage;