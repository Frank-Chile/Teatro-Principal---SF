// src/services/clientService.js
import apiClient from './apiService';

// Listar las últimas N funciones activas para el cliente
export const getActiveFuncionesClient = async (limit = 10) => {
    try {
        const response = await apiClient.get(`/client/funciones?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener funciones activas (cliente):", error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

// NUEVA FUNCIÓN para obtener detalles de una función para el cliente
export const getFuncionDetailsClient = async (funcionId) => {
    try {
        const response = await apiClient.get(`/client/funciones/${funcionId}/detalles`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener detalles de función ${funcionId} (cliente):`, error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};


// Obtener las butacas de una función específica para el cliente
export const getButacasForFuncionClient = async (funcionId) => {
    try {
        const response = await apiClient.get(`/client/funciones/${funcionId}/butacas_disponibles`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener butacas para función ${funcionId} (cliente):`, error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

// Comprar butacas para una función (simulación)
export const comprarButacasClient = async (funcionId, idsButacas) => {
    try {
        const response = await apiClient.post(`/client/funciones/${funcionId}/comprar`, { ids_butacas: idsButacas });
        return response.data;
    } catch (error) {
        console.error(`Error al comprar butacas para función ${funcionId} (cliente):`, error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};