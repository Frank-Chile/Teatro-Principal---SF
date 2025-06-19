// src/services/authService.js
import apiClient from './apiService';

export const loginUser = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
        const response = await apiClient.post('/auth/token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        return response.data; // Devuelve { "msg": "Login successful" }
    } catch (error) {
        console.error("Error en el servicio de login:", error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

// Se basa en la cookie que envía automáticamente el navegador
export const getCurrentUser = async () => {
    const response = await apiClient.get('/auth/users/me');
    return response.data;
};

// Nuevo servicio para el logout
export const logoutUser = async () => {
    try {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    } catch (error) {
        console.error("Error en el servicio de logout:", error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};