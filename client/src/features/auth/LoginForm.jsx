import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLoginMutation } from '../../api/endpoints/auth';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/authSlice';

export const LoginForm = () => {
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [login, { isLoading, error }] = useLoginMutation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await login(credentials).unwrap();

            if (response.success && response.user) {
                // Stockez les données utilisateur dans Redux au lieu de localStorage
                dispatch(setUser(response.user));

                // Rediriger vers le dashboard
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="login-form">
            {error && (
                <div className="error-message">
                    {error.data?.error || 'Une erreur est survenue lors de la connexion.'}
                </div>
            )}

            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={credentials.email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                />
            </div>

            <div className="form-group">
                <div className="password-header">
                    <label htmlFor="password">Mot de passe</label>
                    <Link to="/forgot-password" className="forgot-link">
                        Mot de passe oublié?
                    </Link>
                </div>
                <div className="password-input">
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={credentials.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="toggle-password"
                    >
                        {showPassword ? "Cacher" : "Voir"}
                    </button>
                </div>
            </div>

            <div className="remember-me">
                <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                />
                <label htmlFor="remember-me">Se souvenir de moi</label>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="submit-button"
            >
                {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
        </form>
    );
};