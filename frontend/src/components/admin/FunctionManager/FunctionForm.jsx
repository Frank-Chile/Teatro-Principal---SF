// src/components/admin/FunctionManager/FunctionForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createFuncionAdmin, getFuncionByIdAdmin, updateFuncionAdmin } from '../../../services/adminService';

function FunctionForm() {
    const [nombreObra, setNombreObra] = useState('');
    const [fechaHora, setFechaHora] = useState('');
    const [activa, setActiva] = useState(true); // Por defecto activa al crear
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const navigate = useNavigate();
    const { funcionId } = useParams(); // Para modo edición

    useEffect(() => {
        if (funcionId) {
            setIsEditing(true);
            setIsLoading(true);
            getFuncionByIdAdmin(funcionId)
                .then(data => {
                    setNombreObra(data.nombre_obra);
                    // Formatear fecha para input datetime-local: YYYY-MM-DDTHH:mm
                    const dt = new Date(data.fecha_hora);
                    const localISO = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                    setFechaHora(localISO);
                    setActiva(data.activa);
                })
                .catch(err => setError(err.message || 'Error al cargar datos de la función'))
                .finally(() => setIsLoading(false));
        }
    }, [funcionId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const funcionData = {
            nombre_obra: nombreObra,
            fecha_hora: new Date(fechaHora).toISOString(), // Enviar en formato ISO UTC
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
            navigate('/admin/gestionar-funciones'); // Redirigir a la lista
        } catch (err) {
            setError(err.detail || err.message || 'Error al guardar la función.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && isEditing) return <p>Cargando datos de la función...</p>;

    return (
        <div className="form-container">
            <h2>{isEditing ? 'Editar Función' : 'Crear Nueva Función'}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="nombreObra">Nombre de la Obra:</label>
                    <input
                        type="text"
                        id="nombreObra"
                        value={nombreObra}
                        onChange={(e) => setNombreObra(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="fechaHora">Fecha y Hora:</label>
                    <input
                        type="datetime-local"
                        id="fechaHora"
                        value={fechaHora}
                        onChange={(e) => setFechaHora(e.target.value)}
                        required
                    />
                </div>
                {isEditing && (
                     <div>
                        <label htmlFor="activa" style={{display: 'inline-block', marginRight: '10px'}}>Activa:</label>
                        <input
                            type="checkbox"
                            id="activa"
                            checked={activa}
                            onChange={(e) => setActiva(e.target.checked)}
                            style={{width: 'auto', verticalAlign: 'middle'}}
                        />
                    </div>
                )}
                {error && <p className="error-message">{error}</p>}
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Función' : 'Crear Función')}
                </button>
                <button type="button" onClick={() => navigate('/admin/gestionar-funciones')} disabled={isLoading} style={{marginLeft: '10px', backgroundColor: '#6c757d'}}>
                    Cancelar
                </button>
            </form>
        </div>
    );
}

export default FunctionForm;