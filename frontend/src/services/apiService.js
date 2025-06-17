// src/services/apiService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para añadir el token a las peticiones
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Opcional: Interceptor para manejar errores 401 (No Autorizado) globalmente
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Ejemplo: desloguear al usuario o redirigir a login
            // Esto dependerá de cómo quieras manejar la expiración del token
            console.error("Error 401: No autorizado o token expirado.");
            // localStorage.removeItem('token'); // Considerar limpiar el token
            // window.location.href = '/login'; // Redirección forzada
        }
        return Promise.reject(error);
    }
);

export default apiClient;