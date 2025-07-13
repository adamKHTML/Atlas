import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useBanUserMutation } from '../../api/endpoints/admin/gestuser';


const BanUserModal = ({ user, onClose, onSuccess }) => {
    const currentUser = useSelector(selectUser);
    const [duration, setDuration] = useState(1);
    const [reason, setReason] = useState('');
    const [notifyUser, setNotifyUser] = useState(true);
    const [errors, setErrors] = useState({});

    const [banUser, { isLoading }] = useBanUserMutation();

    // Durées prédéfinies
    const durations = [
        { value: 1, label: '1 jour', description: 'Avertissement léger' },
        { value: 3, label: '3 jours', description: 'Infraction mineure' },
        { value: 7, label: '1 semaine', description: 'Comportement inapproprié' },
        { value: 14, label: '2 semaines', description: 'Infraction modérée' },
        { value: 30, label: '1 mois', description: 'Infraction grave' },
        { value: 90, label: '3 mois', description: 'Infraction très grave' },
        { value: 180, label: '6 mois', description: 'Comportement récidiviste' },
        { value: 365, label: '1 an', description: 'Infraction majeure' }
    ];

    // Raisons prédéfinies
    const predefinedReasons = [
        'Spam ou contenu indésirable',
        'Harcèlement ou intimidation',
        'Discours haineux ou discriminatoire',
        'Violation des règles de la communauté',
        'Contenu inapproprié ou offensant',
        'Usurpation d\'identité',
        'Activité suspecte ou malveillante',
        'Non-respect des conditions d\'utilisation'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        let newErrors = {};

        if (!duration || duration < 1) {
            newErrors.duration = "Veuillez sélectionner une durée valide.";
        }

        if (!reason.trim()) {
            newErrors.reason = "La raison du bannissement est obligatoire.";
        } else if (reason.trim().length < 10) {
            newErrors.reason = "La raison doit contenir au moins 10 caractères.";
        }

        // Vérifier qu'on ne peut pas se bannir soi-même
        if (user.id === currentUser.id) {
            newErrors.submit = "Vous ne pouvez pas vous bannir vous-même.";
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            await banUser({
                userId: user.id,
                duration: duration,
                reason: reason.trim(),
                notify: notifyUser
            }).unwrap();

            if (onSuccess) onSuccess();
        } catch (err) {
            setErrors({ submit: err.data?.error || "Erreur lors du bannissement." });
        }
    };

    const getEndDate = () => {
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + duration);
        return endDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSeverityColor = (days) => {
        if (days <= 3) return '#f59e0b'; // Jaune - léger
        if (days <= 14) return '#ea580c'; // Orange - modéré
        if (days <= 90) return '#dc2626'; // Rouge - grave
        return '#7c2d12'; // Rouge foncé - très grave
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
                maxHeight: '90vh',
                overflow: 'hidden',
                animation: 'modalSlideIn 0.3s ease-out'
            }}>
                {/* Header avec gradient rouge pour bannissement */}
                <div style={{
                    padding: '24px 28px',
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
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
                            🚫 Bannir l'utilisateur
                        </h3>
                        <p style={{
                            margin: 0,
                            color: 'rgba(255,255,255,0.9)',
                            fontSize: '14px'
                        }}>
                            Suspendre temporairement l'accès de {user.firstname} {user.lastname}
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
                    maxHeight: 'calc(90vh - 120px)',
                    overflow: 'auto'
                }}>
                    <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
                        {/* Informations utilisateur */}
                        <div style={{
                            marginBottom: '24px',
                            padding: '20px',
                            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                            borderRadius: '12px',
                            border: '2px solid #f87171',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            {user.profile_picture ? (
                                <img
                                    src={user.profile_picture}
                                    alt={user.pseudo}
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '3px solid #dc2626',
                                        filter: 'grayscale(0.3)'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px',
                                    color: 'white',
                                    fontWeight: '600',
                                    border: '3px solid #dc2626'
                                }}>
                                    {user.pseudo.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontWeight: '600',
                                    color: '#7f1d1d',
                                    fontSize: '18px',
                                    marginBottom: '4px'
                                }}>
                                    {user.firstname} {user.lastname}
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    color: '#991b1b',
                                    marginBottom: '8px'
                                }}>
                                    @{user.pseudo} • {user.email}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span style={{ fontSize: '14px', color: '#7f1d1d' }}>Rôle actuel:</span>
                                    <span style={{
                                        backgroundColor: '#dc2626',
                                        color: 'white',
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>
                                        {user.main_role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Avertissement */}
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
                                ⚠️ Action irréversible
                            </div>
                            <div style={{
                                fontSize: '14px',
                                lineHeight: '1.5'
                            }}>
                                Cette action bannira temporairement l'utilisateur. Il ne pourra plus accéder à Atlas pendant la durée spécifiée.
                                L'utilisateur sera automatiquement notifié si l'option est activée.
                            </div>
                        </div>

                        {/* Sélection de la durée */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '12px',
                                fontWeight: '600',
                                color: '#374640',
                                fontSize: '15px'
                            }}>
                                Durée du bannissement *
                            </label>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: '8px'
                            }}>
                                {durations.map((dur) => (
                                    <div
                                        key={dur.value}
                                        onClick={() => setDuration(dur.value)}
                                        style={{
                                            padding: '12px',
                                            border: `2px solid ${duration === dur.value ? getSeverityColor(dur.value) : '#e5e7eb'}`,
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            backgroundColor: duration === dur.value ? `${getSeverityColor(dur.value)}10` : 'white',
                                            transition: 'all 0.2s',
                                            textAlign: 'center'
                                        }}
                                        onMouseOver={(e) => {
                                            if (duration !== dur.value) {
                                                e.currentTarget.style.backgroundColor = '#f9fafb';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (duration !== dur.value) {
                                                e.currentTarget.style.backgroundColor = 'white';
                                            }
                                        }}
                                    >
                                        <div style={{
                                            fontWeight: '600',
                                            color: duration === dur.value ? getSeverityColor(dur.value) : '#374640',
                                            fontSize: '14px',
                                            marginBottom: '4px'
                                        }}>
                                            {dur.label}
                                        </div>
                                        <div style={{
                                            fontSize: '11px',
                                            color: '#6b7280'
                                        }}>
                                            {dur.description}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Durée personnalisée */}
                            <div style={{
                                marginTop: '12px',
                                padding: '16px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}>
                                    📅 Durée personnalisée:
                                    <input
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                                        style={{
                                            width: '80px',
                                            padding: '6px 8px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            textAlign: 'center'
                                        }}
                                    />
                                    jour{duration > 1 ? 's' : ''}
                                </label>
                            </div>

                            {errors.duration && (
                                <p style={{
                                    color: '#ef4444',
                                    fontSize: '13px',
                                    margin: '8px 0 0 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    ⚠️ {errors.duration}
                                </p>
                            )}
                        </div>

                        {/* Aperçu de la fin du ban */}
                        {duration && (
                            <div style={{
                                marginBottom: '24px',
                                padding: '16px',
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                borderRadius: '12px',
                                border: '2px solid #bae6fd',
                                color: '#0c4a6e'
                            }}>
                                <div style={{
                                    fontWeight: '600',
                                    marginBottom: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    📅 Fin du bannissement
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    lineHeight: '1.5'
                                }}>
                                    L'utilisateur sera débanni automatiquement le <strong>{getEndDate()}</strong>
                                    {duration >= 30 && (
                                        <div style={{ marginTop: '8px', fontStyle: 'italic', fontSize: '13px' }}>
                                            ⚠️ Bannissement de longue durée - Vérifiez que la sanction est proportionnelle
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Raison du bannissement */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '12px',
                                fontWeight: '600',
                                color: '#374640',
                                fontSize: '15px'
                            }}>
                                Raison du bannissement *
                            </label>

                            {/* Raisons prédéfinies */}
                            <div style={{
                                marginBottom: '12px',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px'
                            }}>
                                {predefinedReasons.map((predefinedReason, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setReason(predefinedReason)}
                                        style={{
                                            backgroundColor: reason === predefinedReason ? '#dc2626' : '#f3f4f6',
                                            color: reason === predefinedReason ? 'white' : '#374640',
                                            border: 'none',
                                            borderRadius: '20px',
                                            padding: '6px 12px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => {
                                            if (reason !== predefinedReason) {
                                                e.target.style.backgroundColor = '#e5e7eb';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (reason !== predefinedReason) {
                                                e.target.style.backgroundColor = '#f3f4f6';
                                            }
                                        }}
                                    >
                                        {predefinedReason}
                                    </button>
                                ))}
                            </div>

                            {/* Zone de texte personnalisée */}
                            <div style={{
                                border: `2px solid ${errors.reason ? '#ef4444' : '#e5e7eb'}`,
                                borderRadius: '12px',
                                overflow: 'hidden',
                                backgroundColor: '#f9fafb'
                            }}>
                                <textarea
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        border: 'none',
                                        fontSize: '14px',
                                        backgroundColor: 'transparent',
                                        outline: 'none',
                                        resize: 'vertical',
                                        minHeight: '80px',
                                        fontFamily: 'inherit',
                                        lineHeight: '1.5'
                                    }}
                                    placeholder="Décrivez précisément la raison du bannissement..."
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
                                    <span>💡 Soyez précis pour justifier la sanction</span>
                                    <span>{reason.length}/500</span>
                                </div>
                            </div>

                            {errors.reason && (
                                <p style={{
                                    color: '#ef4444',
                                    fontSize: '13px',
                                    margin: '8px 0 0 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    ⚠️ {errors.reason}
                                </p>
                            )}
                        </div>

                        {/* Option de notification */}
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
                                    checked={notifyUser}
                                    onChange={e => setNotifyUser(e.target.checked)}
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
                                        📨 Notifier l'utilisateur
                                    </span>
                                    <div style={{
                                        fontSize: '13px',
                                        color: '#0c4a6e',
                                        marginTop: '2px'
                                    }}>
                                        Envoyer une notification expliquant le bannissement et sa durée
                                    </div>
                                </div>
                            </label>
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
                                disabled={isLoading || !reason.trim()}
                                style={{
                                    padding: '12px 24px',
                                    background: isLoading || !reason.trim() ?
                                        'linear-gradient(135deg, #fecaca 0%, #f87171 100%)' :
                                        'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: '600',
                                    cursor: isLoading || !reason.trim() ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    opacity: isLoading || !reason.trim() ? 0.8 : 1,
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                                }}
                                onMouseOver={(e) => {
                                    if (!isLoading && reason.trim()) {
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isLoading && reason.trim()) {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.3)';
                                    }
                                }}
                            >
                                {isLoading ? "⏳ Bannissement..." : "🚫 Bannir l'utilisateur"}
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

export default BanUserModal;