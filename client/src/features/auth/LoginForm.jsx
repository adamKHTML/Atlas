import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../../api/endpoints/auth';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/authSlice';

export const LoginForm = () => {
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [login, { isLoading, error }] = useLoginMutation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    /**
     * 🔒 Validation sécurisée côté client
     */
    const validateForm = () => {
        const newErrors = {};

        // 🔒 Validation email robuste
        if (!credentials.email) {
            newErrors.email = 'Email requis';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
            newErrors.email = 'Format email invalide';
        } else if (credentials.email.length > 254) {
            newErrors.email = 'Email trop long';
        }

        // 🔒 Validation password
        if (!credentials.password) {
            newErrors.password = 'Mot de passe requis';
        } else if (credentials.password.length < 6) {
            newErrors.password = 'Au moins 6 caractères requis';
        } else if (credentials.password.length > 255) {
            newErrors.password = 'Mot de passe trop long';
        }

        return newErrors;
    };

    /**
     * 🔒 Gestion sécurisée des changements de formulaire
     */
    const handleChange = (e) => {
        const { name, value } = e.target;

        // 🔒 Supprimer l'erreur du champ modifié
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }

        // 🔒 Sanitisation basique côté client
        const sanitizedValue = typeof value === 'string' ? value.trim() : value;

        setCredentials(prev => ({
            ...prev,
            [name]: sanitizedValue
        }));
    };

    /**
     * 🔒 Soumission sécurisée du formulaire
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 🔒 Validation côté client
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            const response = await login({
                email: credentials.email.toLowerCase().trim(),
                password: credentials.password
            }).unwrap();

            if (response.success && response.user) {
                // ✅ Connexion réussie
                setErrors({});
                dispatch(setUser(response.user));

                // 🔒 Log sécurisé (sans données sensibles)
                console.log('Connexion réussie pour l\'utilisateur:', response.user.id);

                // 🔒 Nettoyage du formulaire
                setCredentials({ email: '', password: '' });

                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Erreur login:', err?.status || 'Erreur inconnue');

            // 🔒 Gestion sécurisée des erreurs (messages génériques)
            if (err?.status === 401) {
                setErrors({ general: 'Email ou mot de passe incorrect.' });
            } else if (err?.status === 403) {
                setErrors({ general: 'Veuillez vérifier votre email avant de vous connecter.' });
            } else if (err?.status === 429) {
                setErrors({ general: 'Trop de tentatives. Veuillez patienter.' });
            } else if (err?.status >= 500) {
                setErrors({ general: 'Erreur serveur. Veuillez réessayer plus tard.' });
            } else {
                setErrors({ general: 'Erreur de connexion. Veuillez réessayer.' });
            }

            // 🔒 Nettoyer le mot de passe en cas d'erreur
            setCredentials(prev => ({ ...prev, password: '' }));
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form" noValidate>
                <h2>Connexion</h2>

                {/* 🔒 Affichage sécurisé des erreurs */}
                {(errors.general || error) && (
                    <div className="error-message" role="alert">
                        {errors.general || error?.data?.error || 'Erreur de connexion'}
                    </div>
                )}

                {/* 🔒 Champ email sécurisé */}
                <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        maxLength="254"
                        value={credentials.email}
                        onChange={handleChange}
                        placeholder="votre@email.com"
                        className={errors.email ? 'error' : ''}
                        autoComplete="email"
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        disabled={isLoading}
                    />
                    {errors.email && (
                        <div id="email-error" className="field-error" role="alert">
                            {errors.email}
                        </div>
                    )}
                </div>

                {/* 🔒 Champ mot de passe sécurisé */}
                <div className="form-group">
                    <label htmlFor="password">Mot de passe *</label>
                    <div className="password-input">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            maxLength="255"
                            value={credentials.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className={errors.password ? 'error' : ''}
                            autoComplete="current-password"
                            aria-describedby={errors.password ? 'password-error' : undefined}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="toggle-password"
                            aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                            disabled={isLoading}
                            tabIndex="-1"
                        >
                            {showPassword ? "Cacher" : "Voir"}
                        </button>
                    </div>
                    {errors.password && (
                        <div id="password-error" className="field-error" role="alert">
                            {errors.password}
                        </div>
                    )}
                </div>

                {/* 🔒 Bouton de soumission sécurisé */}
                <button
                    type="submit"
                    disabled={isLoading || !credentials.email || !credentials.password}
                    className="submit-button"
                    aria-describedby="submit-status"
                >
                    {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                </button>

                {/* 🔒 Indicateur d'état pour l'accessibilité */}
                <div id="submit-status" className="sr-only" aria-live="polite">
                    {isLoading ? 'Connexion en cours' : ''}
                </div>
            </form>
        </div>
    );
};