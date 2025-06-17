// src/App.jsx
import React, { useContext } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';

import Navbar from './components/common/Navbar'; // <--- ASEGÚRATE QUE ESTA LÍNEA ESTÉ PRESENTE Y LA RUTA SEA CORRECTA
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import ClientPage from './pages/ClientPage';
import AdminDashboard from './components/admin/AdminDashboard';
import FunctionManager from './components/admin/FunctionManager/FunctionManager';
import FunctionList from './components/admin/FunctionManager/FunctionList';
import FunctionForm from './components/admin/FunctionManager/FunctionForm';
import SeatList from './components/admin/SeatManager/SeatList';
import ReportGenerator from './components/admin/ReportGenerator/ReportGenerator';
import FunctionListView from './components/client/FunctionListView';
import SeatMapView from './components/client/SeatSelector/SeatMapView';


// Componente para proteger rutas (sin cambios)
const ProtectedRoute = ({ allowedRoles }) => {
    const { authState } = useContext(AuthContext);

    if (authState.isLoading) {
        return <div>Verificando autenticación...</div>;
    }

    if (!authState.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(authState.user?.rol)) {
        alert('No tienes permiso para acceder a esta página.');
        return <Navigate to={authState.user?.rol === 'admin' ? '/admin' : '/client'} replace />;
    }

    return <Outlet />;
};


function App() {
    return (
        <>
            <Navbar /> {/* Esta línea ahora debería funcionar */}
            <div className="container">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    {/* Rutas de Administrador */}
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path="/admin" element={<AdminPage />}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="gestionar-funciones" element={<FunctionManager />}>
                                <Route index element={<FunctionList />} />
                                <Route path="nueva" element={<FunctionForm />} />
                                <Route path=":funcionId/editar" element={<FunctionForm />} />
                                <Route path=":funcionId/butacas" element={<SeatList />} />
                            </Route>
                            <Route path="generar-reportes" element={<ReportGenerator />} />
                        </Route>
                    </Route>
                    
                    {/* Rutas de Cliente */}
                    <Route element={<ProtectedRoute allowedRoles={['cliente']} />}>
                        <Route path="/client" element={<ClientPage />}>
                            <Route index element={<FunctionListView />} />
                            <Route path="funcion/:funcionId/seleccionar-butacas" element={<SeatMapView />} />
                        </Route>
                    </Route>

                    <Route path="/" element={<NavigateToDashboard />} />
                    <Route path="*" element={<div>Página no encontrada</div>} />
                </Routes>
            </div>
        </>
    );
}

// Componente para redirigir al dashboard correcto o a login (sin cambios)
const NavigateToDashboard = () => {
    const { authState } = useContext(AuthContext);
    if (authState.isLoading) return <div>Cargando...</div>;
    if (!authState.isAuthenticated) return <Navigate to="/login" replace />;
    if (authState.user?.rol === 'admin') return <Navigate to="/admin" replace />;
    if (authState.user?.rol === 'cliente') return <Navigate to="/client" replace />;
    return <Navigate to="/login" replace />; 
};

export default App;