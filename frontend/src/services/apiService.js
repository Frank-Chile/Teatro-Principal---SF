// src/services/apiService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
<<<<<<< HEAD
    withCredentials: true // <-- MUY IMPORTANTE: Permite a Axios enviar y recibir cookies
});

// El interceptor de solicitud ya no necesita añadir el token manualmente.
// El navegador se encará de ello.
apiClient.interceptors.request.use(
    (config) => {
=======
});

// Interceptor para añadir el token a las peticiones
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
>>>>>>> 0fe73801a15485600472cdd6529e410b0789e804
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

<<<<<<< HEAD
// Interceptor para manejar errores 401 (No Autorizado) globalmente
=======
// Opcional: Interceptor para manejar errores 401 (No Autorizado) globalmente
>>>>>>> 0fe73801a15485600472cdd6529e410b0789e804
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
<<<<<<< HEAD
            console.error("Error 401: No autorizado o sesión expirada.");
            // En una app real, podrías forzar un logout o una redirección aquí.
            // window.location.href = '/login';
=======
            // Ejemplo: desloguear al usuario o redirigir a login
            // Esto dependerá de cómo quieras manejar la expiración del token
            console.error("Error 401: No autorizado o token expirado.");
            // localStorage.removeItem('token'); // Considerar limpiar el token
            // window.location.href = '/login'; // Redirección forzada
>>>>>>> 0fe73801a15485600472cdd6529e410b0789e804
        }
        return Promise.reject(error);
    }
);

export default apiClient;