// src/components/common/Navbar.jsx
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Assuming your file is named AuthContext.jsx
import { AuthContext } from '../../contexts/AuthContext.jsx'; 

function Navbar() {
    const { authState, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav>
            <ul>
                <li><Link to="/">Teatro Principal</Link></li>
                {authState.isAuthenticated ? (
                    <>
                        {authState.user?.rol === 'admin' && <li><Link to="/admin">Panel Admin</Link></li>}
                        {authState.user?.rol === 'cliente' && <li><Link to="/client">Panel Cliente</Link></li>}
                        <li><button onClick={handleLogout}>Cerrar Sesión ({authState.user?.username})</button></li>
                    </>
                ) : (
                    <li><Link to="/login">Iniciar Sesión</Link></li>
                )}
            </ul>
        </nav>
    );
}

export default Navbar;