// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        token: null,
        isAuthenticated: false,
        user: null,
        isLoading: true, 
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedUser = jwtDecode(token);
                // Aquí podrías añadir una verificación de expiración del token
                // if (decodedUser.exp * 1000 < Date.now()) {
                //     localStorage.removeItem('token');
                //     setAuthState({ token: null, isAuthenticated: false, user: null, isLoading: false });
                // } else {
                setAuthState({
                    token: token,
                    isAuthenticated: true,
                    user: { username: decodedUser.sub, rol: decodedUser.rol }, // Asegúrate que 'rol' esté en tu token JWT payload
                    isLoading: false,
                });
                // }
            } catch (error) {
                console.error("Error decodificando token inicial:", error);
                localStorage.removeItem('token');
                setAuthState({ token: null, isAuthenticated: false, user: null, isLoading: false });
            }
        } else {
            setAuthState({ token: null, isAuthenticated: false, user: null, isLoading: false });
        }
    }, []);

    const login = (token) => {
        localStorage.setItem('token', token);
        try {
            const decodedUser = jwtDecode(token);
            setAuthState({
                token: token,
                isAuthenticated: true,
                user: { username: decodedUser.sub, rol: decodedUser.rol },
                isLoading: false,
            });
        } catch (error) {
            console.error("Error decodificando token en login:", error);
            logout(); 
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setAuthState({
            token: null,
            isAuthenticated: false,
            user: null,
            isLoading: false,
        });
    };

    // No es estrictamente necesario mostrar un estado de carga aquí si los componentes hijos lo manejan,
    // pero si quieres una pantalla de carga global mientras el contexto se inicializa:
    // if (authState.isLoading) {
    //     return <div>Cargando autenticación global...</div>; 
    // }

    return (
        <AuthContext.Provider value={{ authState, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};