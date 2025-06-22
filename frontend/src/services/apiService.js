// frontend/src/services/apiService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error("Error 401: No autorizado o sesión expirada.");
            // En una aplicación real, aquí se podría forzar un logout o una redirección.
            // Ejemplo: window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default apiClient;