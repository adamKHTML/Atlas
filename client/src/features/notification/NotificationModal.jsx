import React, { useState, useEffect } from 'react';
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
    const [screenSize, setScreenSize] = useState({
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024
    });

    const { data: usersData, isLoading: usersLoading } = useGetUsersListQuery();
    const [createNotification, { isLoading: isSending }] = useCreateNotificationMutation();

    const canSendBulk = currentUser && currentUser.roles.includes('ROLE_ADMIN');

    // Gérer le redimensionnement responsive
    useEffect(() => {
        const handleResize = () => {
            setScreenSize({
                isMobile: window.innerWidth < 768,
                isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
                isDesktop: window.innerWidth >= 1024
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Empêcher le scroll du body quand le modal est ouvert
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

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
        if (message.length > 1000) {
            newErrors.message = "Le message ne peut pas dépasser 1000 caractères.";
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            if (isBulkMessage) {
                await createNotification({
                    recipient_id: 'all',
                    type_notification: 'message',
                    content_notification: message.trim()
                }).unwrap();
            } else {
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

    // Styles responsifs
    const modalStyles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: screenSize.isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: screenSize.isMobile ? '0' : '20px',
            backdropFilter: 'blur(8px)'
        },
        container: {
            backgroundColor: 'white',
            borderRadius: screenSize.isMobile ? '20px 20px 0 0' : '16px',
            boxShadow: screenSize.isMobile
                ? '0 -10px 40px rgba(0, 0, 0, 0.3)'
                : '0 20px 40px rgba(0, 0, 0, 0.3)',
            width: '100%',
            maxWidth: screenSize.isMobile ? '100%' : '650px',
            maxHeight: screenSize.isMobile ? '90vh' : '85vh',
            overflow: 'hidden',
            animation: screenSize.isMobile ? 'modalSlideUp 0.3s ease-out' : 'modalSlideIn 0.3s ease-out',
            ...(screenSize.isMobile && {
                position: 'fixed',
                bottom: 0,
                borderRadius: '20px 20px 0 0'
            })
        },
        header: {
            padding: screenSize.isMobile ? '20px 20px' : '24px 28px',
            background: 'linear-gradient(135deg, #374640 0%, #2d3a32 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        headerTitle: {
            margin: '0 0 6px 0',
            fontSize: screenSize.isMobile ? '18px' : '22px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        headerSubtitle: {
            margin: 0,
            color: 'rgba(255,255,255,0.8)',
            fontSize: screenSize.isMobile ? '13px' : '14px'
        },
        content: {
            maxHeight: screenSize.isMobile ? 'calc(90vh - 100px)' : 'calc(85vh - 120px)',
            overflow: 'auto'
        },
        form: {
            padding: screenSize.isMobile ? '20px' : '28px'
        },
        userList: {
            border: `2px solid ${errors.recipient ? '#ef4444' : '#e5e7eb'}`,
            borderRadius: '10px',
            maxHeight: screenSize.isMobile ? '150px' : '200px',
            overflow: 'auto',
            backgroundColor: '#f9fafb'
        },
        userItem: {
            padding: screenSize.isMobile ? '10px 12px' : '12px 16px',
            cursor: 'pointer',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: screenSize.isMobile ? '10px' : '12px',
            transition: 'all 0.2s'
        },
        avatar: {
            width: screenSize.isMobile ? '35px' : '40px',
            height: screenSize.isMobile ? '35px' : '40px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #ECF3F0'
        },
        avatarPlaceholder: {
            width: screenSize.isMobile ? '35px' : '40px',
            height: screenSize.isMobile ? '35px' : '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #374640 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: screenSize.isMobile ? '14px' : '16px',
            color: 'white',
            fontWeight: '600',
            border: '2px solid #ECF3F0'
        },
        userName: {
            fontWeight: '600',
            color: '#374640',
            fontSize: screenSize.isMobile ? '13px' : '14px'
        },
        userMeta: {
            fontSize: screenSize.isMobile ? '11px' : '12px',
            color: '#6b7280'
        },
        textarea: {
            width: '100%',
            padding: screenSize.isMobile ? '12px' : '16px',
            border: 'none',
            fontSize: screenSize.isMobile ? '15px' : '14px',
            backgroundColor: 'transparent',
            outline: 'none',
            resize: 'vertical',
            minHeight: screenSize.isMobile ? '80px' : '100px',
            fontFamily: 'inherit',
            lineHeight: '1.5'
        },
        buttonContainer: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: screenSize.isMobile ? '8px' : '12px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb',
            flexDirection: screenSize.isMobile ? 'column-reverse' : 'row'
        },
        button: {
            padding: screenSize.isMobile ? '14px 20px' : '12px 24px',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: screenSize.isMobile ? '15px' : '14px',
            transition: 'all 0.2s',
            width: screenSize.isMobile ? '100%' : 'auto'
        }
    };
    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.container}>
                {/* Header avec gradient */}
                <div style={modalStyles.header}>
                    <div>
                        <h3 style={modalStyles.headerTitle}>
                            ✨ Nouvelle conversation
                        </h3>
                        <p style={modalStyles.headerSubtitle}>
                            Démarrez une conversation avec un membre d'Atlas
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            width: screenSize.isMobile ? '32px' : '36px',
                            height: screenSize.isMobile ? '32px' : '36px',
                            cursor: 'pointer',
                            color: 'white',
                            fontSize: screenSize.isMobile ? '16px' : '18px',
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
                <div style={modalStyles.content}>
                    <form onSubmit={handleSubmit} style={modalStyles.form}>
                        {/* Option envoi en masse pour admin */}
                        {canSendBulk && (
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: screenSize.isMobile ? '8px' : '12px',
                                    cursor: 'pointer',
                                    padding: screenSize.isMobile ? '12px' : '16px',
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
                                            fontSize: screenSize.isMobile ? '14px' : '15px'
                                        }}>
                                            📢 Envoyer à tous les membres
                                        </span>
                                        <div style={{
                                            fontSize: screenSize.isMobile ? '12px' : '13px',
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
                                    fontSize: screenSize.isMobile ? '14px' : '15px'
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
                                            padding: screenSize.isMobile ? '10px 14px' : '12px 16px',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '10px',
                                            fontSize: screenSize.isMobile ? '15px' : '14px',
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
                                        backgroundColor: '#f9fafb',
                                        fontSize: screenSize.isMobile ? '14px' : '16px'
                                    }}>
                                        🔄 Chargement des utilisateurs...
                                    </div>
                                ) : (
                                    <div style={modalStyles.userList}>
                                        {filteredUsers.length === 0 ? (
                                            <div style={{
                                                padding: '20px',
                                                textAlign: 'center',
                                                color: '#6b7280',
                                                fontSize: screenSize.isMobile ? '14px' : '16px'
                                            }}>
                                                {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                                            </div>
                                        ) : (
                                            filteredUsers.map(user => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => setSelectedRecipient(user.id)}
                                                    style={{
                                                        ...modalStyles.userItem,
                                                        backgroundColor: selectedRecipient === user.id ? '#ECF3F0' : 'transparent'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        if (selectedRecipient !== user.id) {
                                                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                                                        }
                                                    }}
                                                    onMouseOut={(e) => {
                                                        if (selectedRecipient !== user.id) {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }
                                                    }}
                                                >
                                                    {/* Avatar */}
                                                    {user.profile_picture ? (
                                                        <img
                                                            src={user.profile_picture}
                                                            alt={user.pseudo}
                                                            style={modalStyles.avatar}
                                                        />
                                                    ) : (
                                                        <div style={modalStyles.avatarPlaceholder}>
                                                            {user.pseudo.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}

                                                    {/* Info utilisateur */}
                                                    <div style={{ flex: 1 }}>
                                                        <div style={modalStyles.userName}>
                                                            {user.firstname} {user.lastname}
                                                        </div>
                                                        <div style={modalStyles.userMeta}>
                                                            @{user.pseudo} • {user.main_role}
                                                        </div>
                                                    </div>

                                                    {/* Indicateur de sélection */}
                                                    {selectedRecipient === user.id && (
                                                        <div style={{
                                                            width: screenSize.isMobile ? '18px' : '20px',
                                                            height: screenSize.isMobile ? '18px' : '20px',
                                                            borderRadius: '50%',
                                                            backgroundColor: '#10b981',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontSize: screenSize.isMobile ? '10px' : '12px'
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
                                        fontSize: screenSize.isMobile ? '12px' : '13px',
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
                                padding: screenSize.isMobile ? '12px' : '16px',
                                background: 'linear-gradient(135deg, #ECF3F0 0%, #f0fdf4 100%)',
                                borderRadius: '12px',
                                border: '2px solid #bbf7d0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: screenSize.isMobile ? '12px' : '16px'
                            }}>
                                {selectedUser.profile_picture ? (
                                    <img
                                        src={selectedUser.profile_picture}
                                        alt={selectedUser.pseudo}
                                        style={{
                                            width: screenSize.isMobile ? '48px' : '56px',
                                            height: screenSize.isMobile ? '48px' : '56px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '3px solid #10b981'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: screenSize.isMobile ? '48px' : '56px',
                                        height: screenSize.isMobile ? '48px' : '56px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #374640 0%, #10b981 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: screenSize.isMobile ? '20px' : '24px',
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
                                        fontSize: screenSize.isMobile ? '14px' : '16px',
                                        marginBottom: '2px'
                                    }}>
                                        {selectedUser.firstname} {selectedUser.lastname}
                                    </div>
                                    <div style={{
                                        fontSize: screenSize.isMobile ? '12px' : '14px',
                                        color: '#059669',
                                        marginBottom: '2px'
                                    }}>
                                        @{selectedUser.pseudo}
                                    </div>
                                    <div style={{
                                        fontSize: screenSize.isMobile ? '11px' : '12px',
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
                                padding: screenSize.isMobile ? '12px' : '16px',
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
                                    gap: '8px',
                                    fontSize: screenSize.isMobile ? '14px' : '16px'
                                }}>
                                    📢 Mode diffusion activé
                                </div>
                                <div style={{
                                    fontSize: screenSize.isMobile ? '12px' : '14px',
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
                                fontSize: screenSize.isMobile ? '14px' : '15px'
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
                                    style={modalStyles.textarea}
                                    placeholder={isBulkMessage ?
                                        "Rédigez votre message de diffusion..." :
                                        "Tapez votre message..."}
                                />
                                <div style={{
                                    padding: screenSize.isMobile ? '6px 12px' : '8px 16px',
                                    backgroundColor: 'rgba(255,255,255,0.5)',
                                    borderTop: '1px solid #e5e7eb',
                                    fontSize: screenSize.isMobile ? '11px' : '12px',
                                    color: '#6b7280',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexDirection: screenSize.isMobile ? 'column' : 'row',
                                    gap: screenSize.isMobile ? '4px' : '0'
                                }}>
                                    <span>💡 Tip: Utilisez Shift+Entrée pour une nouvelle ligne</span>
                                    <span style={{
                                        color: message.length > 900 ? '#ef4444' : '#6b7280',
                                        fontWeight: message.length > 900 ? '600' : 'normal'
                                    }}>
                                        {message.length}/1000
                                    </span>
                                </div>
                            </div>
                            {errors.message && (
                                <p style={{
                                    color: '#ef4444',
                                    fontSize: screenSize.isMobile ? '12px' : '13px',
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
                                padding: screenSize.isMobile ? '10px 12px' : '12px 16px',
                                marginBottom: '20px',
                                textAlign: 'center',
                                fontSize: screenSize.isMobile ? '13px' : '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}>
                                ❌ {errors.submit}
                            </div>
                        )}

                        {/* Boutons d'action */}
                        <div style={modalStyles.buttonContainer}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    ...modalStyles.button,
                                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                                    color: '#374151'
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
                                    ...modalStyles.button,
                                    background: isSending ?
                                        'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' :
                                        'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#fff',
                                    opacity: isSending ? 0.8 : 1,
                                    cursor: isSending ? 'not-allowed' : 'pointer',
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

            {/* Styles pour les animations */}
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
                    
                    @keyframes modalSlideUp {
                        from {
                            opacity: 0;
                            transform: translateY(100%);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    /* Styles pour la scrollbar sur mobile */
                    @media (max-width: 767px) {
                        ::-webkit-scrollbar {
                            width: 4px;
                        }
                        
                        ::-webkit-scrollbar-track {
                            background: #f1f1f1;
                            border-radius: 2px;
                        }
                        
                        ::-webkit-scrollbar-thumb {
                            background: #374640;
                            border-radius: 2px;
                        }
                        
                        ::-webkit-scrollbar-thumb:hover {
                            background: #2d3a32;
                        }
                    }

                    /* Amélioration des focus states pour mobile */
                    @media (max-width: 767px) {
                        button:focus,
                        input:focus,
                        textarea:focus {
                            outline: 2px solid #374640;
                            outline-offset: 2px;
                        }
                    }

                    /* Animation des avatars */
                    .avatar-container {
                        transition: transform 0.2s ease;
                    }
                    
                    .avatar-container:hover {
                        transform: scale(1.05);
                    }

                    /* Optimisation des transitions pour mobile */
                    @media (max-width: 767px) {
                        * {
                            -webkit-tap-highlight-color: transparent;
                        }
                        
                        button {
                            -webkit-touch-callout: none;
                            -webkit-user-select: none;
                            user-select: none;
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default NotificationModal;