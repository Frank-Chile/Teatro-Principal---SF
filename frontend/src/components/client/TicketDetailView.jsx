// frontend/src/components/client/TicketDetailView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMyPurchasedButacas, getFuncionDetailsClient } from '../../services/clientService';
import { FaArrowLeft } from 'react-icons/fa';
import './TicketDetailView.css';

function TicketDetailView() {
    const { funcionId } = useParams();
    const navigate = useNavigate();
    
    const [funcion, setFuncion] = useState(null);
    const [purchasedButacas, setPurchasedButacas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        if (!funcionId) return;
        setIsLoading(true);
        setError('');
        try {
            const [funcionData, butacasData] = await Promise.all([
                getFuncionDetailsClient(funcionId),
                getMyPurchasedButacas(funcionId)
            ]);
            setFuncion(funcionData);
            setPurchasedButacas(butacasData);
        } catch (err) {
            setError(err.message || "Error al cargar el detalle de tus entradas.");
        } finally {
            setIsLoading(false);
        }
    }, [funcionId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) return <div className="loading-container"><p>Cargando tus entradas...</p></div>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="view-container">
            <div className="view-header">
                <h2>Mis Entradas para: {funcion?.nombre_obra}</h2>
                <p>Fecha: {new Date(funcion?.fecha_hora).toLocaleString()}</p>
            </div>

            <div className="tickets-list-detail">
                {purchasedButacas.map(butaca => (
                    <div key={butaca.id} className="ticket-card-detail">
                        <div className={`ticket-color-indicator ${butaca.tipo_butaca}`}></div>
                        <div className="ticket-info">
                            <strong>Butaca: Fila {butaca.fila} - Asiento {butaca.numero}</strong>
                            <span>{butaca.tipo_butaca === 'platea' ? `Sección Platea: ${butaca.seccion}` : `Balcón N°: ${butaca.numero_balcon}`}</span>
                            <span>Precio Pagado: ${butaca.precio_final_venta.toFixed(2)}</span>
                        </div>
                        <div className="ticket-prop-icons">
                            {butaca.es_protocolo && <span className="prop-icon" title="Protocolo">👔</span>}
                            {butaca.es_fumadores && <span className="prop-icon" title="Fumadores">🚬</span>}
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={() => navigate('/client/mis-entradas')} className="action-button secondary back-button">
                <FaArrowLeft />
                <span>Volver a Mis Funciones</span>
            </button>
        </div>
    );
}

export default TicketDetailView;