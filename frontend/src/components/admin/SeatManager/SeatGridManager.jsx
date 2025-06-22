// frontend/src/components/admin/SeatManager/SeatGridManager.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFuncionByIdAdmin, getButacasByFuncionAdmin, updateButacasLayout } from '../../../services/adminService';
import SeatLegend from '../../common/SeatLegend';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSave } from 'react-icons/fa';
import './SeatGridManager.css';

const SEATS_PER_ROW = 15;
const PLATEA_ROWS = 10;
const BALCON_ROWS = 5;
const TOTAL_ROWS = PLATEA_ROWS + BALCON_ROWS;

const generateInitialGrid = () => {
    const grid = [];
    for (let i = 1; i <= TOTAL_ROWS; i++) {
        for (let j = 1; j <= SEATS_PER_ROW; j++) {
            const isPlatea = i <= PLATEA_ROWS;
            grid.push({
                fila: i,
                numero: j,
                tipo_butaca: isPlatea ? 'platea' : 'balcon',
                habilitada: false,
                seccion: isPlatea ? 'General' : null,
                es_protocolo: false,
                numero_balcon: isPlatea ? null : (i - PLATEA_ROWS),
                es_fumadores: false,
            });
        }
    }
    return grid;
};

function SeatGridManager() {
    const { funcionId } = useParams();
    const navigate = useNavigate();

    const [funcion, setFuncion] = useState(null);
    const [butacasGrid, setButacasGrid] = useState([]);
    const [originalButacasGrid, setOriginalButacasGrid] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [funcionData, butacasExistentes] = await Promise.all([
                getFuncionByIdAdmin(funcionId),
                getButacasByFuncionAdmin(funcionId)
            ]);
            setFuncion(funcionData);

            const initialGrid = generateInitialGrid();
            const updatedGrid = initialGrid.map(butacaEnGrilla => {
                const butacaExistente = butacasExistentes.find(
                    b => b.fila === butacaEnGrilla.fila && b.numero === butacaEnGrilla.numero
                );
                if (butacaExistente) {
                    return { ...butacaEnGrilla, ...butacaExistente, habilitada: true };
                }
                return butacaEnGrilla;
            });
            setButacasGrid(updatedGrid);
            setOriginalButacasGrid(updatedGrid);
        } catch (err) {
            setError('Error al cargar los datos de la función.');
            toast.error('Error al cargar los datos de la función.');
        } finally {
            setIsLoading(false);
        }
    }, [funcionId]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleSeatClick = (fila, numero) => {
        setButacasGrid(prevGrid => {
            const isRowProtocolo = prevGrid.some(b => b.fila === fila && b.es_protocolo);
            const isRowFumadores = prevGrid.some(b => b.fila === fila && b.es_fumadores);

            return prevGrid.map(butaca => {
                if (butaca.fila === fila && butaca.numero === numero) {
                    const isCurrentlyEnabled = butaca.habilitada;
                    // Al habilitar, hereda las propiedades de la fila
                    if (!isCurrentlyEnabled) {
                        return {
                            ...butaca,
                            habilitada: true,
                            es_protocolo: isRowProtocolo,
                            es_fumadores: isRowFumadores,
                        };
                    } else { // Al deshabilitar, resetea las propiedades
                        return {
                            ...butaca,
                            habilitada: false,
                            es_protocolo: false,
                            es_fumadores: false,
                        };
                    }
                }
                return butaca;
            });
        });
    };
    
    const handleSingleRowPropertyChange = (fila, property, value) => {
        setButacasGrid(prevGrid =>
            prevGrid.map(butaca => {
                if (butaca.fila === fila) {
                    // Solo aplica la propiedad si la butaca está habilitada
                    if (butaca.habilitada) {
                        return { ...butaca, [property]: value };
                    }
                    // Si se desactiva el switch, se quita la propiedad a todas las de la fila
                    if (!value) {
                         return { ...butaca, [property]: false };
                    }
                }
                return butaca;
            })
        );
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setError('');
        try {
            const butacasASalvar = butacasGrid
                .filter(b => b.habilitada || b.vendida)
                .map(({ habilitada, ...rest }) => rest);
            
            const payload = { butacas: butacasASalvar };
            await updateButacasLayout(funcionId, payload);
            toast.success('¡Disposición guardada con éxito!');
            fetchInitialData();
        } catch (err) {
            toast.error(err.detail || 'Error al guardar la disposición.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCancelChanges = () => {
        setButacasGrid(originalButacasGrid);
        toast.info('Cambios descartados.');
    };

    const hasUnsavedChanges = useMemo(() => {
        return JSON.stringify(butacasGrid) !== JSON.stringify(originalButacasGrid);
    }, [butacasGrid, originalButacasGrid]);

    if (isLoading) return <div className="loading-container"><p>Cargando gestor de butacas...</p></div>;
    if (error) return <p className="error-message">{error}</p>;
    
    return (
        <div className="grid-manager-container professional-ux">
            <ToastContainer theme="dark" position="bottom-right" autoClose={3000} />
            <div className="manager-header">
                <h3>Gestor de Disposición de Butacas</h3>
                <h2>{funcion?.nombre_obra}</h2>
                <p>Fecha: {new Date(funcion?.fecha_hora).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>
            </div>
            
            <div className="main-layout">
                <div className="row-labels-left">
                    <div className="label-box platea-label">Platea</div>
                    <div className="label-box balcon-label">Balcón</div>
                </div>

                <div className="seat-area">
                    <div className="screen-indicator">ESCENARIO</div>
                    <div className="seat-grid">
                        {butacasGrid.map((butaca, index) => (
                            <button
                                key={index}
                                onClick={() => butaca.vendida ? null : handleSeatClick(butaca.fila, butaca.numero)}
                                className={`seat-admin 
                                    ${butaca.tipo_butaca} 
                                    ${butaca.habilitada ? 'enabled' : 'disabled'}
                                    ${butaca.es_protocolo ? 'protocolo' : ''}
                                    ${butaca.es_fumadores ? 'fumadores' : ''}
                                    ${butaca.vendida ? 'sold' : ''}
                                `}
                                disabled={butaca.vendida}
                                title={butaca.vendida ? `Vendido al usuario ID: ${butaca.comprador_id}` : `Fila ${butaca.fila}, Asiento ${butaca.numero}`}
                            >
                                {butaca.numero}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="controls-panel">
                    <div className="control-list-header">
                        <span>Fila</span>
                        <span>Opción</span>
                    </div>
                    <div className="control-list">
                        {Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1).map(filaNum => {
                            const isPlatea = filaNum <= PLATEA_ROWS;
                            const isChecked = isPlatea
                                ? butacasGrid.some(b => b.fila === filaNum && b.es_protocolo)
                                : butacasGrid.some(b => b.fila === filaNum && b.es_fumadores);
                            
                            const propertyName = isPlatea ? 'es_protocolo' : 'es_fumadores';
                            const labelText = isPlatea ? 'Protocolo' : 'Fumador';

                            return (
                                <div key={`control-${filaNum}`} className="control-row-item">
                                    <span>Fila {filaNum}</span>
                                    <label className="switch" title={labelText}>
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => handleSingleRowPropertyChange(filaNum, propertyName, e.target.checked)}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <SeatLegend isAdminView={true} />

            {hasUnsavedChanges && (
                <div className="floating-actions-bar">
                    <div className="actions-message">
                        Tienes cambios sin guardar.
                    </div>
                    <div className="actions-buttons-group">
                        <button onClick={handleCancelChanges} className="action-button secondary" disabled={isSaving}>
                            Cancelar
                        </button>
                        <button onClick={handleSaveChanges} className="action-button primary save-btn" disabled={isSaving}>
                            <FaSave />
                            <span>{isSaving ? 'Guardando...' : 'Guardar Disposición'}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SeatGridManager;