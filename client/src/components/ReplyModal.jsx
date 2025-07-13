import React, { useState } from 'react';
import { useReplyToMessageMutation } from '../../api/endpoints/notifications';

const ReplyModal = ({ notification, onClose, onSuccess }) => {
    const [replyContent, setReplyContent] = useState('');
    const [errors, setErrors] = useState({});
    const [replyToMessage] = useReplyToMessageMutation();

    if (!notification) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!replyContent.trim()) {
            setErrors({ content: 'Le contenu de la réponse est requis' });
            return;
        }

        try {
            await replyToMessage({
                originalMessageId: notification.id,
                recipientId: notification.sender?.id,
                content: replyContent.trim()
            }).unwrap();

            onSuccess?.();
            onClose();
        } catch (error) {
            setErrors({ submit: error.data?.error || 'Erreur lors de l\'envoi de la réponse' });
        }
    };

    // Nettoyer le contenu original pour l'affichage
    const cleanOriginalContent = (content) => {
        if (!content) return '';
        return content.replace(/\[SENDER:\d+\]\[SENDER_DATA:[A-Za-z0-9+/=]+\]/g, '').trim();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '80vh',
                overflow: 'auto'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <h3 style={{
                            margin: '0 0 4px 0',
                            color: '#2E3830',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            💬 Répondre au message
                        </h3>
                        <p style={{
                            margin: 0,
                            color: '#666',
                            fontSize: '14px'
                        }}>
                            Réponse à {notification.sender?.pseudo || 'Utilisateur inconnu'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#666',
                            padding: '4px'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Contenu */}
                <div style={{ padding: '24px' }}>
                    {/* Message original */}
                    <div style={{
                        marginBottom: '20px',
                        padding: '16px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0'
                    }}>
                        <div style={{
                            fontSize: '12px',
                            color: '#666',
                            marginBottom: '8px',
                            fontWeight: 'bold'
                        }}>
                            📧 Message original de {notification.sender?.pseudo}:
                        </div>
                        <div style={{
                            fontSize: '14px',
                            color: '#2E3830',
                            lineHeight: '1.5',
                            fontStyle: 'italic'
                        }}>
                            "{cleanOriginalContent(notification.content_notification)}"
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: '#999',
                            marginTop: '8px'
                        }}>
                            Reçu {notification.created_at_formatted}
                        </div>
                    </div>

                    {/* Informations sur l'expéditeur */}
                    {notification.sender && (
                        <div style={{
                            marginBottom: '20px',
                            padding: '12px',
                            backgroundColor: '#f0f9ff',
                            borderRadius: '6px',
                            border: '1px solid #bae6fd',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            {notification.sender.profile_picture ? (
                                <img
                                    src={`http://localhost:8000${notification.sender.profile_picture}`}
                                    alt={notification.sender.pseudo}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: '#ddd',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px'
                                }}>
                                    👤
                                </div>
                            )}
                            <div>
                                <div style={{
                                    fontWeight: 'bold',
                                    color: '#0369a1'
                                }}>
                                    Réponse à: {notification.sender.pseudo}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#666'
                                }}>
                                    Votre réponse sera envoyée à cet utilisateur
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Formulaire de réponse */}
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: 'bold',
                                color: '#2E3830'
                            }}>
                                Votre réponse *
                            </label>
                            <textarea
                                value={replyContent}
                                onChange={(e) => {
                                    setReplyContent(e.target.value);
                                    if (errors.content) {
                                        setErrors(prev => ({ ...prev, content: '' }));
                                    }
                                }}
                                placeholder="Écrivez votre réponse ici..."
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: `1px solid ${errors.content ? '#EF4444' : '#ddd'}`,
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                            {errors.content && (
                                <p style={{
                                    color: '#EF4444',
                                    fontSize: '12px',
                                    margin: '4px 0 0 0'
                                }}>
                                    {errors.content}
                                </p>
                            )}

                            {/* Compteur de caractères */}
                            <div style={{
                                textAlign: 'right',
                                fontSize: '12px',
                                color: '#666',
                                marginTop: '4px'
                            }}>
                                {replyContent.length} caractères
                            </div>
                        </div>

                        {/* Erreur générale */}
                        {errors.submit && (
                            <div style={{
                                marginBottom: '16px',
                                padding: '12px',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                color: '#dc2626',
                                fontSize: '14px'
                            }}>
                                {errors.submit}
                            </div>
                        )}

                        {/* Boutons */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: '#666',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '10px 20px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                style={{
                                    backgroundColor: '#F3CB23',
                                    color: '#2E3830',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '10px 20px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                💬 Envoyer la réponse
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReplyModal;