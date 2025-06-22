// frontend/src/contexts/AuthContext.jsx
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
            // Se intenta obtener el usuario. Si la cookie es válida, esta llamada funcionará.
            const user = await getCurrentUser();
            // Si la llamada tiene éxito, el usuario está autenticado.
            setAuthState({ isAuthenticated: true, user: user, isLoading: false });
        } catch (error) {
            // Si la llamada falla (ej. error 401), no hay sesión válida.
            setAuthState({ isAuthenticated: false, user: null, isLoading: false });
        }
    }, []);

    useEffect(() => {
        // Al cargar la aplicación por primera vez, verificamos si hay una sesión activa.
        verifyUser();
    }, [verifyUser]);

    const login = async () => {
        // Después de un login exitoso en LoginPage, llamamos a verifyUser.
        // La cookie ya habrá sido establecida por el backend.
        // Esto simplemente actualizará el estado del frontend para reflejar el nuevo estado de login.
        await verifyUser();
    };

    const logout = async () => {
        try {
            // Llama al endpoint del backend para que borre la cookie HttpOnly.
            await logoutUser();
        } catch (error) {
            console.error("Error en el logout del backend:", error);
        } finally {
            // Independientemente del resultado del backend, se limpia el estado del frontend.
            setAuthState({ isAuthenticated: false, user: null, isLoading: false });
        }
    };

    // Muestra un estado de carga global mientras se verifica la sesión inicial.
    if (authState.isLoading) {
        return <div>Cargando...</div>;
    }

    return (
        <AuthContext.Provider value={{ authState, login, logout, verifyUser }}>
            {children}
        </AuthContext.Provider>
    );
};