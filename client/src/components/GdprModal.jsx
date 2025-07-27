import React from 'react';

const GDPRModal = ({ isOpen, onClose, onAccept }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Politique de confidentialité et RGPD</h3>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        aria-label="Fermer"
                    >
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <h4>🔒 Collecte et traitement des données personnelles</h4>
                    <p>
                        Conformément au Règlement Général sur la Protection des Données (RGPD),
                        nous vous informons que nous collectons les données suivantes :
                    </p>
                    <ul>
                        <li><strong>Données d'identification :</strong> nom, prénom, pseudo, email</li>
                        <li><strong>Photo de profil :</strong> optionnelle</li>
                        <li><strong>Données d'usage :</strong> statistiques de navigation anonymisées pour améliorer nos services</li>
                    </ul>

                    <h4>🎯 Finalité du traitement</h4>
                    <p>Vos données sont utilisées exclusivement pour :</p>
                    <ul>
                        <li>Créer et gérer votre compte utilisateur</li>
                        <li>Vous permettre d'utiliser les services Atlas</li>
                        <li>Améliorer la qualité de nos services par l'analyse d'usage anonymisée</li>
                        <li>Respecter nos obligations légales</li>
                    </ul>

                    <h4>⚖️ Vos droits</h4>
                    <p>Vous disposez des droits suivants :</p>
                    <ul>
                        <li><strong>Droit d'accès :</strong> connaître les données que nous détenons sur vous</li>
                        <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
                        <li><strong>Droit de suppression :</strong> demander l'effacement de vos données</li>
                        <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format lisible</li>
                        <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                        <li><strong>Droit de retrait :</strong> retirer votre consentement à tout moment</li>
                    </ul>

                    <h4>🕐 Conservation des données</h4>
                    <p>
                        Vos données sont conservées pendant la durée nécessaire aux finalités
                        pour lesquelles elles sont traitées, et au maximum <strong>3 ans</strong> après
                        la dernière connexion à votre compte.
                    </p>

                    <h4>🔐 Sécurité</h4>
                    <p>
                        Nous mettons en place des mesures techniques et organisationnelles
                        appropriées pour protéger vos données conformément aux recommandations
                        de l'ANSSI (Agence nationale de la sécurité des systèmes d'information).
                    </p>

                    <h4>📧 Contact</h4>
                    <p>
                        Pour exercer vos droits ou pour toute question relative à la protection
                        de vos données, contactez-nous à : <strong>konateadam265@gmail.com</strong>
                    </p>

                    <div className="legal-note">
                        <small>
                            <strong>Note :</strong> Ce site collecte uniquement les données strictement
                            nécessaires à son fonctionnement. Aucune donnée n'est vendue ou partagée
                            avec des tiers à des fins commerciales.
                        </small>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Refuser
                    </button>
                    <button className="btn-primary" onClick={onAccept}>
                        Accepter
                    </button>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    padding: 1rem;
                }

                .modal-content {
                    background: white;
                    border-radius: 8px;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    animation: slideIn 0.3s ease-out;
                }

                @keyframes slideIn {
                    from {
                        transform: translateY(-50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid #e0e0e0;
                    background: #f8f9fa;
                }

                .modal-header h3 {
                    margin: 0;
                    color: #1c2a28;
                    font-size: 1.25rem;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                    padding: 0.25rem;
                    line-height: 1;
                    border-radius: 50%;
                    transition: all 0.2s;
                }

                .close-btn:hover {
                    color: #333;
                    background: #e9ecef;
                }

                .modal-body {
                    padding: 1.5rem;
                    line-height: 1.6;
                }

                .modal-body h4 {
                    color: #1c2a28;
                    margin-top: 1.5rem;
                    margin-bottom: 0.5rem;
                    font-size: 1.1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .modal-body h4:first-child {
                    margin-top: 0;
                }

                .modal-body ul {
                    margin: 0.5rem 0;
                    padding-left: 1.5rem;
                }

                .modal-body li {
                    margin-bottom: 0.5rem;
                }

                .legal-note {
                    background: #f8f9fa;
                    border-left: 4px solid #F3CB23;
                    padding: 1rem;
                    margin-top: 1.5rem;
                    border-radius: 0 4px 4px 0;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    padding: 1.5rem;
                    border-top: 1px solid #e0e0e0;
                    background: #f8f9fa;
                }

                .btn-primary {
                    padding: 0.75rem 1.5rem;
                    background: #F3CB23;
                    color: #1c2a28;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .btn-primary:hover {
                    background: #d4af1f;
                    transform: translateY(-1px);
                }

                .btn-secondary {
                    padding: 0.75rem 1.5rem;
                    background: transparent;
                    color: #6c757d;
                    border: 1px solid #6c757d;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-secondary:hover {
                    background: #6c757d;
                    color: white;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .modal-content {
                        margin: 1rem;
                        max-height: 90vh;
                    }

                    .modal-header,
                    .modal-body,
                    .modal-footer {
                        padding: 1rem;
                    }

                    .modal-footer {
                        flex-direction: column;
                    }

                    .modal-header h3 {
                        font-size: 1.1rem;
                    }
                }

                /* Accessibilité */
                @media (prefers-reduced-motion: reduce) {
                    .modal-content {
                        animation: none;
                    }
                }

                /* Mode sombre */
                @media (prefers-color-scheme: dark) {
                    .modal-content {
                        background: #2d2d2d;
                        color: #f0f0f0;
                    }

                    .modal-header,
                    .modal-footer,
                    .legal-note {
                        background: #1a1a1a;
                    }

                    .modal-header {
                        border-bottom-color: #444;
                    }

                    .modal-footer {
                        border-top-color: #444;
                    }
                }
            `}</style>
        </div>
    );
};

export default GDPRModal;