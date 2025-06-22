// frontend/src/services/adminService.js
import apiClient from './apiService';

// --- Gestión de Funciones ---
export const getFuncionesAdmin = async () => {
    try {
        const response = await apiClient.get('/admin/funciones');
        return response.data;
    } catch (error) { throw error.response?.data || new Error("Error de red o servidor"); }
};

export const getDashboardStats = async () => {
    try {
        const response = await apiClient.get('/admin/dashboard-stats');
        return response.data;
    } catch (error) { throw error.response?.data || new Error("Error de red o servidor"); }
};

export const getFuncionByIdAdmin = async (funcionId) => {
    try {
        const response = await apiClient.get(`/admin/funciones/${funcionId}`);
        return response.data;
    } catch (error) { throw error.response?.data || new Error("Error de red o servidor"); }
};

export const createFuncionAdmin = async (funcionData) => {
    try {
        const response = await apiClient.post('/admin/funciones', funcionData);
        return response.data;
    } catch (error) { throw error.response?.data || new Error("Error de red o servidor"); }
};

export const updateFuncionAdmin = async (funcionId, funcionData) => {
    try {
        const response = await apiClient.put(`/admin/funciones/${funcionId}`, funcionData);
        return response.data;
    } catch (error) { throw error.response?.data || new Error("Error de red o servidor"); }
};

export const deleteFuncionAdmin = async (funcionId) => {
    try {
        await apiClient.delete(`/admin/funciones/${funcionId}`);
    } catch (error) { throw error.response?.data || new Error("Error de red o servidor"); }
};


// --- Gestión de Butacas ---
export const getButacasByFuncionAdmin = async (funcionId) => {
    try {
        const response = await apiClient.get(`/admin/funciones/${funcionId}/butacas`);
        return response.data;
    } catch (error) { throw error.response?.data || new Error("Error de red o servidor"); }
};

export const updateButacasLayout = async (funcionId, layoutData) => {
    try {
        const response = await apiClient.put(`/admin/funciones/${funcionId}/layout_butacas`, layoutData);
        return response.data;
    } catch (error) { throw error.response?.data || new Error("Error de red o servidor"); }
};

// --- Reportes ---

export const getReporteResumenVentasTipo = async (funcionId = null) => {
    try {
        const response = await apiClient.get('/admin/reportes/resumen_ventas_tipo', { params: { funcion_id: funcionId } });
        return response.data;
    } catch (error) { throw error.response?.data || new Error("Error de red o servidor"); }
};

export const getReporteAnalisisOcupacion = async (funcionId = null) => {
    try {
        const response = await apiClient.get('/admin/reportes/analisis_ocupacion', { params: { funcion_id: funcionId } });
        return response.data;
    } catch (error) { throw error.response?.data || new Error("Error de red o servidor"); }
};

export const getReporteComparacionProtocoloFumadores = async (funcionId = null) => {
    try {
        const response = await apiClient.get('/admin/reportes/comparar_protocolo_fumadores', { params: { funcion_id: funcionId } });
        return response.data;
    } catch (error) { throw error.response?.data || new Error("Error de red o servidor"); }
};

export const getReporteTodasButacasVendidas = async (funcionId = null) => {
    try {
        const response = await apiClient.get('/admin/reportes/todas_butacas_vendidas', { params: { funcion_id: funcionId } });
        return response.data;
    } catch (error) { throw error.response?.data || new Error("Error de red o servidor"); }
};

export const getReporteDineroSupera = async (valor, funcionId = null) => {
    try {
        const response = await apiClient.get('/admin/reportes/dinero_recaudado_supera', { params: { valor, funcion_id: funcionId } });
        return response.data;
    } catch (error) { throw error.response?.data || new Error("Error de red o servidor"); }
};