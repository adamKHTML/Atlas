import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useCreateNotificationMutation, useGetUsersListQuery } from '../../api/endpoints/notifications';

const NotificationModal = ({ onClose, onSuccess }) => {
    const currentUser = useSelector(selectUser);
    const [selectedRecipient, setSelectedRecipient] = useState('');
    const [message, setMessage] = useState('');
    const [isBulkMessage, setIsBulkMessage] = useState(false);
    const [errors, setErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const { data: usersData, isLoading: usersLoading } = useGetUsersListQuery();
    const [createNotification, { isLoading: isSending }] = useCreateNotificationMutation();

    const canSendBulk = currentUser && currentUser.roles.includes('ROLE_ADMIN');

    // Filtrer les utilisateurs selon la recherche
    const filteredUsers = usersData?.users?.filter(user =>
        user.id !== currentUser?.id &&
        (searchTerm === '' ||
            user.pseudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${user.firstname} ${user.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    const selectedUser = usersData?.users?.find(user => user.id === selectedRecipient);

    const handleSubmit = async (e) => {
        e.preventDefault();
        let newErrors = {};

        if (!isBulkMessage && !selectedRecipient) {
            newErrors.recipient = "Veuillez choisir un destinataire.";
        }
        if (!message.trim()) {
            newErrors.message = "Le message ne peut pas être vide.";
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            if (isBulkMessage) {
                // Envoi en masse
                await createNotification({
                    recipient_id: 'all',
                    type_notification: 'message',
                    content_notification: message.trim()
                }).unwrap();
            } else {
                // Envoi individuel
                await createNotification({
                    recipient_id: selectedRecipient,
                    type_notification: 'message',
                    content_notification: message.trim()
                }).unwrap();
            }

            setMessage('');
            setSelectedRecipient('');
            setIsBulkMessage(false);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setErrors({ submit: "Erreur lors de l'envoi du message." });
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            backdropFilter: 'blur(8px)'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                width: '100%',
                maxWidth: '650px',
                maxHeight: '85vh',
                overflow: 'hidden',
                animation: 'modalSlideIn 0.3s ease-out'
            }}>
                {/* Header avec gradient */}
                <div style={{
                    padding: '24px 28px',
                    background: 'linear-gradient(135deg, #374640 0%, #2d3a32 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <h3 style={{
                            margin: '0 0 6px 0',
                            fontSize: '22px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            ✨ Nouvelle conversation
                        </h3>
                        <p style={{
                            margin: 0,
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '14px'
                        }}>
                            Démarrez une conversation avec un membre d'Atlas
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            width: '36px',
                            height: '36px',
                            cursor: 'pointer',
                            color: 'white',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Contenu avec scroll */}
                <div style={{
                    maxHeight: 'calc(85vh - 120px)',
                    overflow: 'auto'
                }}>
                    <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
                        {/* Option envoi en masse pour admin */}
                        {canSendBulk && (
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    padding: '16px',
                                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                    border: '2px solid #bae6fd',
                                    borderRadius: '12px',
                                    transition: 'all 0.2s'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={isBulkMessage}
                                        onChange={e => {
                                            setIsBulkMessage(e.target.checked);
                                            setSelectedRecipient('');
                                            setErrors({});
                                        }}
                                        style={{
                                            margin: 0,
                                            width: '16px',
                                            height: '16px',
                                            accentColor: '#0369a1'
                                        }}
                                    />
                                    <div>
                                        <span style={{
                                            fontWeight: '600',
                                            color: '#0369a1',
                                            fontSize: '15px'
                                        }}>
                                            📢 Envoyer à tous les membres
                                        </span>
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#0c4a6e',
                                            marginTop: '2px'
                                        }}>
                                            Message de diffusion générale (Admin uniquement)
                                        </div>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Sélection destinataire */}
                        {!isBulkMessage && (
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '12px',
                                    fontWeight: '600',
                                    color: '#374640',
                                    fontSize: '15px'
                                }}>
                                    Destinataire *
                                </label>

                                {/* Barre de recherche */}
                                <div style={{ marginBottom: '12px' }}>
                                    <input
                                        type="text"
                                        placeholder="Rechercher un utilisateur..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '10px',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#374640';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e5e7eb';
                                        }}
                                    />
                                </div>

                                {usersLoading ? (
                                    <div style={{
                                        padding: '20px',
                                        textAlign: 'center',
                                        color: '#6b7280',
                                        border: '2px dashed #d1d5db',
                                        borderRadius: '10px',
                                        backgroundColor: '#f9fafb'
                                    }}>
                                        🔄 Chargement des utilisateurs...
                                    </div>
                                ) : (
                                    <div style={{
                                        border: `2px solid ${errors.recipient ? '#ef4444' : '#e5e7eb'}`,
                                        borderRadius: '10px',
                                        maxHeight: '200px',
                                        overflow: 'auto',
                                        backgroundColor: '#f9fafb'
                                    }}>
                                        {filteredUsers.length === 0 ? (
                                            <div style={{
                                                padding: '20px',
                                                textAlign: 'center',
                                                color: '#6b7280'
                                            }}>
                                                {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                                            </div>
                                        ) : (
                                            filteredUsers.map(user => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => setSelectedRecipient(user.id)}
                                                    style={{
                                                        padding: '12px 16px',
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedRecipient === user.id ? '#ECF3F0' : 'transparent',
                                                        borderBottom: '1px solid #e5e7eb',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        if (selectedRecipient !== user.id) {
                                                            e.target.style.backgroundColor = '#f3f4f6';
                                                        }
                                                    }}
                                                    onMouseOut={(e) => {
                                                        if (selectedRecipient !== user.id) {
                                                            e.target.style.backgroundColor = 'transparent';
                                                        }
                                                    }}
                                                >
                                                    {/* Avatar */}
                                                    {user.profile_picture ? (
                                                        <img
                                                            src={user.profile_picture}
                                                            alt={user.pseudo}
                                                            style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                borderRadius: '50%',
                                                                objectFit: 'cover',
                                                                border: '2px solid #ECF3F0'
                                                            }}
                                                        />
                                                    ) : (
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #374640 0%, #10b981 100%)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '16px',
                                                            color: 'white',
                                                            fontWeight: '600',
                                                            border: '2px solid #ECF3F0'
                                                        }}>
                                                            {user.pseudo.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}

                                                    {/* Info utilisateur */}
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{
                                                            fontWeight: '600',
                                                            color: '#374640',
                                                            fontSize: '14px'
                                                        }}>
                                                            {user.firstname} {user.lastname}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '12px',
                                                            color: '#6b7280'
                                                        }}>
                                                            @{user.pseudo} • {user.main_role}
                                                        </div>
                                                    </div>

                                                    {/* Indicateur de sélection */}
                                                    {selectedRecipient === user.id && (
                                                        <div style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            borderRadius: '50%',
                                                            backgroundColor: '#10b981',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontSize: '12px'
                                                        }}>
                                                            ✓
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {errors.recipient && (
                                    <p style={{
                                        color: '#ef4444',
                                        fontSize: '13px',
                                        margin: '8px 0 0 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        ⚠️ {errors.recipient}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Preview destinataire sélectionné */}
                        {selectedUser && !isBulkMessage && (
                            <div style={{
                                marginBottom: '24px',
                                padding: '16px',
                                background: 'linear-gradient(135deg, #ECF3F0 0%, #f0fdf4 100%)',
                                borderRadius: '12px',
                                border: '2px solid #bbf7d0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}>
                                {selectedUser.profile_picture ? (
                                    <img
                                        src={selectedUser.profile_picture}
                                        alt={selectedUser.pseudo}
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '3px solid #10b981'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #374640 0%, #10b981 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        color: 'white',
                                        fontWeight: '600',
                                        border: '3px solid #10b981'
                                    }}>
                                        {selectedUser.pseudo.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <div style={{
                                        fontWeight: '600',
                                        color: '#374640',
                                        fontSize: '16px',
                                        marginBottom: '2px'
                                    }}>
                                        {selectedUser.firstname} {selectedUser.lastname}
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        color: '#059669',
                                        marginBottom: '2px'
                                    }}>
                                        @{selectedUser.pseudo}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        display: 'inline-block'
                                    }}>
                                        {selectedUser.main_role}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Info envoi en masse */}
                        {isBulkMessage && (
                            <div style={{
                                marginBottom: '24px',
                                padding: '16px',
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                borderRadius: '12px',
                                border: '2px solid #f59e0b',
                                color: '#92400e'
                            }}>
                                <div style={{
                                    fontWeight: '600',
                                    marginBottom: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    📢 Mode diffusion activé
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    lineHeight: '1.5'
                                }}>
                                    Votre message sera envoyé à tous les membres vérifiés d'Atlas.
                                    Assurez-vous que le contenu respecte nos règles de communication.
                                </div>
                            </div>
                        )}

                        {/* Zone de message */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '12px',
                                fontWeight: '600',
                                color: '#374640',
                                fontSize: '15px'
                            }}>
                                Message *
                            </label>
                            <div style={{
                                border: `2px solid ${errors.message ? '#ef4444' : '#e5e7eb'}`,
                                borderRadius: '12px',
                                overflow: 'hidden',
                                backgroundColor: '#f9fafb'
                            }}>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        border: 'none',
                                        fontSize: '14px',
                                        backgroundColor: 'transparent',
                                        outline: 'none',
                                        resize: 'vertical',
                                        minHeight: '100px',
                                        fontFamily: 'inherit',
                                        lineHeight: '1.5'
                                    }}
                                    placeholder={isBulkMessage ?
                                        "Rédigez votre message de diffusion..." :
                                        "Tapez votre message..."}
                                />
                                <div style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'rgba(255,255,255,0.5)',
                                    borderTop: '1px solid #e5e7eb',
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span>💡 Tip: Utilisez Shift+Entrée pour une nouvelle ligne</span>
                                    <span>{message.length}/1000</span>
                                </div>
                            </div>
                            {errors.message && (
                                <p style={{
                                    color: '#ef4444',
                                    fontSize: '13px',
                                    margin: '8px 0 0 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    ⚠️ {errors.message}
                                </p>
                            )}
                        </div>

                        {/* Erreurs de soumission */}
                        {errors.submit && (
                            <div style={{
                                color: '#dc2626',
                                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                border: '2px solid #f87171',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                marginBottom: '20px',
                                textAlign: 'center',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}>
                                ❌ {errors.submit}
                            </div>
                        )}

                        {/* Boutons d'action */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            paddingTop: '16px',
                            borderTop: '1px solid #e5e7eb'
                        }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                ✕ Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isSending}
                                style={{
                                    padding: '12px 24px',
                                    background: isSending ?
                                        'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' :
                                        'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: '600',
                                    cursor: isSending ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    opacity: isSending ? 0.8 : 1,
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                                }}
                                onMouseOver={(e) => {
                                    if (!isSending) {
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isSending) {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                                    }
                                }}
                            >
                                {isSending ? "⏳ Envoi..." :
                                    isBulkMessage ? "📢 Envoyer à tous" : "💬 Envoyer"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Styles pour l'animation */}
            <style>
                {`
                    @keyframes modalSlideIn {
                        from {
                            opacity: 0;
                            transform: translateY(-20px) scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default NotificationModal;