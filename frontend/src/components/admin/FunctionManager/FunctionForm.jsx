// frontend/src/components/admin/FunctionManager/FunctionForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createFuncionAdmin, getFuncionByIdAdmin, updateFuncionAdmin } from '../../../services/adminService';
import '../../../assets/css/AuthForm.css'; // Reutilizamos el CSS de los formularios de login

function FunctionForm() {
    const [formData, setFormData] = useState({
        nombre_obra: '',
        fecha_hora: '',
        activa: true,
    });
    const [initialData, setInitialData] = useState(null); // Para comparar si hay cambios
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const { funcionId } = useParams();
    const isEditing = !!funcionId;
    const navigate = useNavigate();

    // Obtiene la fecha y hora actual en el formato que el input necesita (YYYY-MM-DDTHH:mm)
    const getMinDateTime = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset();
        const localDate = new Date(now.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().slice(0, 16);
    };

    useEffect(() => {
        if (isEditing) {
            setIsLoading(true);
            getFuncionByIdAdmin(funcionId)
                .then(data => {
                    const dt = new Date(data.fecha_hora);
                    const localISO = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                    
                    const loadedData = {
                        nombre_obra: data.nombre_obra,
                        fecha_hora: localISO,
                        activa: data.activa
                    };
                    
                    setFormData(loadedData);
                    setInitialData(loadedData); // Guardamos el estado inicial para la comparación
                })
                .catch(err => setError(err.message || 'Error al cargar datos de la función'))
                .finally(() => setIsLoading(false));
        } else {
            // Establece la fecha actual por defecto al crear una nueva función
            setFormData(prev => ({ ...prev, fecha_hora: getMinDateTime() }));
            setInitialData({ nombre_obra: '', fecha_hora: getMinDateTime(), activa: true });
        }
    }, [funcionId, isEditing]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const hasUnsavedChanges = useMemo(() => {
        if (!initialData) return false;
        return JSON.stringify(formData) !== JSON.stringify(initialData);
    }, [formData, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const funcionData = {
            nombre_obra: formData.nombre_obra,
            fecha_hora: formData.fecha_hora,
        };

        if (isEditing) {
            funcionData.activa = formData.activa;
        }

        try {
            // Esta lógica cumple con las Historias de Usuario HU1 y HU2
            if (isEditing) {
                await updateFuncionAdmin(funcionId, funcionData);
            } else {
                await createFuncionAdmin(funcionData);
            }
            navigate('/admin/gestionar-funciones');
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al guardar la función.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && isEditing) return <p>Cargando datos de la función...</p>;

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form" style={{maxWidth: '600px'}}>
                <h2>{isEditing ? 'Editar Función' : 'Crear Nueva Función'}</h2>
                
                <div className="input-group">
                    <label htmlFor="nombreObra">Nombre de la Obra:</label>
                    <input
                        type="text" id="nombreObra" name="nombre_obra" value={formData.nombre_obra}
                        onChange={handleChange} required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="fechaHora">Fecha y Hora de la Función:</label>
                    <input
                        type="datetime-local" id="fechaHora" name="fecha_hora" value={formData.fecha_hora}
                        onChange={handleChange} min={isEditing ? '' : getMinDateTime()} required
                    />
                </div>
                
                {isEditing && (
                    <div className="input-group-checkbox">
                        <label htmlFor="activa">
                            <input
                                type="checkbox" id="activa" name="activa" checked={formData.activa}
                                onChange={handleChange}
                            />
                            <span>Función Activa</span>
                        </label>
                    </div>
                )}
                
                {error && <p className="error-message">{error}</p>}

                <div className="form-actions">
                    <Link to="/admin/gestionar-funciones" className="action-button secondary">Cancelar</Link>
                    <button type="submit" disabled={isLoading || (isEditing && !hasUnsavedChanges)} className="action-button primary">
                        {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Función' : 'Crear Función')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default FunctionForm;