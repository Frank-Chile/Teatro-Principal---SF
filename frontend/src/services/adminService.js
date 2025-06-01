// src/services/adminService.js
import apiClient from './apiService';

// --- Gestión de Funciones ---
export const getFuncionesAdmin = async (soloActivas = false) => {
    try {
        const response = await apiClient.get(`/admin/funciones?solo_activas=${soloActivas}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener funciones (admin):", error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

export const getFuncionByIdAdmin = async (funcionId) => {
    try {
        const response = await apiClient.get(`/admin/funciones/${funcionId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener función ${funcionId} (admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

export const createFuncionAdmin = async (funcionData) => {
    // funcionData: { nombre_obra: string, fecha_hora: string (ISO) }
    try {
        const response = await apiClient.post('/admin/funciones', funcionData);
        return response.data;
    } catch (error) {
        console.error("Error al crear función (admin):", error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

export const updateFuncionAdmin = async (funcionId, funcionData) => {
    // funcionData: { nombre_obra?: string, fecha_hora?: string (ISO), activa?: boolean }
    try {
        const response = await apiClient.put(`/admin/funciones/${funcionId}`, funcionData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar función ${funcionId} (admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

export const deleteFuncionAdmin = async (funcionId) => {
    try {
        await apiClient.delete(`/admin/funciones/${funcionId}`);
        // No hay contenido en la respuesta para DELETE (204)
    } catch (error) {
        console.error(`Error al eliminar función ${funcionId} (admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

// --- Gestión de Butacas en una Función ---
export const getButacasByFuncionAdmin = async (funcionId) => {
    try {
        const response = await apiClient.get(`/admin/funciones/${funcionId}/butacas`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener butacas para función ${funcionId} (admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

export const addButacaToFuncionAdmin = async (funcionId, butacaData) => {
    /* butacaData:
        { tipo_butaca: "platea", fila: number, numero: number, seccion: string, es_protocolo: boolean }
        OR
        { tipo_butaca: "balcon", fila: number, numero: number, numero_balcon: number, es_fumadores: boolean }
    */
    try {
        const response = await apiClient.post(`/admin/funciones/${funcionId}/butacas`, butacaData);
        return response.data;
    } catch (error) {
        console.error(`Error al añadir butaca a función ${funcionId} (admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

export const updateButacaInFuncionAdmin = async (funcionId, butacaId, butacaUpdateData) => {
    try {
        const response = await apiClient.put(`/admin/funciones/${funcionId}/butacas/${butacaId}`, butacaUpdateData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar butaca ${butacaId} en función ${funcionId} (admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

export const deleteButacaFromFuncionAdmin = async (funcionId, butacaId) => {
    try {
        await apiClient.delete(`/admin/funciones/${funcionId}/butacas/${butacaId}`);
    } catch (error) {
        console.error(`Error al eliminar butaca ${butacaId} de función ${funcionId} (admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};


// --- Reportes (Ejemplos) ---
export const getReporteDineroSupera = async (valor, funcionId = null) => {
    const params = { valor };
    if (funcionId) params.funcion_id = funcionId;
    try {
        const response = await apiClient.get('/admin/reportes/dinero_recaudado_supera', { params });
        return response.data;
    } catch (error) {
        console.error("Error al generar reporte 'dinero supera':", error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};

export const getReporteProtocoloFumadores = async (funcionId = null) => {
    const params = {};
    if (funcionId) params.funcion_id = funcionId;
    try {
        const response = await apiClient.get('/admin/reportes/comparar_protocolo_fumadores', { params });
        return response.data;
    } catch (error) {
        console.error("Error al generar reporte 'protocolo vs fumadores':", error.response?.data || error.message);
        throw error.response?.data || new Error("Error de red o servidor");
    }
};
// ... (Añadir más funciones para los otros endpoints de reportes según sea necesario)
// getReporteTotalDineroProtocolo, getReporteBalconVendidas, getReportePorcentajePlateaVendidas, getReporteResumenVentasTipo