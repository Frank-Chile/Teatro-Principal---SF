// frontend/src/services/authService.js
import apiClient from './apiService';

export const registerUser = async (userData) => {
    try {
        const response = await apiClient.post('/auth/register', userData);
        return response.data;
    } catch (error) {
        console.error("Error en el servicio de registro:", error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor al registrar.");
    }
};

export const loginUser = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
        const response = await apiClient.post('/auth/token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        return response.data;
    } catch (error) {
        console.error("Error en el servicio de login:", error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor al iniciar sesión.");
    }
};

export const getCurrentUser = async () => {
    try {
        const response = await apiClient.get('/auth/users/me');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    } catch (error) {
        console.error("Error en el servicio de logout:", error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor al cerrar sesión.");
    }
};