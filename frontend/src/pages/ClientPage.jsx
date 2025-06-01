// src/pages/ClientPage.jsx
import React from 'react';
import { Link, Outlet } from 'react-router-dom';

function ClientPage() {
    // Podrías tener una barra lateral o sub-navegación aquí
    return (
        <div>
            <h1>Portal del Cliente</h1>
             {/* El contenido de las rutas anidadas se renderizará aquí */}
            <Outlet />
        </div>
    );
}

export default ClientPage;