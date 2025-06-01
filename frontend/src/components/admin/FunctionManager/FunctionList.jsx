// src/components/admin/FunctionManager/FunctionList.jsx
import React, { useState, useEffect, useCallback } from 'react'; // useCallback añadido si no estaba
import { Link } from 'react-router-dom';
import { getFuncionesAdmin, deleteFuncionAdmin } from '../../../services/adminService';

function FunctionList() {
    const [funciones, setFunciones] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showActivasOnly, setShowActivasOnly] = useState(false);

    const fetchFunciones = useCallback(async () => { // useCallback para evitar re-ejecuciones innecesarias del useEffect
        setIsLoading(true);
        setError('');
        try {
            const data = await getFuncionesAdmin(showActivasOnly);
            setFunciones(data);
        } catch (err) {
            setError(err.message || 'Error al cargar funciones');
        } finally {
            setIsLoading(false);
        }
    }, [showActivasOnly]); // Dependencia de showActivasOnly

    useEffect(() => {
        fetchFunciones();
    }, [fetchFunciones]); // Ahora depende de la función memoizada

    const handleDelete = async (funcionId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta función?')) {
            try {
                await deleteFuncionAdmin(funcionId);
                fetchFunciones(); 
            } catch (err) {
                alert(err.response?.data?.detail || err.message || 'Error al eliminar la función.');
            }
        }
    };

    if (isLoading) return <p>Cargando funciones...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div>
            <h3>Lista de Funciones</h3>
            {/* CORRECCIÓN AQUÍ en el 'to' prop del Link */}
            <Link to="nueva"> {/* O to="/admin/gestionar-funciones/nueva" para ruta absoluta */}
                <button>Crear Nueva Función</button>
            </Link>
            <label style={{ marginLeft: '20px'}}>
                <input
                    type="checkbox"
                    checked={showActivasOnly}
                    onChange={(e) => setShowActivasOnly(e.target.checked)}
                />
                Mostrar solo activas
            </label>

            {funciones.length === 0 ? (
                <p>No hay funciones para mostrar.</p>
            ) : (
                <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={tableHeaderStyle}>Obra</th>
                            <th style={tableHeaderStyle}>Fecha y Hora</th>
                            <th style={tableHeaderStyle}>Butacas</th>
                            <th style={tableHeaderStyle}>Vendidas</th>
                            <th style={tableHeaderStyle}>Activa</th>
                            <th style={tableHeaderStyle}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {funciones.map((funcion) => (
                            <tr key={funcion.id}>
                                <td style={tableCellStyle}>{funcion.nombre_obra}</td>
                                <td style={tableCellStyle}>{new Date(funcion.fecha_hora).toLocaleString()}</td>
                                <td style={tableCellStyle}>{funcion.cantidad_butacas}</td>
                                <td style={tableCellStyle}>{funcion.cantidad_butacas_vendidas}</td>
                                <td style={tableCellStyle}>{funcion.activa ? 'Sí' : 'No'}</td>
                                <td style={tableCellStyle}>
                                    {/* Estos links también deben ser relativos o completos y correctos */}
                                    <Link to={`${funcion.id}/editar`}>
                                        <button style={{ marginRight: '5px' }}>Editar</button>
                                    </Link>
                                    <Link to={`${funcion.id}/butacas`}>
                                        <button style={{ marginRight: '5px' }}>Butacas</button>
                                    </Link>
                                    <button onClick={() => handleDelete(funcion.id)} style={{backgroundColor: '#dc3545'}}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

const tableHeaderStyle = {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left',
    backgroundColor: '#f2f2f2'
};

const tableCellStyle = {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left'
};

export default FunctionList;