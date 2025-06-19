// src/services/apiService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // <-- MUY IMPORTANTE: Permite a Axios enviar y recibir cookies
});

// El interceptor de solicitud ya no necesita añadir el token manualmente.
// El navegador se encará de ello.
apiClient.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores 401 (No Autorizado) globalmente
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error("Error 401: No autorizado o sesión expirada.");
            // En una app real, podrías forzar un logout o una redirección aquí.
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;