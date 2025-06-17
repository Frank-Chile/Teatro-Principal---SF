// src/components/client/FunctionListView.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActiveFuncionesClient } from '../../services/clientService';

function FunctionListView() {
    const [funciones, setFunciones] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFunciones = async () => {
            setIsLoading(true);
            setError('');
            try {
                const data = await getActiveFuncionesClient(10); // Traer las últimas 10
                setFunciones(data);
            } catch (err) {
                setError(err.message || 'Error al cargar funciones');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFunciones();
    }, []);

    if (isLoading) return <p>Cargando funciones disponibles...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="form-container" style={{maxWidth: '800px'}}>
            <h2>Funciones Disponibles</h2>
            {funciones.length === 0 ? (
                <p>No hay funciones disponibles en este momento.</p>
            ) : (
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {funciones.map((funcion) => (
                        <li key={funcion.id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
                            <h3 style={{marginTop: 0}}>{funcion.nombre_obra}</h3>
                            <p><strong>Fecha y Hora:</strong> {new Date(funcion.fecha_hora).toLocaleString()}</p>
                            <p><strong>Butacas Disponibles:</strong> {funcion.cantidad_butacas - funcion.cantidad_butacas_vendidas} / {funcion.cantidad_butacas}</p>
                            <Link to={`/client/funcion/${funcion.id}/seleccionar-butacas`}>
                                <button>Ver Butacas y Comprar</button>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default FunctionListView;