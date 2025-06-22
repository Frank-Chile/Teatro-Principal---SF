// frontend/src/components/admin/FunctionManager/FunctionForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createFuncionAdmin, getFuncionByIdAdmin, updateFuncionAdmin } from '../../../services/adminService';
import '../../../assets/css/AuthForm.css'; // Reutilizamos el CSS de los formularios de login

function FunctionForm() {
    const [nombreObra, setNombreObra] = useState('');
    const [fechaHora, setFechaHora] = useState('');
    const [activa, setActiva] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { funcionId } = useParams();
    const isEditing = !!funcionId;
    const navigate = useNavigate();
    const getMinDateTime = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset();
        const localDate = new Date(now.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().slice(0, 16);
    };
    const [minDateTime, setMinDateTime] = useState(getMinDateTime());

    useEffect(() => {
        if (isEditing) {
            setIsLoading(true);
            getFuncionByIdAdmin(funcionId)
                .then(data => {
                    setNombreObra(data.nombre_obra);
                    // Formatear fecha para el input datetime-local: YYYY-MM-DDTHH:mm
                    const dt = new Date(data.fecha_hora);
                    const localISO = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                    setFechaHora(localISO);
                    setActiva(data.activa);
                })
                .catch(err => setError(err.message || 'Error al cargar datos de la función'))
                .finally(() => setIsLoading(false));
        }
    }, [funcionId, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const funcionData = {
            nombre_obra: nombreObra,
            fecha_hora: new Date(fechaHora).toISOString(),
        };

        if (isEditing) {
            funcionData.activa = activa;
        }

        try {
            if (isEditing) {
                await updateFuncionAdmin(funcionId, funcionData);
            } else {
                await createFuncionAdmin(funcionData);
            }
            navigate('/admin/gestionar-funciones');
        } catch (err) {
            setError(err.detail || 'Error al guardar la función.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && isEditing) return <p>Cargando datos de la función...</p>;

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>{isEditing ? 'Editar Función' : 'Crear Nueva Función'}</h2>
                
                <div className="input-group">
                    <label htmlFor="nombreObra">Nombre de la Obra:</label>
                    <input
                        type="text" id="nombreObra" value={nombreObra}
                        onChange={(e) => setNombreObra(e.target.value)} required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="fechaHora">Fecha y Hora:</label>
                    <input
                        type="datetime-local"
                        id="fechaHora"
                        value={fechaHora}
                        onChange={(e) => setFechaHora(e.target.value)}
                        min={minDateTime}
                        required
                    />
                </div>
                
                {isEditing && (
                    <div className="input-group-checkbox">
                        <label htmlFor="activa">
                            <input
                                type="checkbox" id="activa" checked={activa}
                                onChange={(e) => setActiva(e.target.checked)}
                            />
                            <span>Función Activa</span>
                        </label>
                    </div>
                )}
                
                {error && <p className="error-message">{error}</p>}

                <div className="form-actions">
                    <Link to="/admin/gestionar-funciones" className="action-button secondary">Cancelar</Link>
                    <button type="submit" disabled={isLoading} className="action-button primary">
                        {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Función' : 'Crear Función')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default FunctionForm;