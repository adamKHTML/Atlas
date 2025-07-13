import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useChangeUserRoleMutation } from '../../api/endpoints/admin/gestuser';

const ChangeRoleModal = ({ user, onClose, onSuccess }) => {
    const currentUser = useSelector(selectUser);
    const [selectedRole, setSelectedRole] = useState('');
    const [notifyUser, setNotifyUser] = useState(true);
    const [errors, setErrors] = useState({});

    const [changeUserRole, { isLoading }] = useChangeUserRoleMutation();

    const roles = [
        {
            value: 'ROLE_USER',
            name: 'Utilisateur',
            description: 'Accès de base à la plateforme',
            color: '#6b7280',
            icon: '👤',
            permissions: ['Consulter le contenu', 'Participer aux discussions']
        },
        {
            value: 'ROLE_TRAVELER',
            name: 'Voyageur',
            description: 'Accès aux fonctionnalités de voyage',
            color: '#2563eb',
            icon: '✈️',
            permissions: ['Toutes les permissions utilisateur', 'Créer des guides de voyage', 'Partager des expériences']
        },
        {
            value: 'ROLE_MODERATOR',
            name: 'Modérateur',
            description: 'Pouvoirs de modération',
            color: '#ea580c',
            icon: '🛡️',
            permissions: ['Toutes les permissions voyageur', 'Modérer les contenus', 'Bannir/débannir les utilisateurs']
        },
        {
            value: 'ROLE_ADMIN',
            name: 'Administrateur',
            description: 'Accès complet à l\'administration',
            color: '#dc2626',
            icon: '👑',
            permissions: ['Toutes les permissions', 'Gestion des rôles', 'Administration complète']
        }
    ];

    const getCurrentRole = () => {
        if (user.roles.includes('ROLE_ADMIN')) return 'ROLE_ADMIN';
        if (user.roles.includes('ROLE_MODERATOR')) return 'ROLE_MODERATOR';
        if (user.roles.includes('ROLE_TRAVELER')) return 'ROLE_TRAVELER';
        return 'ROLE_USER';
    };

    const currentRoleValue = getCurrentRole();

    const handleSubmit = async (e) => {
        e.preventDefault();
        let newErrors = {};

        if (!selectedRole) {
            newErrors.role = "Veuillez sélectionner un rôle.";
        }

        if (selectedRole === currentRoleValue) {
            newErrors.role = "Ce rôle est déjà attribué à cet utilisateur.";
        }

        // Empêcher de se rétrograder soi-même
        if (user.id === currentUser.id && selectedRole !== 'ROLE_ADMIN') {
            newErrors.role = "Vous ne pouvez pas changer votre propre rôle d'administrateur.";
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            await changeUserRole({
                userId: user.id,
                newRole: selectedRole,
                notify: notifyUser
            }).unwrap();

            if (onSuccess) onSuccess();
        } catch (err) {
            setErrors({ submit: err.data?.error || "Erreur lors du changement de rôle." });
        }
    };

    const getRoleInfo = (roleValue) => {
        return roles.find(role => role.value === roleValue);
    };

    const currentRoleInfo = getRoleInfo(currentRoleValue);

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
                maxWidth: '700px',
                maxHeight: '90vh',
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
                            👑 Changer le rôle
                        </h3>
                        <p style={{
                            margin: 0,
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '14px'
                        }}>
                            Modifier les permissions de {user.firstname} {user.lastname}
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
                            background: 'linear-gradient(135deg, #ECF3F0 0%, #f0fdf4 100%)',
                            borderRadius: '12px',
                            border: '2px solid #bbf7d0',
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
                                        border: '3px solid #10b981'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #374640 0%, #10b981 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px',
                                    color: 'white',
                                    fontWeight: '600',
                                    border: '3px solid #10b981'
                                }}>
                                    {user.pseudo.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontWeight: '600',
                                    color: '#374640',
                                    fontSize: '18px',
                                    marginBottom: '4px'
                                }}>
                                    {user.firstname} {user.lastname}
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    color: '#059669',
                                    marginBottom: '8px'
                                }}>
                                    @{user.pseudo} • {user.email}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Rôle actuel:</span>
                                    <span style={{
                                        backgroundColor: currentRoleInfo.color,
                                        color: 'white',
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>
                                        {currentRoleInfo.icon} {currentRoleInfo.name}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Sélection du nouveau rôle */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '16px',
                                fontWeight: '600',
                                color: '#374640',
                                fontSize: '16px'
                            }}>
                                Nouveau rôle *
                            </label>

                            <div style={{
                                display: 'grid',
                                gap: '12px'
                            }}>
                                {roles.map((role) => (
                                    <div
                                        key={role.value}
                                        onClick={() => setSelectedRole(role.value)}
                                        style={{
                                            padding: '20px',
                                            border: `2px solid ${selectedRole === role.value
                                                    ? role.color
                                                    : role.value === currentRoleValue
                                                        ? '#d1d5db'
                                                        : '#e5e7eb'
                                                }`,
                                            borderRadius: '12px',
                                            cursor: role.value === currentRoleValue ? 'not-allowed' : 'pointer',
                                            backgroundColor: selectedRole === role.value
                                                ? `${role.color}10`
                                                : role.value === currentRoleValue
                                                    ? '#f9fafb'
                                                    : 'white',
                                            transition: 'all 0.2s',
                                            opacity: role.value === currentRoleValue ? 0.6 : 1,
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '16px'
                                        }}>
                                            {/* Icône et sélection */}
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <div style={{
                                                    fontSize: '32px',
                                                    filter: role.value === currentRoleValue ? 'grayscale(1)' : 'none'
                                                }}>
                                                    {role.icon}
                                                </div>

                                                {role.value !== currentRoleValue && (
                                                    <div style={{
                                                        width: '20px',
                                                        height: '20px',
                                                        borderRadius: '50%',
                                                        border: `2px solid ${selectedRole === role.value ? role.color : '#d1d5db'}`,
                                                        backgroundColor: selectedRole === role.value ? role.color : 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: '12px'
                                                    }}>
                                                        {selectedRole === role.value && '✓'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Informations du rôle */}
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    marginBottom: '8px'
                                                }}>
                                                    <h4 style={{
                                                        margin: 0,
                                                        color: role.color,
                                                        fontSize: '18px',
                                                        fontWeight: '600'
                                                    }}>
                                                        {role.name}
                                                    </h4>

                                                    {role.value === currentRoleValue && (
                                                        <span style={{
                                                            backgroundColor: '#f59e0b',
                                                            color: 'white',
                                                            padding: '2px 8px',
                                                            borderRadius: '8px',
                                                            fontSize: '11px',
                                                            fontWeight: '600'
                                                        }}>
                                                            ACTUEL
                                                        </span>
                                                    )}
                                                </div>

                                                <p style={{
                                                    margin: '0 0 12px 0',
                                                    color: '#6b7280',
                                                    fontSize: '14px',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {role.description}
                                                </p>

                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#9ca3af'
                                                }}>
                                                    <strong>Permissions:</strong>
                                                    <ul style={{
                                                        margin: '4px 0 0 0',
                                                        paddingLeft: '16px'
                                                    }}>
                                                        {role.permissions.map((permission, index) => (
                                                            <li key={index}>{permission}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {errors.role && (
                                <p style={{
                                    color: '#ef4444',
                                    fontSize: '13px',
                                    margin: '12px 0 0 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    ⚠️ {errors.role}
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
                                        Envoyer une notification informant du changement de rôle
                                    </div>
                                </div>
                            </label>
                        </div>

                        {/* Aperçu du changement */}
                        {selectedRole && selectedRole !== currentRoleValue && (
                            <div style={{
                                marginBottom: '24px',
                                padding: '16px',
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                borderRadius: '12px',
                                border: '2px solid #f59e0b'
                            }}>
                                <div style={{
                                    fontWeight: '600',
                                    marginBottom: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: '#92400e'
                                }}>
                                    🔄 Aperçu du changement
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    color: '#78350f'
                                }}>
                                    <strong>{user.firstname} {user.lastname}</strong> passera de{' '}
                                    <strong>{currentRoleInfo.name}</strong> à{' '}
                                    <strong>{getRoleInfo(selectedRole).name}</strong>.
                                    {notifyUser && " Une notification sera envoyée automatiquement."}
                                </div>
                            </div>
                        )}

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
                                disabled={isLoading || !selectedRole || selectedRole === currentRoleValue}
                                style={{
                                    padding: '12px 24px',
                                    background: isLoading || !selectedRole || selectedRole === currentRoleValue ?
                                        'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' :
                                        'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: '600',
                                    cursor: isLoading || !selectedRole || selectedRole === currentRoleValue ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    opacity: isLoading || !selectedRole || selectedRole === currentRoleValue ? 0.8 : 1,
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                                }}
                                onMouseOver={(e) => {
                                    if (!isLoading && selectedRole && selectedRole !== currentRoleValue) {
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isLoading && selectedRole && selectedRole !== currentRoleValue) {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                                    }
                                }}
                            >
                                {isLoading ? "⏳ Modification..." : "👑 Changer le rôle"}
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

export default ChangeRoleModal;