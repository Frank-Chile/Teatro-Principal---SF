// frontend/src/components/client/SeatSelector/SeatMapSkeleton.jsx
import React from 'react';
import './SeatMapSkeleton.css';

const SEATS_PER_ROW = 15;
const TOTAL_ROWS = 15;

function SeatMapSkeleton() {
    return (
        <div className="seat-selection-container skeleton-container">
            <div className="skeleton-header skeleton-item"></div>
            <div className="client-main-layout">
                <div className="row-labels-left">
                    <div className="label-box skeleton-item platea-label-sk"></div>
                    <div className="label-box skeleton-item balcon-label-sk"></div>
                </div>
                <div className="seat-area">
                    <div className="screen-indicator skeleton-item"></div>
                    <div className="seat-map">
                        {Array.from({ length: TOTAL_ROWS * SEATS_PER_ROW }).map((_, index) => (
                            <div key={index} className="seat-client-skeleton skeleton-item"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SeatMapSkeleton;