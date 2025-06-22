// frontend/src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from './StatCard';
import { getDashboardStats } from '../../services/adminService';
import { FaTicketAlt, FaDollarSign, FaUserCheck, FaPlusCircle, FaChartBar, FaTheaterMasks } from 'react-icons/fa';
import './AdminDashboard.css';

function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getDashboardStats();
                setStats(data);
            } catch (err) {
                setError('No se pudieron cargar las estadísticas.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return <p>Cargando dashboard...</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    return (
        <div className="dashboard-container">
            <h2>Dashboard Principal</h2>
            <div className="stats-grid">
                <StatCard title="Funciones Activas" value={stats.funciones_activas} icon={<FaTicketAlt />} color="#3498db" />
                <StatCard title="Total Entradas Vendidas" value={stats.butacas_vendidas_total} icon={<FaUserCheck />} color="#2ecc71" />
                <StatCard title="Ingresos Totales" value={`S/ ${stats.ingresos_totales.toFixed(2)}`} icon={<FaDollarSign />} color="#f1c40f" />
                <StatCard title="Aforo Promedio" value={`${stats.aforo_promedio}%`} icon={<FaTheaterMasks />} color="#e74c3c" />
            </div>
            <div className="quick-actions">
                <h3>Acciones Rápidas</h3>
                <div className="action-buttons">
                    <Link to="/admin/gestionar-funciones/nueva" className="action-button">
                        <FaPlusCircle />
                        <span>Crear Nueva Función</span>
                    </Link>
                    <Link to="/admin/gestionar-funciones" className="action-button">
                        <FaTicketAlt />
                        <span>Gestionar Funciones</span>
                    </Link>
                    <Link to="/admin/generar-reportes" className="action-button">
                        <FaChartBar />
                        <span>Ver Reportes</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;