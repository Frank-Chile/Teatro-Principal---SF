// frontend/src/components/admin/FunctionManager/FunctionList.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getFuncionesAdmin, deleteFuncionAdmin } from '../../../services/adminService';
import { FaEdit, FaTrash, FaChair, FaPlusCircle } from 'react-icons/fa';
import './FunctionList.css'; 

function FunctionList() {
    const [funciones, setFunciones] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchFunciones = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await getFuncionesAdmin();
            setFunciones(data);
        } catch (err) {
            setError(err.message || 'Error al cargar funciones');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFunciones();
    }, [fetchFunciones]);

    const handleDelete = async (funcionId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta función? Esto eliminará también todas sus butacas asociadas.')) {
            try {
                await deleteFuncionAdmin(funcionId);
                fetchFunciones(); 
            } catch (err) {
                alert(err.response?.data?.detail || 'Error al eliminar la función.');
            }
        }
    };

    const filteredFunciones = useMemo(() => {
        if (!searchTerm.trim()) {
            return funciones;
        }
        return funciones.filter(f => 
            f.nombre_obra.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, funciones]);

    if (isLoading) return <p>Cargando funciones...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="view-container">
            <div className="view-header">
                <h2>Gestión de Funciones</h2>
                <div className="header-actions">
                    <input
                        type="text"
                        placeholder="Buscar por nombre de obra..."
                        className="search-bar"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Link to="nueva" className="action-button primary">
                        <FaPlusCircle />
                        <span>Nueva Función</span>
                    </Link>
                </div>
            </div>
            
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Obra</th>
                            <th>Fecha y Hora</th>
                            <th>Butacas (Habilitadas / Vendidas)</th>
                            <th>Estado</th>
                            <th className="actions-header">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFunciones.length > 0 ? filteredFunciones.map((funcion) => (
                            <tr key={funcion.id}>
                                <td data-label="Obra">{funcion.nombre_obra}</td>
                                <td data-label="Fecha y Hora">{new Date(funcion.fecha_hora).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</td>
                                <td data-label="Butacas">{funcion.cantidad_butacas} / {funcion.cantidad_butacas_vendidas}</td>
                                <td data-label="Estado">
                                    <span className={`status-badge ${funcion.activa ? 'active' : 'inactive'}`}>
                                        {funcion.activa ? 'Activa' : 'Inactiva'}
                                    </span>
                                </td>
                                <td className="action-cell">
                                    <Link to={`${funcion.id}/butacas`} className="action-icon-btn manage" title="Gestionar Butacas">
                                        <FaChair />
                                    </Link>
                                    <Link to={`${funcion.id}/editar`} className="action-icon-btn edit" title="Editar Función">
                                        <FaEdit />
                                    </Link>
                                    <button onClick={() => handleDelete(funcion.id)} className="action-icon-btn delete" title="Eliminar Función">
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="no-results-cell">No se encontraron funciones.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default FunctionList;