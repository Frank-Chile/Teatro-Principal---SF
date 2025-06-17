// src/components/client/SeatSelector/SeatMapView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getButacasForFuncionClient, getFuncionDetailsClient, comprarButacasClient } from '../../../services/clientService';
import CheckoutModal from './CheckoutModal'; // Importar el nuevo modal
import './SeatMapView.css'; // Asegúrate de que el archivo CSS esté importado

function SeatMapView() {
    const { funcionId } = useParams();
    const navigate = useNavigate();

    const [funcion, setFuncion] = useState(null);
    const [butacas, setButacas] = useState([]);
    const [selectedButacas, setSelectedButacas] = useState(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [purchaseError, setPurchaseError] = useState('');
    const [purchaseSuccess, setPurchaseSuccess] = useState('');
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    const fetchFuncionYButacas = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [funcionData, butacasData] = await Promise.all([
                getFuncionDetailsClient(funcionId),
                getButacasForFuncionClient(funcionId)
            ]);
            setFuncion(funcionData);
            setButacas(butacasData);
        } catch (err) {
            setError(err.message || 'Error al cargar datos de la función y butacas.');
            if (err.response?.data?.detail && 
                (err.response.data.detail.includes("Función no encontrada") || 
                 err.response.data.detail.includes("no está activa"))){
                 navigate('/client');
            } else if (err.response?.status === 404) {
                navigate('/client');
            }
        } finally {
            setIsLoading(false);
        }
    }, [funcionId, navigate]);

    useEffect(() => {
        fetchFuncionYButacas();
    }, [fetchFuncionYButacas]);

    const toggleButacaSelection = (butacaId) => {
        const butaca = butacas.find(b => b.id === butacaId);
        if (butaca && butaca.vendida) return;

        setSelectedButacas(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(butacaId)) {
                newSelected.delete(butacaId);
            } else {
                newSelected.add(butacaId);
            }
            return newSelected;
        });
    };

    const calculateTotalPrice = () => {
        let total = 0;
        selectedButacas.forEach(butacaId => {
            const butaca = butacas.find(b => b.id === butacaId);
            if (butaca && typeof butaca.precio_base_calculado === 'number') {
                total += butaca.precio_base_calculado;
            }
        });
        return total.toFixed(2);
    };

    const handleProceedToCheckout = () => {
        if (selectedButacas.size === 0) {
            setPurchaseError("Por favor, selecciona al menos una butaca.");
            return;
        }
        setPurchaseError('');
        setPurchaseSuccess('');
        setShowCheckoutModal(true);
    };
    
    const confirmPurchase = () => {
        setIsPurchasing(true);
        comprarButacasClient(funcionId, Array.from(selectedButacas))
            .then(compraData => {
                setPurchaseSuccess(`¡Compra Exitosa! Total: $${compraData.total_pagado.toFixed(2)}`);
                setShowCheckoutModal(false);
                fetchFuncionYButacas();
                setSelectedButacas(new Set());
            })
            .catch(err => {
                setPurchaseError(err.response?.data?.detail || err.message || "Error en la compra.");
                setShowCheckoutModal(false);
            })
            .finally(() => {
                setIsPurchasing(false);
            });
    };

    const butacasPorFila = butacas.reduce((acc, butaca) => {
        acc[butaca.fila] = acc[butaca.fila] || [];
        acc[butaca.fila].push(butaca);
        acc[butaca.fila].sort((a, b) => a.numero - b.numero);
        return acc;
    }, {});

    if (isLoading) return <p>Cargando mapa de butacas...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!funcion) return <p>Cargando datos de la función...</p>;

    return (
        <div className="seat-selection-container">
            {showCheckoutModal && (
                <CheckoutModal
                    totalPrice={calculateTotalPrice()}
                    isPurchasing={isPurchasing}
                    onConfirm={confirmPurchase}
                    onCancel={() => setShowCheckoutModal(false)}
                />
            )}

            <h2>{funcion.nombre_obra}</h2>
            <p><strong>Fecha:</strong> {new Date(funcion.fecha_hora).toLocaleString()}</p>
            {purchaseSuccess && <p style={{color: 'green', fontWeight: 'bold', textAlign: 'center'}}>{purchaseSuccess}</p>}
            {purchaseError && <p className="error-message" style={{textAlign: 'center'}}>{purchaseError}</p>}
            <p>Selecciona tus butacas:</p>

            <div className="seat-map">
                <div className="screen-indicator">PANTALLA / ESCENARIO</div>
                {Object.entries(butacasPorFila).sort(([filaA], [filaB]) => parseInt(filaA) - parseInt(filaB)).map(([fila, asientos]) => (
                    <div key={fila} className="seat-row">
                        <span className="row-label">Fila {fila}</span>
                        {asientos.map(butaca => (
                            <button
                                key={butaca.id}
                                className={`
                                    seat
                                    ${butaca.tipo_butaca}
                                    ${butaca.vendida ? 'sold' : 'available'}
                                    ${selectedButacas.has(butaca.id) ? 'selected' : ''}
                                `}
                                onClick={() => toggleButacaSelection(butaca.id)}
                                disabled={butaca.vendida}
                                title={`Fila ${butaca.fila}, Asiento ${butaca.numero}\nTipo: ${butaca.tipo_butaca}\nPrecio: $${(butaca.precio_base_calculado || 0).toFixed(2)}${butaca.vendida ? '\n(Vendida)' : ''}`}
                            >
                                {butaca.numero}
                            </button>
                        ))}
                    </div>
                ))}
            </div>

            <div className="legend">
                <div className="legend-item"><span className="seat platea available"></span> Platea Disponible</div>
                <div className="legend-item"><span className="seat balcon available"></span> Balcón Disponible</div>
                <div className="legend-item"><span className="seat selected"></span> Seleccionada</div>
                <div className="legend-item"><span className="seat sold"></span> Vendida</div>
            </div>

            {selectedButacas.size > 0 && (
                <div className="checkout-summary">
                    <h4>Resumen de tu Selección:</h4>
                    <ul>
                        {Array.from(selectedButacas).map(id => {
                            const b = butacas.find(but => but.id === id);
                            return b ? <li key={id}>Fila {b.fila} Asiento {b.numero} (${(b.precio_base_calculado || 0).toFixed(2)})</li> : null;
                        })}
                    </ul>
                    <p><strong>Total a Pagar: ${calculateTotalPrice()}</strong></p>
                    <button onClick={handleProceedToCheckout} disabled={isPurchasing}>
                        {isPurchasing ? 'Procesando...' : 'Continuar con la Compra'}
                    </button>
                </div>
            )}
             <button onClick={() => navigate('/client')} style={{marginTop: '20px', backgroundColor: '#6c757d'}}>
                Volver a Funciones
            </button>
        </div>
    );
}

export default SeatMapView;