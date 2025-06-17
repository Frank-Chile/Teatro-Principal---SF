import React, { useState } from 'react';
import './CheckoutModal.css';

function CheckoutModal({ totalPrice, onConfirm, onCancel, isPurchasing }) {
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');

    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Simulación de Pago</h3>
                <p><strong>Total a Pagar: ${totalPrice}</strong></p>
                <div className="payment-form">
                    <label>Nombre en la Tarjeta</label>
                    <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Ej: Juan Perez" />

                    <label>Número de Tarjeta</label>
                    <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="XXXX XXXX XXXX XXXX" />
                    
                    <div className="half-width">
                        <div>
                            <label>Expiración (MM/AA)</label>
                            <input type="text" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/AA" />
                        </div>
                        <div>
                            <label>CVV</label>
                            <input type="text" value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="XXX" />
                        </div>
                    </div>
                </div>
                <div className="modal-actions">
                    <button onClick={onCancel} disabled={isPurchasing} className="btn-cancel">Cancelar</button>
                    <button onClick={handleConfirm} disabled={isPurchasing} className="btn-confirm">
                        {isPurchasing ? 'Procesando...' : `Pagar $${totalPrice}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CheckoutModal;