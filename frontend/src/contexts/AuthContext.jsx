// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, logoutUser } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        user: null,
        isLoading: true,
    });

    const verifyUser = useCallback(async () => {
        try {
            // Se intenta obtener el usuario. Si la cookie es válida, funcionará.
            const user = await getCurrentUser(); 
            // La cookie es válida, el usuario está autenticado.
            setAuthState({ isAuthenticated: true, user: { username: user.username, rol: user.rol }, isLoading: false });
        } catch (error) {
            // Si falla (ej. 401), significa que no hay cookie válida.
            setAuthState({ isAuthenticated: false, user: null, isLoading: false });
        }
    }, []);

    useEffect(() => {
        // Al cargar la aplicación, se verifica si hay una sesión válida
        verifyUser();
    }, [verifyUser]);

    const login = async () => {
        // Después de un login exitoso desde LoginPage, llamamos a verifyUser
        // para actualizar el estado global. La cookie ya habrá sido establecida por el backend.
        await verifyUser();
    };

    const logout = async () => {
        try {
            await logoutUser(); // Llama al endpoint del backend para borrar la cookie
        } catch (error) {
            console.error("Error en el logout del backend:", error);
        } finally {
            // Se actualiza el estado del frontend independientemente del resultado del backend
            setAuthState({ isAuthenticated: false, user: null, isLoading: false });
        }
    };

    if (authState.isLoading) {
        return <div>Cargando...</div>; // Muestra un estado de carga inicial
    }

    return (
        <AuthContext.Provider value={{ authState, login, logout, verifyUser }}>
            {children}
        </AuthContext.Provider>
    );
};