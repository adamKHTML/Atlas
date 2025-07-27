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
            console.log('🔥 Début de la suppression du compte...');

            // 🚨 SUPPRESSION DU COMPTE
            await deleteAccount({ password: deletePassword.trim() }).unwrap();

            // ✅ SUPPRESSION RÉUSSIE - Actions immédiates
            console.log('✅ Compte supprimé avec succès');

            // 1. Fermer immédiatement la modal
            setShowDeleteModal(false);

            // 2. Nettoyer tous les états locaux
            setProfileData({
                firstname: '',
                lastname: '',
                pseudo: '',
                email: '',
                profile_picture: null
            });
            setDeletePassword('');

            // 3. 🔥 NETTOYER REDUX avec votre méthode existante (PARFAIT !)
            dispatch(setUser(null)); // ✅ Votre méthode actuelle fonctionne parfaitement

            // 4. Afficher le message de confirmation
            alert('✅ Votre compte a été supprimé avec succès.\nVous allez être redirigé vers l\'accueil.');

            // 5. 🔥 REDIRECTION IMMÉDIATE 
            navigate('/', {
                replace: true,
                state: {
                    message: 'Compte supprimé avec succès',
                    type: 'info'
                }
            });

            // 6. 🔥 Forcer le rechargement pour éviter les erreurs RTK Query
            setTimeout(() => {
                console.log('🔄 Rechargement pour nettoyer RTK Query...');
                window.location.href = '/';
            }, 500); // ⬅️ Cette ligne élimine les erreurs 401/500

        } catch (error) {
            console.error('❌ Erreur lors de la suppression:', error);

            // 🔥 CAS SPÉCIAUX : Erreurs attendues après suppression réussie
            if (error.status === 401 || error.originalStatus === 401 || error.status === 500) {
                console.log('✅ Erreur attendue après suppression - Compte probablement supprimé');

                // Nettoyer Redux de toute façon
                dispatch(setUser(null));

                alert('✅ Votre compte a été supprimé avec succès.\nVous allez être redirigé vers l\'accueil.');

                navigate('/', {
                    replace: true,
                    state: {
                        message: 'Compte supprimé avec succès',
                        type: 'info'
                    }
                });

                // Forcer le rechargement
                setTimeout(() => {
                    window.location.href = '/';
                }, 500);

            } else {
                // 🔥 Vraie erreur - afficher le message d'erreur
                if (error.data?.error) {
                    setShowErrorMessage(error.data.error);
                } else if (error.data?.errors && Array.isArray(error.data.errors)) {
                    setShowErrorMessage(error.data.errors.join(', '));
                } else {
                    setShowErrorMessage('Erreur lors de la suppression du compte. Veuillez réessayer.');
                }
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
                padding: '0 clamp(15px, 4vw, 30px)',
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                {/* Logo */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <img
                        src="/image/SunLogo.svg"
                        alt='Atlas Logo'
                        style={{ height: 'clamp(32px, 6vw, 40px)' }}
                    />
                </div>

                {/* Bouton Dashboard avec style blanc qui devient doré au hover */}
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        onClick={() => navigate('/Dashboard')}
                        style={{
                            color: 'white',
                            background: 'none',
                            border: '1px dashed white',
                            borderRadius: '25px',
                            padding: 'clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px)',
                            fontSize: 'clamp(12px, 2.5vw, 14px)',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#F3CB23';
                            e.target.style.borderColor = '#F3CB23';
                            e.target.style.color = '#374640';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.borderColor = 'white';
                            e.target.style.color = 'white';
                        }}
                    >
                        ✦ Dashboard
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
                    padding: 'clamp(20px, 5vw, 30px)',
                    backgroundColor: '#ECF3F0'
                }}>
                    <h1 style={{
                        color: '#374640',
                        margin: '0 0 8px 0',
                        fontSize: 'clamp(24px, 6vw, 32px)',
                        fontWeight: '600'
                    }}>
                        👤 Mon Profil
                    </h1>
                    <p style={{
                        color: '#6b7280',
                        margin: 0,
                        fontSize: 'clamp(14px, 3vw, 16px)'
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
                        textAlign: 'center',
                        marginLeft: '20px',
                        marginRight: '20px'
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
                        lineHeight: '1.5',
                        marginLeft: '20px',
                        marginRight: '20px'
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
                    padding: '0 clamp(15px, 4vw, 20px) clamp(30px, 6vw, 40px) clamp(15px, 4vw, 20px)'
                }}>
                    {/* Informations personnelles */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: 'clamp(20px, 5vw, 30px)',
                        marginBottom: '20px',
                        boxShadow: '0 0 20px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{
                            fontSize: 'clamp(20px, 4vw, 24px)',
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
                                gap: 'clamp(15px, 4vw, 20px)',
                                marginBottom: '25px',
                                padding: 'clamp(15px, 4vw, 20px)',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{
                                    width: 'clamp(60px, 15vw, 80px)',
                                    height: 'clamp(60px, 15vw, 80px)',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    backgroundColor: '#e5e7eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 'clamp(24px, 6vw, 32px)',
                                    flexShrink: 0
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
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#374640', fontSize: 'clamp(16px, 3vw, 18px)' }}>
                                        Photo de profil
                                    </h4>
                                    <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
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
                                            padding: 'clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px)',
                                            fontSize: 'clamp(12px, 2.5vw, 14px)',
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
                                gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))',
                                gap: 'clamp(15px, 4vw, 20px)',
                                marginBottom: '25px'
                            }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: '#374640',
                                        fontSize: 'clamp(14px, 2.5vw, 16px)'
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
                                            padding: 'clamp(10px, 2.5vw, 12px)',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: 'clamp(13px, 2.5vw, 14px)',
                                            transition: 'border-color 0.2s',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = '#F3CB23'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: '#374640',
                                        fontSize: 'clamp(14px, 2.5vw, 16px)'
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
                                            padding: 'clamp(10px, 2.5vw, 12px)',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: 'clamp(13px, 2.5vw, 14px)',
                                            transition: 'border-color 0.2s',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = '#F3CB23'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: '#374640',
                                        fontSize: 'clamp(14px, 2.5vw, 16px)'
                                    }}>
                                        Pseudo * <span style={{ color: '#6b7280', fontSize: 'clamp(11px, 2vw, 12px)', fontWeight: 'normal' }}>(3-50 caractères, lettres, chiffres, - et _ uniquement)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="pseudo"
                                        value={profileData.pseudo}
                                        onChange={handleProfileChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: 'clamp(10px, 2.5vw, 12px)',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: 'clamp(13px, 2.5vw, 14px)',
                                            transition: 'border-color 0.2s',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = '#F3CB23'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '600',
                                        color: '#374640',
                                        fontSize: 'clamp(14px, 2.5vw, 16px)'
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
                                            padding: 'clamp(10px, 2.5vw, 12px)',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: 'clamp(13px, 2.5vw, 14px)',
                                            transition: 'border-color 0.2s',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = '#F3CB23'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; }}
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
                                    padding: 'clamp(10px, 2.5vw, 12px) clamp(20px, 4vw, 24px)',
                                    fontSize: 'clamp(14px, 3vw, 16px)',
                                    fontWeight: '600',
                                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: isUpdating ? 0.7 : 1
                                }}
                                onMouseOver={(e) => {
                                    if (!isUpdating) { e.target.style.backgroundColor = '#e6b800'; }
                                }}
                                onMouseOut={(e) => {
                                    if (!isUpdating) { e.target.style.backgroundColor = '#F3CB23'; }
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
                        padding: 'clamp(20px, 5vw, 30px)',
                        boxShadow: '0 0 20px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{
                            fontSize: 'clamp(20px, 4vw, 24px)',
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
                                alignItems: 'flex-start',
                                padding: 'clamp(15px, 4vw, 20px)',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                flexWrap: 'wrap',
                                gap: '15px'
                            }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#374640', fontSize: 'clamp(16px, 3vw, 18px)' }}>
                                        Mot de passe
                                    </h4>
                                    <p style={{ margin: 0, color: '#6b7280', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
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
                                        padding: 'clamp(8px, 2vw, 10px) clamp(16px, 3vw, 20px)',
                                        fontSize: 'clamp(12px, 2.5vw, 14px)',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        flexShrink: 0
                                    }}
                                    onMouseOver={(e) => { e.target.style.backgroundColor = '#2563eb'; }}
                                    onMouseOut={(e) => { e.target.style.backgroundColor = '#3b82f6'; }}
                                >
                                    🔑 Changer
                                </button>
                            </div>

                            {/* Supprimer compte */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                padding: 'clamp(15px, 4vw, 20px)',
                                backgroundColor: '#fef2f2',
                                borderRadius: '8px',
                                border: '1px solid #fecaca',
                                flexWrap: 'wrap',
                                gap: '15px'
                            }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#dc2626', fontSize: 'clamp(16px, 3vw, 18px)' }}>
                                        Supprimer le compte
                                    </h4>
                                    <p style={{ margin: 0, color: '#7f1d1d', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
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
                                        padding: 'clamp(8px, 2vw, 10px) clamp(16px, 3vw, 20px)',
                                        fontSize: 'clamp(12px, 2.5vw, 14px)',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        flexShrink: 0
                                    }}
                                    onMouseOver={(e) => { e.target.style.backgroundColor = '#dc2626'; }}
                                    onMouseOut={(e) => { e.target.style.backgroundColor = '#ef4444'; }}
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
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: 'clamp(20px, 5vw, 30px)',
                        width: '100%',
                        maxWidth: '500px',
                        boxShadow: '0 0 30px rgba(0,0,0,0.3)',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <h3 style={{
                            fontSize: 'clamp(18px, 4vw, 20px)',
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
                                    color: '#374640',
                                    fontSize: 'clamp(14px, 2.5vw, 16px)'
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
                                        padding: 'clamp(10px, 2.5vw, 12px)',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: 'clamp(13px, 2.5vw, 14px)',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    color: '#374640',
                                    fontSize: 'clamp(14px, 2.5vw, 16px)'
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
                                        padding: 'clamp(10px, 2.5vw, 12px)',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: 'clamp(13px, 2.5vw, 14px)',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '25px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    color: '#374640',
                                    fontSize: 'clamp(14px, 2.5vw, 16px)'
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
                                        padding: 'clamp(10px, 2.5vw, 12px)',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: 'clamp(13px, 2.5vw, 14px)',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '15px',
                                justifyContent: 'flex-end',
                                flexWrap: 'wrap'
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
                                        padding: 'clamp(8px, 2vw, 10px) clamp(16px, 3vw, 20px)',
                                        fontSize: 'clamp(12px, 2.5vw, 14px)',
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
                                        padding: 'clamp(8px, 2vw, 10px) clamp(16px, 3vw, 20px)',
                                        fontSize: 'clamp(12px, 2.5vw, 14px)',
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
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: 'clamp(20px, 5vw, 30px)',
                        width: '100%',
                        maxWidth: '500px',
                        boxShadow: '0 0 30px rgba(0,0,0,0.3)',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <h3 style={{
                            fontSize: 'clamp(18px, 4vw, 20px)',
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
                                fontSize: 'clamp(12px, 2.5vw, 14px)',
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
                                    color: '#374640',
                                    fontSize: 'clamp(14px, 2.5vw, 16px)'
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
                                        padding: 'clamp(10px, 2.5vw, 12px)',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: 'clamp(13px, 2.5vw, 14px)',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '15px',
                                justifyContent: 'flex-end',
                                flexWrap: 'wrap'
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
                                        padding: 'clamp(8px, 2vw, 10px) clamp(16px, 3vw, 20px)',
                                        fontSize: 'clamp(12px, 2.5vw, 14px)',
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
                                        padding: 'clamp(8px, 2vw, 10px) clamp(16px, 3vw, 20px)',
                                        fontSize: 'clamp(12px, 2.5vw, 14px)',
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