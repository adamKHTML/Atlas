import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetProfileQuery, useUpdateProfileMutation, useChangePasswordMutation, useDeleteAccountMutation } from '../api/endpoints/profile';
import { useLogoutMutation } from '../api/endpoints/auth';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';

const ProfilePage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);
    const [logout] = useLogoutMutation();

    // États pour les modales
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState('');
    const [showErrorMessage, setShowErrorMessage] = useState('');

    // États pour les formulaires
    const [profileData, setProfileData] = useState({
        firstname: '',
        lastname: '',
        pseudo: '',
        email: '',
        profile_picture: null
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [deletePassword, setDeletePassword] = useState('');

    // RTK Query hooks
    const { data: profileResponse, isLoading, error } = useGetProfileQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
    const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
    const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

    // Initialiser les données du profil
    React.useEffect(() => {
        if (profileResponse?.user) {
            setProfileData({
                firstname: profileResponse.user.firstname || '',
                lastname: profileResponse.user.lastname || '',
                pseudo: profileResponse.user.pseudo || '',
                email: profileResponse.user.email || '',
                profile_picture: null
            });
        }
    }, [profileResponse]);

    // Gestion des messages temporaires
    React.useEffect(() => {
        if (showSuccessMessage) {
            const timer = setTimeout(() => setShowSuccessMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [showSuccessMessage]);

    React.useEffect(() => {
        if (showErrorMessage) {
            const timer = setTimeout(() => setShowErrorMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [showErrorMessage]);

    // Gestionnaires d'événements
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setProfileData(prev => ({
            ...prev,
            profile_picture: file
        }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();

        // Validation côté client
        const clientErrors = [];

        if (!profileData.firstname.trim()) {
            clientErrors.push('Le prénom est requis');
        } else if (profileData.firstname.trim().length < 2) {
            clientErrors.push('Le prénom doit faire au moins 2 caractères');
        }

        if (!profileData.lastname.trim()) {
            clientErrors.push('Le nom est requis');
        } else if (profileData.lastname.trim().length < 2) {
            clientErrors.push('Le nom doit faire au moins 2 caractères');
        }

        if (!profileData.pseudo.trim()) {
            clientErrors.push('Le pseudo est requis');
        } else if (profileData.pseudo.trim().length < 3) {
            clientErrors.push('Le pseudo doit faire au moins 3 caractères');
        }

        if (!profileData.email.trim()) {
            clientErrors.push('L\'email est requis');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
            clientErrors.push('Format d\'email invalide');
        }

        // Validation de la photo si présente
        if (profileData.profile_picture) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            const maxSize = 5 * 1024 * 1024; // 5MB

            if (!allowedTypes.includes(profileData.profile_picture.type)) {
                clientErrors.push('Format d\'image non autorisé. Utilisez JPG, PNG, GIF ou WebP');
            }

            if (profileData.profile_picture.size > maxSize) {
                clientErrors.push('La taille de l\'image ne peut pas dépasser 5MB');
            }
        }

        if (clientErrors.length > 0) {
            setShowErrorMessage(clientErrors.join(', '));
            return;
        }

        try {
            const formData = new FormData();
            formData.append('firstname', profileData.firstname.trim());
            formData.append('lastname', profileData.lastname.trim());
            formData.append('pseudo', profileData.pseudo.trim());
            formData.append('email', profileData.email.trim());

            if (profileData.profile_picture) {
                formData.append('profile_picture', profileData.profile_picture);
            }

            const result = await updateProfile(formData).unwrap();
            setShowSuccessMessage('Profil mis à jour avec succès');

            // Mettre à jour les données Redux si nécessaire
            dispatch(setUser(result.user));

            // Réinitialiser le fichier sélectionné
            setProfileData(prev => ({ ...prev, profile_picture: null }));
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);

            // Gérer les erreurs du serveur
            if (error.data?.errors && Array.isArray(error.data.errors)) {
                setShowErrorMessage(error.data.errors.join(', '));
            } else if (error.data?.error) {
                setShowErrorMessage(error.data.error);
            } else {
                setShowErrorMessage('Erreur lors de la mise à jour du profil. Veuillez réessayer.');
            }
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        // Validation côté client
        const clientErrors = [];

        if (!passwordData.current_password.trim()) {
            clientErrors.push('Le mot de passe actuel est requis');
        }

        if (!passwordData.new_password) {
            clientErrors.push('Le nouveau mot de passe est requis');
        } else {
            if (passwordData.new_password.length < 8) {
                clientErrors.push('Le nouveau mot de passe doit faire au moins 8 caractères');
            }
            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.new_password)) {
                clientErrors.push('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre');
            }
        }

        if (!passwordData.confirm_password) {
            clientErrors.push('La confirmation du mot de passe est requise');
        }

        if (passwordData.new_password && passwordData.confirm_password &&
            passwordData.new_password !== passwordData.confirm_password) {
            clientErrors.push('Les nouveaux mots de passe ne correspondent pas');
        }

        if (passwordData.current_password && passwordData.new_password &&
            passwordData.current_password === passwordData.new_password) {
            clientErrors.push('Le nouveau mot de passe doit être différent de l\'ancien');
        }

        if (clientErrors.length > 0) {
            setShowErrorMessage(clientErrors.join(', '));
            return;
        }

        try {
            await changePassword(passwordData).unwrap();
            setShowSuccessMessage('Mot de passe changé avec succès');
            setShowPasswordModal(false);
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (error) {
            console.error('Erreur lors du changement de mot de passe:', error);

            // Gérer les erreurs du serveur
            if (error.data?.errors && Array.isArray(error.data.errors)) {
                setShowErrorMessage(error.data.errors.join(', '));
            } else if (error.data?.error) {
                setShowErrorMessage(error.data.error);
            } else {
                setShowErrorMessage('Erreur lors du changement de mot de passe. Veuillez réessayer.');
            }
        }
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();

        // Validation côté client
        if (!deletePassword.trim()) {
            setShowErrorMessage('Le mot de passe est requis pour confirmer la suppression');
            return;
        }

        // Confirmation supplémentaire
        const confirmDelete = window.confirm(
            '⚠️ ATTENTION ⚠️\n\n' +
            'Vous êtes sur le point de supprimer définitivement votre compte.\n' +
            'Cette action est IRRÉVERSIBLE.\n\n' +
            'Toutes vos données seront perdues :\n' +
            '• Votre profil et vos informations\n' +
            '• Vos messages et discussions\n' +
            '• Votre historique d\'activité\n\n' +
            'Êtes-vous absolument certain(e) de vouloir continuer ?'
        );

        if (!confirmDelete) {
            return;
        }

        try {
            await deleteAccount({ password: deletePassword.trim() }).unwrap();

            // Afficher un message de confirmation avant la déconnexion
            alert('✅ Votre compte a été supprimé avec succès.\nVous allez être redirigé vers la page de connexion.');

            await logout().unwrap();
            navigate('/login', {
                replace: true,
                state: {
                    message: 'Compte supprimé avec succès',
                    type: 'info'
                }
            });
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);

            // Gérer les erreurs du serveur
            if (error.data?.error) {
                setShowErrorMessage(error.data.error);
            } else {
                setShowErrorMessage('Erreur lors de la suppression du compte. Veuillez réessayer.');
            }
        }
    };

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#ECF3F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center', color: '#374640' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                    <p>Chargement du profil...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#ECF3F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center', color: '#ef4444' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                    <p>Erreur lors du chargement du profil</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Navbar */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '70px',
                backgroundColor: '#374640',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 30px',
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <img
                        src="/image/SunLogo.svg"
                        alt='Atlas Logo'
                        style={{ height: '40px' }}
                    />
                    <h1 style={{
                        color: 'white',
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: '600'
                    }}>
                        Atlas
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        onClick={() => navigate('/Dashboard')}
                        style={{
                            color: 'white',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        }}
                    >
                        🏠 Dashboard
                    </button>
                </div>
            </div>

            {/* Contenu principal */}
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#ECF3F0',
                paddingTop: '70px'
            }}>
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    padding: '30px',
                    backgroundColor: '#ECF3F0'
                }}>
                    <h1 style={{
                        color: '#374640',
                        margin: '0 0 8px 0',
                        fontSize: '32px',
                        fontWeight: '600'
                    }}>
                        👤 Mon Profil
                    </h1>
                    <p style={{
                        color: '#6b7280',
                        margin: 0,
                        fontSize: '16px'
                    }}>
                        Gérez vos informations personnelles et paramètres de compte
                    </p>
                </div>

                {/* Messages */}
                {showSuccessMessage && (
                    <div style={{
                        maxWidth: '800px',
                        margin: '0 auto 20px auto',
                        padding: '12px 20px',
                        backgroundColor: '#dcfce7',
                        border: '1px solid #16a34a',
                        borderRadius: '8px',
                        color: '#15803d',
                        textAlign: 'center'
                    }}>
                        ✅ {showSuccessMessage}
                    </div>
                )}

                {showErrorMessage && (
                    <div style={{
                        maxWidth: '800px',
                        margin: '0 auto 20px auto',
                        padding: '15px 20px',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        color: '#dc2626',
                        textAlign: 'left',
                        fontSize: '14px',
                        lineHeight: '1.5'
                    }}>
                        <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                            ❌ Erreur{showErrorMessage.includes(',') ? 's' : ''} détectée{showErrorMessage.includes(',') ? 's' : ''} :
                        </div>
                        <div>
                            {showErrorMessage.split(', ').map((error, index) => (
                                <div key={index} style={{ marginLeft: '10px' }}>
                                    • {error}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Contenu */}
                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    padding: '0 30px 40px 30px'
                }}>
                    {/* Informations personnelles */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '30px',
                        marginBottom: '20px',
                        boxShadow: '0 0 20px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            color: '#374640',
                            marginBottom: '20px',
                            borderBottom: '2px solid #F3CB23',
                            paddingBottom: '10px'
                        }}>
                            📝 Informations personnelles
                        </h2>

                        <form onSubmit={handleProfileSubmit}>
                            {/* Photo de profil */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                marginBottom: '25px',
                                padding: '20px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px'
                            }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    backgroundColor: '#e5e7eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '32px'
                                }}>
                                    {profileResponse?.user?.profile_picture ? (
                                        <img
                                            src={profileResponse.user.profile_picture}
                                            alt="Photo de profil"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        '👤'
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#374640' }}>
                                        Photo de profil
                                    </h4>
                                    <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '14px' }}>
                                        Choisissez une image pour votre profil (JPG, PNG, GIF, WebP - max 5MB)
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            backgroundColor: '#F3CB23',
                                            color: '#374640',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px 16px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        📷 Changer la photo
                                    </button>
                                </div>
                            </div>

                            {/* Champs du formulaire */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '20px',
                                marginBottom: '25px'
                            }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: '#374640'
                                    }}>
                                        Prénom *
                                    </label>
                                    <input
                                        type="text"
                                        name="firstname"
                                        value={profileData.firstname}
                                        onChange={handleProfileChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            transition: 'border-color 0.2s',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#F3CB23';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#d1d5db';
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: '#374640'
                                    }}>
                                        Nom *
                                    </label>
                                    <input
                                        type="text"
                                        name="lastname"
                                        value={profileData.lastname}
                                        onChange={handleProfileChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            transition: 'border-color 0.2s',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#F3CB23';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#d1d5db';
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: '#374640'
                                    }}>
                                        Pseudo * <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: 'normal' }}>(3-50 caractères, lettres, chiffres, - et _ uniquement)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="pseudo"
                                        value={profileData.pseudo}
                                        onChange={handleProfileChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            transition: 'border-color 0.2s',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#F3CB23';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#d1d5db';
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: '#374640'
                                    }}>
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleProfileChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            transition: 'border-color 0.2s',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#F3CB23';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#d1d5db';
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Bouton de soumission */}
                            <button
                                type="submit"
                                disabled={isUpdating}
                                style={{
                                    backgroundColor: '#F3CB23',
                                    color: '#374640',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: isUpdating ? 0.7 : 1
                                }}
                                onMouseOver={(e) => {
                                    if (!isUpdating) {
                                        e.target.style.backgroundColor = '#e6b800';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isUpdating) {
                                        e.target.style.backgroundColor = '#F3CB23';
                                    }
                                }}
                            >
                                {isUpdating ? '💾 Mise à jour...' : '💾 Sauvegarder'}
                            </button>
                        </form>
                    </div>

                    {/* Actions de sécurité */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '30px',
                        boxShadow: '0 0 20px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            color: '#374640',
                            marginBottom: '20px',
                            borderBottom: '2px solid #F3CB23',
                            paddingBottom: '10px'
                        }}>
                            🔐 Sécurité du compte
                        </h2>

                        <div style={{
                            display: 'grid',
                            gap: '15px'
                        }}>
                            {/* Changer mot de passe */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '20px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#374640' }}>
                                        Mot de passe
                                    </h4>
                                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                                        Changez votre mot de passe pour sécuriser votre compte
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    style={{
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '10px 20px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.backgroundColor = '#2563eb';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.backgroundColor = '#3b82f6';
                                    }}
                                >
                                    🔑 Changer
                                </button>
                            </div>

                            {/* Supprimer compte */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '20px',
                                backgroundColor: '#fef2f2',
                                borderRadius: '8px',
                                border: '1px solid #fecaca'
                            }}>
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#dc2626' }}>
                                        Supprimer le compte
                                    </h4>
                                    <p style={{ margin: 0, color: '#7f1d1d', fontSize: '14px' }}>
                                        Cette action est irréversible. Toutes vos données seront perdues.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    style={{
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '10px 20px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.backgroundColor = '#dc2626';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.backgroundColor = '#ef4444';
                                    }}
                                >
                                    🗑️ Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal changement de mot de passe */}
            {showPasswordModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '30px',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 0 30px rgba(0,0,0,0.3)'
                    }}>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#374640',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            🔑 Changer le mot de passe
                        </h3>

                        <form onSubmit={handlePasswordSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    color: '#374640'
                                }}>
                                    Mot de passe actuel *
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.current_password}
                                    onChange={(e) => setPasswordData(prev => ({
                                        ...prev,
                                        current_password: e.target.value
                                    }))}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    color: '#374640'
                                }}>
                                    Nouveau mot de passe *
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.new_password}
                                    onChange={(e) => setPasswordData(prev => ({
                                        ...prev,
                                        new_password: e.target.value
                                    }))}
                                    required
                                    minLength={8}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '25px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    color: '#374640'
                                }}>
                                    Confirmer le nouveau mot de passe *
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.confirm_password}
                                    onChange={(e) => setPasswordData(prev => ({
                                        ...prev,
                                        confirm_password: e.target.value
                                    }))}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '15px',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPasswordData({
                                            current_password: '',
                                            new_password: '',
                                            confirm_password: ''
                                        });
                                    }}
                                    style={{
                                        backgroundColor: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '10px 20px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    style={{
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '10px 20px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                                        opacity: isChangingPassword ? 0.7 : 1
                                    }}
                                >
                                    {isChangingPassword ? 'Changement...' : 'Changer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal suppression de compte */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '30px',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 0 30px rgba(0,0,0,0.3)'
                    }}>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#dc2626',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            ⚠️ Supprimer le compte
                        </h3>

                        <div style={{
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '20px'
                        }}>
                            <p style={{
                                color: '#dc2626',
                                margin: 0,
                                fontSize: '14px',
                                textAlign: 'center'
                            }}>
                                <strong>Attention :</strong> Cette action est irréversible.<br />
                                Toutes vos données seront définitivement supprimées.
                            </p>
                        </div>

                        <form onSubmit={handleDeleteAccount}>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    color: '#374640'
                                }}>
                                    Confirmez avec votre mot de passe *
                                </label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    required
                                    placeholder="Entrez votre mot de passe pour confirmer"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '15px',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeletePassword('');
                                    }}
                                    style={{
                                        backgroundColor: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '10px 20px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDeleting}
                                    style={{
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '10px 20px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                                        opacity: isDeleting ? 0.7 : 1
                                    }}
                                >
                                    {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProfilePage;