// src/components/admin/SeatManager/SeatForm.jsx
import React, { useState, useEffect } from 'react';
import { addButacaToFuncionAdmin, updateButacaInFuncionAdmin } from '../../../services/adminService';

const initialPlateaState = {
    tipo_butaca: 'platea',
    fila: 1,
    numero: 1,
    seccion: 'Central',
    es_protocolo: false,
};

const initialBalconState = {
    tipo_butaca: 'balcon',
    fila: 1,
    numero: 1,
    numero_balcon: 1,
    es_fumadores: false,
};

function SeatForm({ funcionId, existingButaca, onSuccess, onCancel }) {
    const [butacaType, setButacaType] = useState('platea'); // 'platea' o 'balcon'
    const [formData, setFormData] = useState(initialPlateaState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const isEditing = !!existingButaca;

    useEffect(() => {
        if (isEditing && existingButaca) {
            setButacaType(existingButaca.tipo_butaca);
            // Clonar para evitar mutar el objeto original directamente
            const currentData = { ...existingButaca };
            // El backend no envía 'tipo_butaca' en el cuerpo de update, pero lo necesitamos para el form
            // Y el ID no se envía en el cuerpo de la petición, pero lo tenemos en existingButaca.id
            delete currentData.id; 
            // precio_base_calculado y precio_final_venta son de respuesta, no de envío
            delete currentData.precio_base_calculado;
            delete currentData.precio_final_venta;
            setFormData(currentData);
        } else {
            // Reset a estado inicial según el tipo seleccionado al crear
            setButacaType('platea');
            setFormData(initialPlateaState);
        }
    }, [isEditing, existingButaca]);

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setButacaType(newType);
        if (!isEditing) { // Solo cambiar a defaults si estamos creando
            setFormData(newType === 'platea' ? initialPlateaState : initialBalconState);
        } else { // Si estamos editando, solo cambiamos el tipo en el estado, no reseteamos todo
            setFormData(prev => ({ ...prev, tipo_butaca: newType }));
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) || 0 : value)
        }));
    };
    
    // Para los "inputs como botones" para fila y número
    const handleNumericChange = (field, delta) => {
        setFormData(prev => ({
            ...prev,
            [field]: Math.max(1, (prev[field] || 0) + delta) // Asegurar que no sea menor que 1
        }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        let dataToSubmit = { ...formData };
        
        // Asegurar que el tipo_butaca sea el correcto del selector, especialmente si se edita
        dataToSubmit.tipo_butaca = butacaType;

        // Remover campos no relevantes para el tipo de butaca actual antes de enviar
        if (dataToSubmit.tipo_butaca === 'platea') {
            delete dataToSubmit.numero_balcon;
            delete dataToSubmit.es_fumadores;
        } else if (dataToSubmit.tipo_butaca === 'balcon') {
            delete dataToSubmit.seccion;
            delete dataToSubmit.es_protocolo;
        }
        
        // En modo edición, no podemos cambiar el tipo de butaca ni su ID.
        // El backend no espera `tipo_butaca` en el cuerpo del PUT para actualizar butaca.
        // Lo dejamos si es creación.
        const finalPayload = { ...dataToSubmit };
        if(isEditing) {
            delete finalPayload.tipo_butaca; // tipo_butaca no se puede cambiar en el backend al editar.
        }


        try {
            if (isEditing) {
                await updateButacaInFuncionAdmin(funcionId, existingButaca.id, finalPayload);
            } else {
                await addButacaToFuncionAdmin(funcionId, finalPayload); // finalPayload aquí incluye tipo_butaca
            }
            onSuccess(); // Llama a la función de éxito pasada por props
        } catch (err) {
            setError(err.detail || err.message || 'Error al guardar la butaca.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="form-container" style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
            <h4>{isEditing ? 'Editar Butaca' : 'Agregar Nueva Butaca'}</h4>
            <form onSubmit={handleSubmit}>
                {!isEditing && ( // No permitir cambiar tipo si se está editando, el backend no lo soporta fácilmente
                    <div>
                        <label htmlFor="tipo_butaca">Tipo de Butaca:</label>
                        <select name="tipo_butaca" value={butacaType} onChange={handleTypeChange}>
                            <option value="platea">Platea</option>
                            <option value="balcon">Balcón</option>
                        </select>
                    </div>
                )}

                <div>
                    <label htmlFor="fila">Fila:</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button type="button" onClick={() => handleNumericChange('fila', -1)} style={{ marginRight: '5px' }}>-</button>
                        <input type="number" name="fila" value={formData.fila || ''} onChange={handleChange} required min="1" style={{ width: '60px', textAlign: 'center' }} />
                        <button type="button" onClick={() => handleNumericChange('fila', 1)} style={{ marginLeft: '5px' }}>+</button>
                    </div>
                </div>

                <div>
                    <label htmlFor="numero">Número de Asiento:</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button type="button" onClick={() => handleNumericChange('numero', -1)} style={{ marginRight: '5px' }}>-</button>
                        <input type="number" name="numero" value={formData.numero || ''} onChange={handleChange} required min="1" style={{ width: '60px', textAlign: 'center' }} />
                        <button type="button" onClick={() => handleNumericChange('numero', 1)} style={{ marginLeft: '5px' }}>+</button>
                    </div>
                </div>

                {butacaType === 'platea' && (
                    <>
                        <div>
                            <label htmlFor="seccion">Sección:</label>
                            <input type="text" name="seccion" value={formData.seccion || ''} onChange={handleChange} required />
                        </div>
                        <div>
                            <label htmlFor="es_protocolo" style={{display: 'inline-block', marginRight: '10px'}}>Es de Protocolo:</label>
                            <input type="checkbox" name="es_protocolo" checked={!!formData.es_protocolo} onChange={handleChange} style={{width: 'auto', verticalAlign: 'middle'}}/>
                        </div>
                    </>
                )}

                {butacaType === 'balcon' && (
                    <>
                        <div>
                            <label htmlFor="numero_balcon">Número de Balcón:</label>
                             <div style={{ display: 'flex', alignItems: 'center' }}>
                                <button type="button" onClick={() => handleNumericChange('numero_balcon', -1)} style={{ marginRight: '5px' }}>-</button>
                                <input type="number" name="numero_balcon" value={formData.numero_balcon || ''} onChange={handleChange} required min="1" style={{ width: '60px', textAlign: 'center' }} />
                                <button type="button" onClick={() => handleNumericChange('numero_balcon', 1)} style={{ marginLeft: '5px' }}>+</button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="es_fumadores" style={{display: 'inline-block', marginRight: '10px'}}>Área de Fumadores:</label>
                            <input type="checkbox" name="es_fumadores" checked={!!formData.es_fumadores} onChange={handleChange} style={{width: 'auto', verticalAlign: 'middle'}} />
                        </div>
                    </>
                )}

                {error && <p className="error-message">{error}</p>}
                <button type="submit" disabled={isLoading} style={{marginTop: '10px'}}>
                    {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Butaca' : 'Agregar Butaca')}
                </button>
                <button type="button" onClick={onCancel} disabled={isLoading} style={{ marginLeft: '10px', backgroundColor: '#6c757d' }}>
                    Cancelar
                </button>
            </form>
        </div>
    );
}

export default SeatForm;