import React from 'react';
import { Link } from 'react-router-dom';
import { RegisterForm } from '../features/auth/RegisterForm';

const Register = () => {
    return (
        <div className="register-page">
            <header className="page-header">
                <Link to="/" className="logo-nav">
                    <img
                        src="/image/SunLogo.svg"
                        alt='Solar Atlas Logo'
                        className="logo"
                    />
                </Link>
                <Link to="/login" className="nav-button">Se connecter</Link>
            </header>

            <main className="page-content">
                <div className="form-container">
                    <h1 className="page-title">Créer un compte</h1>
                    <RegisterForm />

                    <div className="alt-action">
                        <p>
                            Déjà un compte? <Link to="/login" className="alt-link">Se connecter</Link>
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

export default Register;