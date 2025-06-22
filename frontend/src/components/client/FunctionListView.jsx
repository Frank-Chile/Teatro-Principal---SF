// frontend/src/components/client/FunctionListView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getActiveFuncionesClient } from '../../services/clientService';
import { formatToLocalTime } from '../../utils/dateFormatter';
import { FaTicketAlt } from 'react-icons/fa';
import './FunctionListView.css';

function FunctionListView() {
    const [funciones, setFunciones] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchFunciones = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await getActiveFuncionesClient(10);
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

    if (isLoading) return (
        <div className="view-container">
            <div className="view-header">
                <h2>Funciones Disponibles</h2>
            </div>
            <p>Cargando...</p>
        </div>
    );
    
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="view-container client-view">
            <div className="view-header">
                <h2>Funciones Disponibles</h2>
                <p>Selecciona una obra para ver las butacas y comprar tus entradas.</p>
            </div>

            {funciones.length === 0 ? (
                <div className="no-content-message">
                    <FaTicketAlt />
                    <p>No hay funciones disponibles en este momento. Vuelve a intentarlo más tarde.</p>
                </div>
            ) : (
                <div className="function-card-grid">
                    {funciones.map((funcion) => {
                        const butacasLibres = funcion.cantidad_butacas - funcion.cantidad_butacas_vendidas;
                        return (
                            <div key={funcion.id} className="function-card">
                                <div className="card-content">
                                    <h3>{funcion.nombre_obra}</h3>
                                    <p className="card-date">{formatToLocalTime(funcion.fecha_hora)}</p>
                                    <div className="card-stats">
                                        <span>
                                            Butacas Libres: <strong>{butacasLibres}</strong> de {funcion.cantidad_butacas}
                                        </span>
                                    </div>
                                </div>
                                <div className="card-action">
                                    <Link to={`/client/funcion/${funcion.id}/seleccionar-butacas`} className="action-button primary">
                                        Comprar Entradas
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default FunctionListView;