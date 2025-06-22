// frontend/src/components/layout/Sidebar.jsx
import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaTachometerAlt, FaTheaterMasks, FaChartBar, FaTicketAlt, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import './Sidebar.css';

function Sidebar() {
    const { authState, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <FaTheaterMasks className="logo-icon" />
                <h1 className="logo-text">Teatro Principal</h1>
            </div>
            <nav className="sidebar-nav">
                {authState.user?.rol === 'admin' && (
                    <>
                        <NavLink to="/admin" end className="nav-link">
                            <FaTachometerAlt /><span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/admin/gestionar-funciones" className="nav-link">
                            <FaTicketAlt /><span>Funciones</span>
                        </NavLink>
                        <NavLink to="/admin/generar-reportes" className="nav-link">
                            <FaChartBar /><span>Reportes</span>
                        </NavLink>
                    </>
                )}
                {authState.user?.rol === 'cliente' && (
                    <>
                        <NavLink to="/client" end className="nav-link">
                            <FaTicketAlt /><span>Funciones</span>
                        </NavLink>
                        <NavLink to="/client/mis-entradas" className="nav-link">
                            <FaUserCircle /><span>Mis Entradas</span>
                        </NavLink>
                    </>
                )}
            </nav>
            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">{authState.user?.username.charAt(0).toUpperCase()}</div>
                    <div className="user-details">
                        <span className="user-name">{authState.user?.username}</span>
                        <span className="user-role">{authState.user?.rol}</span>
                    </div>
                </div>
                <button onClick={handleLogout} className="logout-button">
                    <FaSignOutAlt /><span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;