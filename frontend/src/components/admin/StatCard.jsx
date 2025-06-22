// frontend/src/components/admin/StatCard.jsx
import React from 'react';
import './StatCard.css';

function StatCard({ title, value, icon, color }) {
    return (
        <div className="stat-card" style={{ borderLeftColor: color }}>
            <div className="stat-card-info">
                <p className="stat-card-title">{title}</p>
                <h3 className="stat-card-value">{value}</h3>
            </div>
            <div className="stat-card-icon" style={{ color: color }}>
                {icon}
            </div>
        </div>
    );
}

export default StatCard;