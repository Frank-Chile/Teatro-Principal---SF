// frontend/src/components/common/SeatLegend.jsx
import React from 'react';
import './SeatLegend.css';

function SeatLegend() {
    return (
        <div className="legend-container">
            <div className="legend-item">
                <div className="legend-swatch platea-available"></div>
                <span>Platea Disponible</span>
            </div>
            <div className="legend-item">
                <div className="legend-swatch balcon-available"></div>
                <span>Balcón Disponible</span>
            </div>
            <div className="legend-item">
                <div className="legend-swatch seat-selected"></div>
                <span>Seleccionada</span>
            </div>
            <div className="legend-item">
                <div className="legend-swatch seat-sold"></div>
                <span>Vendida</span>
            </div>
            <div className="legend-item">
                <div className="legend-swatch seat-disabled"></div>
                <span>Deshabilitada</span>
            </div>
            <div className="legend-item">
                <div className="legend-swatch platea-available seat-protocolo"></div>
                <span>Protocolo</span>
            </div>
            <div className="legend-item">
                <div className="legend-swatch balcon-available seat-fumadores"></div>
                <span>Fumadores</span>
            </div>
        </div>
    );
}

export default SeatLegend;