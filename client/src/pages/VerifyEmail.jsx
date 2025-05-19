import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVerifyEmailQuery } from '../api/endpoints/auth'; // Utilisation de Query

const VerifyEmail = () => {
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Extraire le token de l'URL
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    // Utiliser le hook query (important: skip: !token pour éviter d'appeler l'API sans token)
    const { data, error, isLoading, isSuccess, isError } = useVerifyEmailQuery(token, {
        skip: !token // Ne pas exécuter la requête si pas de token
    });

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token de vérification manquant.');
            return;
        }

        if (isLoading) {
            setStatus('loading');
        }

        if (isSuccess) {
            setStatus('success');
            setMessage('Votre email a été vérifié avec succès!');

            // Rediriger vers la page de connexion après 3 secondes
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        }

        if (isError) {
            setStatus('error');
            setMessage(
                error?.data?.error ||
                'Une erreur est survenue lors de la vérification de votre email. Veuillez réessayer.'
            );
        }
    }, [token, isLoading, isSuccess, isError, error, navigate]);

    return (
        <div className="verify-email-container">
            <div className="verify-email-card">
                <h1>Vérification d'email</h1>

                {status === 'loading' && (
                    <div className="loading-state">
                        <p>Vérification en cours...</p>
                        {/* Vous pouvez ajouter un spinner ici */}
                    </div>
                )}

                {status === 'success' && (
                    <div className="success-state">
                        <div className="success-icon">✓</div>
                        <p>{message}</p>
                        <p>Vous allez être redirigé vers la page de connexion...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="error-state">
                        <div className="error-icon">✗</div>
                        <p>{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="redirect-button"
                        >
                            Aller à la page de connexion
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;