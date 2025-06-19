// src/services/authService.js
<<<<<<< HEAD
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
=======
import axios from 'axios';
import { API_BASE_URL } from '../config';

const loginUser = async (username, password) => {
    try {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await axios.post(`${API_BASE_URL}/auth/token`, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data; // Debería contener { access_token, token_type }
>>>>>>> 0fe73801a15485600472cdd6529e410b0789e804
    } catch (error) {
        console.error("Error en el servicio de login:", error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

<<<<<<< HEAD
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
=======
const getCurrentUser = async (token) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/auth/users/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error obteniendo usuario actual:", error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};


export { loginUser, getCurrentUser };
>>>>>>> 0fe73801a15485600472cdd6529e410b0789e804
