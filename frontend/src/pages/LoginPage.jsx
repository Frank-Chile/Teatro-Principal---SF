// frontend/src/pages/LoginPage.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { loginUser } from '../services/authService';
import { FaUser, FaLock } from 'react-icons/fa'; // Importamos los iconos
import '../assets/css/AuthForm.css';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { authState, login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (authState.isAuthenticated) {
            const from = location.state?.from?.pathname || (authState.user?.rol === 'admin' ? '/admin' : '/client');
            navigate(from, { replace: true });
        }
    }, [authState.isAuthenticated, authState.user, navigate, location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await loginUser(username, password);
            await login();
        } catch (err) {
            setError(err.detail || 'Error al iniciar sesión. Verifica tus credenciales.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (authState.isLoading || authState.isAuthenticated) {
        return <div className="loading-container">Cargando...</div>; 
    }

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Iniciar Sesión</h2>
                
                {/* CAMBIO: Se usa la estructura con icono */}
                <div className="input-group-icon">
                    <FaUser className="input-icon" />
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Nombre de Usuario"
                        required
                    />
                </div>
                
                {/* CAMBIO: Se usa la estructura con icono */}
                <div className="input-group-icon">
                    <FaLock className="input-icon" />
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña"
                        required
                    />
                </div>
                
                {error && <p className="error-message form-error">{error}</p>}
                
                <button type="submit" disabled={isLoading} className="submit-btn">
                    {isLoading ? 'Ingresando...' : 'Ingresar'}
                </button>

                <p className="redirect-link">
                    ¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link>
                </p>
            </form>
        </div>
    );
}

export default LoginPage;