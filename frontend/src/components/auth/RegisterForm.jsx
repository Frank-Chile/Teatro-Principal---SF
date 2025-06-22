// frontend/src/components/auth/RegisterForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../services/authService';
import { FaUser, FaEnvelope, FaLock, FaAddressCard } from 'react-icons/fa';
import '../../assets/css/AuthForm.css';

function RegisterForm() {
    const [formData, setFormData] = useState({
        username: '',
        nombres_apellidos: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [passwordValidations, setPasswordValidations] = useState({
        length: false, uppercase: false, lowercase: false,
        number: false, specialChar: false,
    });
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const { password } = formData;
        setPasswordValidations({
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            specialChar: /[^A-Za-z0-9]/.test(password),
        });
    }, [formData.password]);

    const validateEmail = (email) => {
        if (!email) { setEmailError(''); return true; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Por favor, introduce un formato de correo válido.');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
        if (name === 'email') {
            validateEmail(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage('');

        if (!validateEmail(formData.email)) return;
        if (formData.password !== formData.confirmPassword) {
            setErrors({ confirmPassword: "Las contraseñas no coinciden." });
            return;
        }
        const allValid = Object.values(passwordValidations).every(v => v === true);
        if (!allValid) {
            setErrors({ password: "La contraseña no cumple con todos los requisitos de seguridad." });
            return;
        }

        setIsSubmitting(true);
        try {
            const userData = {
                username: formData.username,
                email: formData.email,
                nombres_apellidos: formData.nombres_apellidos,
                password: formData.password,
            };
            await registerUser(userData);
            setSuccessMessage('¡Registro exitoso! Serás redirigido a la página de login en 3 segundos.');
            
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (error) {
            // --- CORRECCIÓN AQUÍ ---
            // Se procesa el objeto de error de FastAPI/Pydantic
            if (error.response && error.response.status === 422 && error.response.data && error.response.data.detail) {
                const errorDetail = error.response.data.detail[0];
                const field = errorDetail.loc[1];
                const message = errorDetail.msg;
                setErrors({ form: `Error de validación en el campo '${field}': ${message}` });
            } else {
                // Fallback para otros errores (ej. usuario ya existe)
                setErrors({ form: error.detail || 'Ocurrió un error durante el registro.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} noValidate className="auth-form">
                <h2>Crear una Cuenta</h2>
                
                <div className="input-group-icon">
                    <FaUser className="input-icon" />
                    <input type="text" id="username" name="username" placeholder="Nombre de Usuario" value={formData.username} onChange={handleChange} required />
                </div>
                
                <div className="input-group-icon">
                    <FaAddressCard className="input-icon" />
                    <input type="text" id="nombres_apellidos" name="nombres_apellidos" placeholder="Nombres y Apellidos" value={formData.nombres_apellidos} onChange={handleChange} required />
                </div>

                <div className="input-group-icon">
                    <FaEnvelope className="input-icon" />
                    <input type="email" id="email" name="email" placeholder="Correo Electrónico" value={formData.email} onChange={handleChange} required />
                </div>
                {emailError && <p className="error-message">{emailError}</p>}

                <div className="input-group-icon">
                    <FaLock className="input-icon" />
                    <input type="password" id="password" name="password" placeholder="Contraseña" value={formData.password} onChange={handleChange} required />
                </div>

                <div className="password-requirements">
                    <p className={passwordValidations.length ? 'valid' : ''}>
                        {passwordValidations.length ? '✔️' : '❌'} 8+ caracteres
                    </p>
                    <p className={passwordValidations.uppercase ? 'valid' : ''}>
                        {passwordValidations.uppercase ? '✔️' : '❌'} Mayúscula
                    </p>
                    <p className={passwordValidations.lowercase ? 'valid' : ''}>
                        {passwordValidations.lowercase ? '✔️' : '❌'} Minúscula
                    </p>
                    <p className={passwordValidations.number ? 'valid' : ''}>
                        {passwordValidations.number ? '✔️' : '❌'} Número
                    </p>
                    <p className={passwordValidations.specialChar ? 'valid' : ''}>
                        {passwordValidations.specialChar ? '✔️' : '❌'} Símbolo
                    </p>
                </div>
                {errors.password && <p className="error-message">{errors.password}</p>}

                 <div className="input-group-icon">
                    <FaLock className="input-icon" />
                    <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirmar Contraseña" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
                {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}

                {errors.form && <p className="error-message form-error">{errors.form}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}
                
                <button type="submit" disabled={isSubmitting} className="submit-btn">
                    {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
                </button>

                <p className="redirect-link">
                    ¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión</Link>
                </p>
            </form>
        </div>
    );
}

export default RegisterForm;