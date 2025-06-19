// src/contexts/AuthContext.jsx
<<<<<<< HEAD
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, logoutUser } from '../services/authService';
=======
import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
>>>>>>> 0fe73801a15485600472cdd6529e410b0789e804

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
<<<<<<< HEAD
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
=======
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
>>>>>>> 0fe73801a15485600472cdd6529e410b0789e804
            {children}
        </AuthContext.Provider>
    );
};