// frontend/src/components/admin/SeatManager/SeatGridManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFuncionByIdAdmin, getButacasByFuncionAdmin, updateButacasLayout } from '../../../services/adminService';
import SeatLegend from '../../common/SeatLegend';
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
    const [butacasGrid, setButacasGrid] = useState(generateInitialGrid());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
                    // Se combinan los datos y se marca como habilitada si existe en la DB
                    return { ...butacaEnGrilla, ...butacaExistente, habilitada: true };
                }
                return butacaEnGrilla;
            });
            setButacasGrid(updatedGrid);

        } catch (err) {
            setError('Error al cargar los datos de la función.');
        } finally {
            setIsLoading(false);
        }
    }, [funcionId]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleSeatClick = (fila, numero) => {
        setButacasGrid(prevGrid =>
            prevGrid.map(butaca => {
                if (butaca.fila === fila && butaca.numero === numero) {
                    return { ...butaca, habilitada: !butaca.habilitada };
                }
                return butaca;
            })
        );
    };
    
    const handleSingleRowPropertyChange = (fila, property, value) => {
        setButacasGrid(prevGrid =>
            prevGrid.map(butaca => {
                if (butaca.fila === fila) {
                    return { ...butaca, [property]: value };
                }
                return butaca;
            })
        );
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setError('');
        setSuccess('');
        try {
            // CORRECCIÓN: Se envían todas las butacas que están habilitadas O que ya estaban vendidas.
            // Esto asegura que el backend sepa cuáles son las vendidas para no borrarlas.
            const butacasASalvar = butacasGrid
                .filter(b => b.habilitada || b.vendida)
                .map(({ habilitada, ...rest }) => rest); // Se quita el flag 'habilitada' que es solo para el frontend

            const payload = { butacas: butacasASalvar };
            
            await updateButacasLayout(funcionId, payload);
            setSuccess('¡Disposición de butacas guardada con éxito!');
            
            // Se refrescan los datos para asegurar que la vista esté sincronizada con la base de datos
            fetchInitialData();

        } catch (err) {
            setError(err.detail || 'Error al guardar la disposición.');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) return <p>Cargando gestor de butacas...</p>;
    if (error) return <p className="error-message">{error}</p>;
    
    return (
        <div className="grid-manager-container">
            <div className="manager-header">
                <h3>Gestor de Disposición de Butacas</h3>
                <h2>{funcion?.nombre_obra}</h2>
                <p>Fecha: {new Date(funcion?.fecha_hora).toLocaleString()} | <strong>Estado:</strong> {funcion?.activa ? 'Activa' : 'Inactiva'}</p>
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
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => handleSingleRowPropertyChange(filaNum, propertyName, e.target.checked)}
                                        />
                                        <span className="slider round" title={labelText}></span>
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <SeatLegend isAdminView={true} />

            <div className="actions-bar">
                {success && <p className="success-message">{success}</p>}
                {error && <p className="error-message">{error}</p>}
                <button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar Disposición'}
                </button>
                <button onClick={() => navigate('/admin/gestionar-funciones')} style={{backgroundColor: '#6c757d'}}>
                    Volver a Funciones
                </button>
            </div>
        </div>
    );
}

export default SeatGridManager;