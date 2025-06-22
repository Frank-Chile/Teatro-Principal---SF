// frontend/src/components/client/SeatSelector/SeatMapView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getButacasForFuncionClient, getFuncionDetailsClient, comprarButacasClient } from '../../../services/clientService';
import CheckoutModal from './CheckoutModal';
import SeatLegend from '../../common/SeatLegend';
import SeatMapSkeleton from './SeatMapSkeleton';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './SeatMapView.css';

const SEATS_PER_ROW = 15;
const PLATEA_ROWS = 10;
const TOTAL_ROWS = 15;

const generateInitialGrid = () => {
    const grid = [];
    for (let i = 1; i <= TOTAL_ROWS; i++) {
        for (let j = 1; j <= SEATS_PER_ROW; j++) {
            grid.push({
                fila: i,
                numero: j,
                habilitada: false,
                tipo_butaca: i <= PLATEA_ROWS ? 'platea' : 'balcon',
            });
        }
    }
    return grid;
};

function SeatMapView() {
    const { funcionId } = useParams();
    const navigate = useNavigate();

    const [funcion, setFuncion] = useState(null);
    const [butacasGrid, setButacasGrid] = useState(generateInitialGrid());
    const [selectedButacas, setSelectedButacas] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    // Se elimina el estado y la llamada a getMyPurchasedButacas
    const fetchAllData = useCallback(async () => {
        try {
            const [funcionData, habilitadasData] = await Promise.all([
                getFuncionDetailsClient(funcionId),
                getButacasForFuncionClient(funcionId),
            ]);
            
            setFuncion(funcionData);

            const initialGrid = generateInitialGrid();
            const updatedGrid = initialGrid.map(butacaEnGrilla => {
                const butacaHabilitada = habilitadasData.find(
                    b => b.fila === butacaEnGrilla.fila && b.numero === butacaEnGrilla.numero
                );
                if (butacaHabilitada) {
                    return { ...butacaEnGrilla, ...butacaHabilitada, habilitada: true };
                }
                return butacaEnGrilla;
            });
            setButacasGrid(updatedGrid);

        } catch (err) {
            toast.error(err.message || 'Error al cargar datos de la función.');
        } finally {
            setIsLoading(false);
        }
    }, [funcionId]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const toggleButacaSelection = (fila, numero) => {
        const butaca = butacasGrid.find(b => b.fila === fila && b.numero === numero);
        if (!butaca || !butaca.id || butaca.vendida) return;

        setSelectedButacas(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(butaca.id)) {
                newSelected.delete(butaca.id);
            } else {
                newSelected.add(butaca.id);
            }
            return newSelected;
        });
    };

    const calculateTotalPrice = () => {
        let total = 0;
        selectedButacas.forEach(butacaId => {
            const butaca = butacasGrid.find(b => b.id === butacaId);
            if (butaca) {
                total += butaca.precio_base_calculado;
            }
        });
        return total.toFixed(2);
    };

    const handleProceedToCheckout = () => {
        if (selectedButacas.size === 0) {
            toast.warn("Por favor, selecciona al menos una butaca.");
            return;
        }
        setShowCheckoutModal(true);
    };

    const confirmPurchase = () => {
        setIsPurchasing(true);
        comprarButacasClient(funcionId, Array.from(selectedButacas))
            .then(compraData => {
                setShowCheckoutModal(false);
                toast.success('¡Compra Exitosa! Puedes revisar tus entradas en la sección "Mis Entradas".');
                fetchAllData();
                setSelectedButacas(new Set());
            })
            .catch(err => {
                toast.error(err.response?.data?.detail || "Error en la compra.");
                setShowCheckoutModal(false);
            })
            .finally(() => {
                setIsPurchasing(false);
            });
    };

    if (isLoading) return <SeatMapSkeleton />;
    
    return (
        <div className="seat-selection-container">
            <ToastContainer theme="dark" position="bottom-right" />
            {showCheckoutModal && (
                <CheckoutModal
                    totalPrice={calculateTotalPrice()}
                    isPurchasing={isPurchasing}
                    onConfirm={confirmPurchase}
                    onCancel={() => setShowCheckoutModal(false)}
                />
            )}

            <h2>{funcion?.nombre_obra}</h2>
            <p><strong>Fecha:</strong> {new Date(funcion?.fecha_hora).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>
            
            <div className="client-main-layout">
                <div className="row-labels-left">
                    <div className="label-box platea-label">Platea</div>
                    <div className="label-box balcon-label">Balcón</div>
                </div>

                <div className="seat-area">
                    <div className="screen-indicator">ESCENARIO</div>
                    <div className="seat-map">
                        {butacasGrid.map((butaca, index) => {
                            const isSelected = selectedButacas.has(butaca.id);
                            return (
                                <button
                                    key={index}
                                    className={`
                                        seat-client
                                        ${butaca.habilitada ? butaca.tipo_butaca : 'disabled'}
                                        ${butaca.vendida ? 'sold' : ''}
                                        ${isSelected ? 'selected' : ''}
                                        ${butaca.es_protocolo ? 'protocolo' : ''}
                                        ${butaca.es_fumadores ? 'fumadores' : ''}
                                    `}
                                    onClick={() => toggleButacaSelection(butaca.fila, butaca.numero)}
                                    disabled={!butaca.habilitada || butaca.vendida}
                                    title={butaca.vendida ? 'Butaca no disponible' : `Fila ${butaca.fila}, Asiento ${butaca.numero}`}
                                >
                                    {butaca.habilitada ? butaca.numero : ''}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <SeatLegend />

            {selectedButacas.size > 0 && (
                <div className="floating-checkout-bar">
                    <div className="selection-info">
                        <span>{selectedButacas.size} butaca(s) seleccionada(s)</span>
                        <strong>Total: ${calculateTotalPrice()}</strong>
                    </div>
                    <button onClick={handleProceedToCheckout} disabled={isPurchasing}>
                        Continuar
                    </button>
                </div>
            )}
            
        </div>
    );
}

export default SeatMapView;