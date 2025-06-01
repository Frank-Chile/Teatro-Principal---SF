// src/components/admin/SeatManager/SeatList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getButacasByFuncionAdmin, deleteButacaFromFuncionAdmin, getFuncionByIdAdmin } from '../../../services/adminService';
import SeatForm from './SeatForm'; // Crearemos este componente a continuación

function SeatList() {
    const { funcionId } = useParams();
    const navigate = useNavigate();
    const [butacas, setButacas] = useState([]);
    const [funcion, setFuncion] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSeatForm, setShowSeatForm] = useState(false);
    const [editingButaca, setEditingButaca] = useState(null); // Para editar una butaca existente

    const fetchButacasYFuncion = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [butacasData, funcionData] = await Promise.all([
                getButacasByFuncionAdmin(funcionId),
                getFuncionByIdAdmin(funcionId)
            ]);
            setButacas(butacasData);
            setFuncion(funcionData);
        } catch (err) {
            setError(err.message || 'Error al cargar datos');
            if (err.detail && err.detail.includes("Función no encontrada")) {
                navigate('/admin/gestionar-funciones'); // Redirigir si la función no existe
            }
        } finally {
            setIsLoading(false);
        }
    }, [funcionId, navigate]);

    useEffect(() => {
        fetchButacasYFuncion();
    }, [fetchButacasYFuncion]);

    const handleDeleteButaca = async (butacaId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta butaca?')) {
            try {
                await deleteButacaFromFuncionAdmin(funcionId, butacaId);
                fetchButacasYFuncion(); // Recargar la lista
            } catch (err) {
                alert(err.detail || err.message || 'Error al eliminar la butaca.');
            }
        }
    };

    const handleEditButaca = (butaca) => {
        setEditingButaca(butaca);
        setShowSeatForm(true);
    };

    const handleShowAddForm = () => {
        setEditingButaca(null); // Asegurarse que no estamos editando
        setShowSeatForm(true);
    };

    const handleFormSuccess = () => {
        setShowSeatForm(false);
        setEditingButaca(null);
        fetchButacasYFuncion(); // Recargar datos después de agregar/editar
    };

    if (isLoading) return <p>Cargando butacas...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!funcion) return <p>Función no encontrada.</p>;

    return (
        <div>
            <h3>Gestión de Butacas para: {funcion.nombre_obra}</h3>
            <p>{new Date(funcion.fecha_hora).toLocaleString()}</p>
            
            {!showSeatForm && (
                <button onClick={handleShowAddForm} style={{ marginBottom: '20px' }}>
                    Agregar Nueva Butaca
                </button>
            )}

            {showSeatForm && (
                <SeatForm
                    funcionId={funcionId}
                    existingButaca={editingButaca}
                    onSuccess={handleFormSuccess}
                    onCancel={() => {
                        setShowSeatForm(false);
                        setEditingButaca(null);
                    }}
                />
            )}

            <h4>Butacas Existentes ({butacas.length})</h4>
            {butacas.length === 0 && !showSeatForm ? (
                <p>No hay butacas registradas para esta función.</p>
            ) : (
                !showSeatForm && (
                    <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={tableHeaderStyle}>Fila-Número</th>
                                <th style={tableHeaderStyle}>Tipo</th>
                                <th style={tableHeaderStyle}>Detalles</th>
                                <th style={tableHeaderStyle}>Precio Base</th>
                                <th style={tableHeaderStyle}>Vendida</th>
                                <th style={tableHeaderStyle}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {butacas.map((butaca) => (
                                <tr key={butaca.id}>
                                    <td style={tableCellStyle}>F{butaca.fila}-N{butaca.numero}</td>
                                    <td style={tableCellStyle}>{butaca.tipo_butaca}</td>
                                    <td style={tableCellStyle}>
                                        {butaca.tipo_butaca === 'platea' && `Sección: ${butaca.seccion}, Protocolo: ${butaca.es_protocolo ? 'Sí' : 'No'}`}
                                        {butaca.tipo_butaca === 'balcon' && `Balcón N°: ${butaca.numero_balcon}, Fumadores: ${butaca.es_fumadores ? 'Sí' : 'No'}`}
                                    </td>
                                    <td style={tableCellStyle}>${butaca.precio_base_calculado?.toFixed(2)}</td>
                                    <td style={tableCellStyle}>{butaca.vendida ? 'Sí' : 'No'}</td>
                                    <td style={tableCellStyle}>
                                        <button onClick={() => handleEditButaca(butaca)} style={{ marginRight: '5px' }} disabled={butaca.vendida}>
                                            Editar
                                        </button>
                                        <button onClick={() => handleDeleteButaca(butaca.id)} style={{backgroundColor: '#dc3545'}} disabled={butaca.vendida}>
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )
            )}
            <button onClick={() => navigate('/admin/gestionar-funciones')} style={{marginTop: '20px', backgroundColor: '#6c757d'}}>
                Volver a Funciones
            </button>
        </div>
    );
}

const tableHeaderStyle = {
    border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2'
};
const tableCellStyle = {
    border: '1px solid #ddd', padding: '8px', textAlign: 'left'
};

export default SeatList;