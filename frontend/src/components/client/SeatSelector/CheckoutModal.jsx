// frontend/src/components/client/SeatSelector/CheckoutModal.jsx
import React, { useState } from 'react';
import { FaCreditCard, FaUser, FaCalendarAlt, FaLock } from 'react-icons/fa';
import './CheckoutModal.css';

function CheckoutModal({ totalPrice, onConfirm, onCancel, isPurchasing }) {
    const [cardData, setCardData] = useState({ name: '', number: '', expiry: '', cvv: '' });
    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        let { name, value } = e.target;

        // Auto-formato para el número de tarjeta
        if (name === 'number') {
            value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
        }
        // Auto-formato para la fecha de expiración
        if (name === 'expiry') {
            value = value.replace(/\D/g, '');
            if (value.length > 2) {
                value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
            }
        }
        
        setCardData(prev => ({ ...prev, [name]: value }));
    };

    const validateAndConfirm = () => {
        const newErrors = {};
        const cardNumber = cardData.number.replace(/\s/g, '');

        if (!cardData.name.trim()) newErrors.name = 'El nombre es obligatorio.';
        if (!/^\d{16}$/.test(cardNumber)) newErrors.number = 'El número de tarjeta debe tener 16 dígitos.';
        if (!/^\d{3,4}$/.test(cardData.cvv)) newErrors.cvv = 'El CVV debe tener 3 o 4 dígitos.';
        
        // --- VALIDACIÓN DE FECHA MEJORADA ---
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardData.expiry)) {
            newErrors.expiry = 'El formato debe ser MM/AA.';
        } else {
            const [month, year] = cardData.expiry.split('/');
            const expiryDate = new Date(`20${year}`, month - 1);
            const currentDate = new Date();
            // Ajustar la fecha actual al final del mes para una comparación justa
            currentDate.setMonth(currentDate.getMonth() + 1, 0); 
            
            if (expiryDate < currentDate) {
                newErrors.expiry = 'La tarjeta ha expirado.';
            }
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            onConfirm();
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Pago de Entradas</h3>
                <p><strong>Total a Pagar: ${totalPrice}</strong></p>
                <div className="payment-form">
                    <div className="input-group-icon">
                        <FaUser className="input-icon" />
                        <input type="text" name="name" value={cardData.name} onChange={handleInputChange} placeholder="Nombre en la Tarjeta" />
                    </div>
                    {errors.name && <p className="error-message">{errors.name}</p>}

                    <div className="input-group-icon">
                        <FaCreditCard className="input-icon" />
                        <input type="text" name="number" value={cardData.number} onChange={handleInputChange} placeholder="Número de Tarjeta" maxLength="19" />
                    </div>
                    {errors.number && <p className="error-message">{errors.number}</p>}

                    <div className="half-width">
                        <div className="input-group-icon">
                            <FaCalendarAlt className="input-icon" />
                            <input type="text" name="expiry" value={cardData.expiry} onChange={handleInputChange} placeholder="MM/AA" maxLength="5" />
                        </div>
                         <div className="input-group-icon">
                            <FaLock className="input-icon" />
                            <input type="text" name="cvv" value={cardData.cvv} onChange={handleInputChange} placeholder="CVV" maxLength="4" />
                        </div>
                    </div>
                    {/* Muestra de errores para los campos de media anchura */}
                    {(errors.expiry || errors.cvv) && 
                        <div className="half-width-errors">
                            <div className="error-message">{errors.expiry || ''}</div>
                            <div className="error-message">{errors.cvv || ''}</div>
                        </div>
                    }
                </div>
                <div className="modal-actions">
                    <button onClick={onCancel} disabled={isPurchasing} className="btn-cancel">Cancelar</button>
                    <button onClick={validateAndConfirm} disabled={isPurchasing} className="btn-confirm">
                        {isPurchasing ? 'Procesando...' : `Pagar $${totalPrice}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CheckoutModal;