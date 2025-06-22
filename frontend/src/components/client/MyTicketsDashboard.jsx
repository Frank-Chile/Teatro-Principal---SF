// frontend/src/components/client/MyTicketsDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMisFuncionesCompradas } from '../../services/clientService';
import { formatToLocalTime } from '../../utils/dateFormatter';
import { isPast } from 'date-fns'; // Importamos la función 'isPast' para una comparación fiable
import { FaTicketAlt } from 'react-icons/fa';
import './MyTicketsDashboard.css';

function MyTicketsDashboard() {
    const [funciones, setFunciones] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchFunciones = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await getMisFuncionesCompradas();
            setFunciones(data);
        } catch (err) {
            setError(err.message || 'Error al cargar tus funciones.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFunciones();
    }, [fetchFunciones]);

    if (isLoading) {
        return (
            <div className="view-container">
                <div className="view-header">
                    <h2>Mis Entradas</h2>
                </div>
                <p>Cargando tus funciones...</p>
            </div>
        );
    }
    
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="view-container client-view">
            <div className="view-header">
                <h2>Mis Entradas</h2>
                <p>Aquí se listan todas las funciones para las que has comprado entradas.</p>
            </div>

            {funciones.length === 0 ? (
                <div className="no-tickets-message">
                    <FaTicketAlt />
                    <p>Aún no has comprado entradas.</p>
                    <Link to="/client" className="action-button primary">Ver Funciones Disponibles</Link>
                </div>
            ) : (
                <div className="function-card-grid">
                    {funciones.map(funcion => {
                        // CORRECCIÓN: Se usa la función 'isPast' para determinar el estado real
                        const esFuncionPasada = isPast(new Date(funcion.fecha_hora));

                        return (
                            <div key={funcion.id} className="function-ticket-card">
                                <div className="card-header">
                                   <h3>{funcion.nombre_obra}</h3>
                                   {/* Se muestra la etiqueta correcta basada en si la fecha ya pasó */}
                                   <span className={`status-tag ${esFuncionPasada ? 'finished' : 'upcoming'}`}>
                                       {esFuncionPasada ? 'Finalizada' : 'Próximamente'}
                                   </span>
                                </div>
                                <div className="card-body">
                                    <p><strong>Fecha:</strong> {formatToLocalTime(funcion.fecha_hora)}</p>
                                    <p><strong>Butacas Compradas:</strong> {funcion.cantidad_butacas_vendidas}</p>
                                </div>
                                <div className="card-footer">
                                    <Link to={`/client/mis-entradas/${funcion.id}`} className="action-button secondary">
                                        Ver Detalle de Entradas
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

export default MyTicketsDashboard;