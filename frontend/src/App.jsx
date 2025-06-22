// frontend/src/App.jsx
import React, { useContext } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Layout Imports ---
import MainLayout from './components/layout/MainLayout';

// --- Page Imports ---
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import ClientPage from './pages/ClientPage';

// --- Admin Component Imports ---
import AdminDashboard from './components/admin/AdminDashboard';
import FunctionManager from './components/admin/FunctionManager/FunctionManager';
import FunctionList from './components/admin/FunctionManager/FunctionList';
import FunctionForm from './components/admin/FunctionManager/FunctionForm';
import SeatGridManager from './components/admin/SeatManager/SeatGridManager';
import ReportGenerator from './components/admin/ReportGenerator/ReportGenerator';

// --- Client Component Imports ---
import FunctionListView from './components/client/FunctionListView';
import SeatMapView from './components/client/SeatSelector/SeatMapView';
import MyTicketsPage from './components/client/MyTicketsDashboard';
import TicketDetailView from './components/client/TicketDetailView';

// Componente para proteger rutas según el rol del usuario
const ProtectedRoute = ({ allowedRoles }) => {
    const { authState } = useContext(AuthContext);

    if (authState.isLoading) {
        return <div>Verificando autenticación...</div>;
    }

    if (!authState.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(authState.user?.rol)) {
        // Si el usuario no tiene el rol permitido, lo redirige a su página principal
        const defaultRoute = authState.user?.rol === 'admin' ? '/admin' : '/client';
        return <Navigate to={defaultRoute} replace />;
    }

    return <Outlet />; // Renderiza las rutas anidadas si la autenticación y el rol son correctos
};

function App() {
    return (
        <>
            <ToastContainer theme="dark" position="bottom-right" autoClose={3000} />
            <Routes>
                {/* --- Rutas Públicas --- */}
                {/* Estas rutas no usan el MainLayout y tienen su propio estilo */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* --- Rutas Protegidas --- */}
                {/* Todas las rutas aquí dentro requerirán que el usuario esté autenticado */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'cliente']} />}>
                    {/* Todas las rutas aquí dentro usarán el MainLayout (con el Sidebar) */}
                    <Route element={<MainLayout />}>
                        <Route path="/admin" element={<AdminPage />}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="gestionar-funciones" element={<FunctionManager />}>
                                <Route index element={<FunctionList />} />
                                <Route path="nueva" element={<FunctionForm />} />
                                <Route path=":funcionId/editar" element={<FunctionForm />} />
                                <Route path=":funcionId/butacas" element={<SeatGridManager />} />
                            </Route>
                            <Route path="generar-reportes" element={<ReportGenerator />} />
                        </Route>
                        
                        <Route path="client" element={<ClientPage />}>
                            <Route index element={<FunctionListView />} />
                            <Route path="funcion/:funcionId/seleccionar-butacas" element={<SeatMapView />} />
                            <Route path="mis-entradas" element={<MyTicketsPage />} />
                            <Route path="mis-entradas/:funcionId" element={<TicketDetailView />} />
                        </Route>
                    </Route>
                </Route>

                {/* --- Redirección y Ruta Comodín --- */}
                <Route path="/" element={<NavigateToDashboard />} />
                <Route path="*" element={<div style={{textAlign: 'center', marginTop: '50px'}}><h2>404 - Página no encontrada</h2></div>} />
            </Routes>
        </>
    );
}

// Componente para redirigir al dashboard correcto o a login
const NavigateToDashboard = () => {
    const { authState } = useContext(AuthContext);
    if (authState.isLoading) return <div>Cargando...</div>;
    if (!authState.isAuthenticated) return <Navigate to="/login" replace />;
    if (authState.user?.rol === 'admin') return <Navigate to="/admin" replace />;
    if (authState.user?.rol === 'cliente') return <Navigate to="/client" replace />;
    return <Navigate to="/login" replace />;
};

export default App;