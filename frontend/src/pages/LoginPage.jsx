// src/pages/LoginPage.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { loginUser } from '../services/authService';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { authState, login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Redirigir si ya está autenticado
    useEffect(() => {
        if (authState.isAuthenticated) {
            const from = location.state?.from?.pathname;
            if (from) {
                navigate(from, { replace: true });
            } else if (authState.user?.rol === 'admin') {
                navigate('/admin', { replace: true });
            } else if (authState.user?.rol === 'cliente') {
                navigate('/client', { replace: true });
            }
        }
    }, [authState.isAuthenticated, authState.user, navigate, location.state]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const data = await loginUser(username, password);
            login(data.access_token); 
        } catch (err) {
            setError(err.detail || err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Si isLoading es true (desde AuthContext) O si ya está autenticado, no mostrar el formulario.
    if (authState.isLoading || authState.isAuthenticated) { 
        return <div>Cargando o ya autenticado...</div>; 
    }

    return (
        <div className="login-form">
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Usuario:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Contraseña:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Ingresando...' : 'Ingresar'}
                </button>
            </form>
        </div>
    );
}

export default LoginPage;