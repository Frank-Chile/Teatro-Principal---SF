// frontend/src/services/clientService.js
import apiClient from './apiService';

export const getActiveFuncionesClient = async (limit = 10) => {
    try {
        const response = await apiClient.get(`/client/funciones?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener funciones activas (cliente):", error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

export const getFuncionDetailsClient = async (funcionId) => {
    try {
        const response = await apiClient.get(`/client/funciones/${funcionId}/detalles`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener detalles de función ${funcionId} (cliente):`, error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

export const getButacasForFuncionClient = async (funcionId) => {
    try {
        const response = await apiClient.get(`/client/funciones/${funcionId}/butacas_disponibles`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener butacas para función ${funcionId} (cliente):`, error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

export const getMyPurchasedButacas = async (funcionId) => {
    try {
        const response = await apiClient.get(`/client/funciones/${funcionId}/mis-butacas`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener mis butacas para función ${funcionId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

export const comprarButacasClient = async (funcionId, idsButacas) => {
    try {
        const response = await apiClient.post(`/client/funciones/${funcionId}/comprar`, { ids_butacas: idsButacas });
        return response.data;
    } catch (error) {
        console.error(`Error al comprar butacas para función ${funcionId} (cliente):`, error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

export const getMisFuncionesCompradas = async () => {
    try {
        const response = await apiClient.get('/client/mis-funciones-compradas');
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error("Error de red o servidor");
    }
};