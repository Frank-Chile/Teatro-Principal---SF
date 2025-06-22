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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        
        const newErrors = {};
        if (!formData.username.trim()) newErrors.username = "El nombre de usuario es obligatorio.";
        if (!formData.nombres_apellidos.trim()) newErrors.nombres_apellidos = "Los nombres y apellidos son obligatorios.";
        if (!formData.email.trim()) {
            newErrors.email = "El correo electrónico es obligatorio.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "El formato del correo no es válido.";
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Las contraseñas no coinciden.";
        }
        const allPasswordReqsMet = Object.values(passwordValidations).every(v => v === true);
        if (!allPasswordReqsMet) {
            newErrors.password = "La contraseña no cumple con los requisitos.";
        }
        
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
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
            if (error.response && error.response.status === 422) {
                const errorDetail = error.response.data.detail[0];
                const errorMessage = `Error en '${errorDetail.loc[1]}': ${errorDetail.msg}`;
                setErrors({ form: errorMessage });
            } else {
                setErrors({ form: error.detail || 'Ocurrió un error. El usuario o email pueden ya estar en uso.' });
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
                {errors.username && <p className="error-message">{errors.username}</p>}
                
                <div className="input-group-icon">
                    <FaAddressCard className="input-icon" />
                    <input type="text" id="nombres_apellidos" name="nombres_apellidos" placeholder="Nombres y Apellidos" value={formData.nombres_apellidos} onChange={handleChange} required />
                </div>
                {errors.nombres_apellidos && <p className="error-message">{errors.nombres_apellidos}</p>}

                <div className="input-group-icon">
                    <FaEnvelope className="input-icon" />
                    <input type="email" id="email" name="email" placeholder="Correo Electrónico" value={formData.email} onChange={handleChange} required />
                </div>
                {errors.email && <p className="error-message">{errors.email}</p>}

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