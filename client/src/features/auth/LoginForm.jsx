import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLoginMutation } from '../../api/endpoints/auth';

export const LoginForm = () => {
    const [credentials, setCredentials] = useState({
        username: '', // Le backend attend 'username' pour lexik_jwt
        password: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [login, { isLoading }] = useLoginMutation();
    const navigate = useNavigate();

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
            await login(credentials).unwrap();
            navigate('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
                <label htmlFor="username">Email</label>
                <input
                    id="username"
                    name="username"
                    type="email"
                    required
                    value={credentials.username}
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