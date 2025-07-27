import React from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '../features/auth/LoginForm';

const Login = () => {
    return (
        <div className="login-page">
            <header className="page-header">
                <Link to="/" className="logo-nav">
                    <img
                        src="/image/SunLogo.svg"
                        alt='Solar Atlas Logo'
                        className="logo"
                    />
                </Link>
                <Link to="/register" className="nav-button">S'inscrire</Link>
            </header>

            <main className="page-content">
                <div className="form-container">
                    <h1 className="page-title">Connexion</h1>
                    <LoginForm />

                    <div className="alt-action">
                        <p>
                            Nouveau sur Atlas? <Link to="/register" className="alt-link">Créer un compte</Link>
                        </p>
                    </div>
                </div>
            </main>

            <footer className="page-footer">
                <p>&copy; {new Date().getFullYear()} Atlas. Tous droits réservés.</p>
            </footer>
        </div>
    );
};

export default Login;