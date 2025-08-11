import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterMutation } from '../../api/endpoints/register';
import GDPRModal from '../../components/GdprModal.jsx';

export const RegisterForm = () => {
    const [formData, setFormData] = useState({
        email: '',
        pseudo: '',
        firstname: '',
        lastname: '',
        password: '',
        confirmPassword: '',
        profile_picture: null
    });

    const [showPassword, setShowPassword] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [errors, setErrors] = useState(null);
    const [isGDPRModalOpen, setIsGDPRModalOpen] = useState(false);

    const [register, { isLoading }] = useRegisterMutation();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB
                alert('Le fichier est trop volumineux. Taille maximum: 2MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);

            setFormData(prev => ({
                ...prev,
                profile_picture: file
            }));
        }
    };

    const validateForm = () => {
        const newErrors = [];

        if (!formData.email || !formData.email.includes('@')) {
            newErrors.push('Email invalide');
        }

        if (!formData.pseudo || formData.pseudo.length < 3) {
            newErrors.push('Le pseudo doit contenir au moins 3 caractères');
        }

        if (!formData.firstname) {
            newErrors.push('Le prénom est requis');
        }

        if (!formData.lastname) {
            newErrors.push('Le nom est requis');
        }

        if (!formData.password || formData.password.length < 8) {
            newErrors.push('Le mot de passe doit contenir au moins 8 caractères');
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.push('Les mots de passe ne correspondent pas');
        }

        if (!agreeTerms) {
            newErrors.push('Vous devez accepter les conditions d\'utilisation');
        }

        setErrors(newErrors.length > 0 ? newErrors : null);
        return newErrors.length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            // Créer un FormData pour envoyer les fichiers
            const formDataToSend = new FormData();

            // Ajouter chaque champ explicitement (sauf confirmPassword qui n'est pas nécessaire côté serveur)
            formDataToSend.append('email', formData.email);
            formDataToSend.append('password', formData.password);
            formDataToSend.append('pseudo', formData.pseudo);
            formDataToSend.append('firstname', formData.firstname);
            formDataToSend.append('lastname', formData.lastname);

            // Ajouter la photo de profil si elle existe
            if (formData.profile_picture) {
                formDataToSend.append('profile_picture', formData.profile_picture);
            }

            // Log pour débogage
            console.log('Envoi du formulaire avec les champs:', [...formDataToSend.entries()].map(e => e[0]));

            const result = await register(formDataToSend).unwrap();
            console.log('Résultat de l\'inscription:', result);

            alert('Inscription réussie! Veuillez vérifier votre email pour activer votre compte.');
            navigate('/');
        } catch (error) {
            console.error('Erreur d\'inscription:', error);

            if (error.data && error.data.errors) {
                setErrors(error.data.errors);
            } else if (error.data && error.data.error) {
                setErrors([error.data.error]);
            } else {
                setErrors(['Une erreur est survenue lors de l\'inscription']);
            }
        }
    };

    const handleGDPRAccept = () => {
        setAgreeTerms(true);
        setIsGDPRModalOpen(false);
    };

    const handleGDPRClose = () => {
        setIsGDPRModalOpen(false);
    };

    const openGDPRModal = (e) => {
        e.preventDefault();
        setIsGDPRModalOpen(true);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="register-form">
                {errors && (
                    <div className="error-box">
                        <ul>
                            {errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="email">Email <span className="required">*</span></label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="votre@email.com"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="firstname">Prénom <span className="required">*</span></label>
                    <input
                        id="firstname"
                        name="firstname"
                        type="text"
                        required
                        value={formData.firstname}
                        onChange={handleChange}
                        placeholder="Prénom"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="lastname">Nom <span className="required">*</span></label>
                    <input
                        id="lastname"
                        name="lastname"
                        type="text"
                        required
                        value={formData.lastname}
                        onChange={handleChange}
                        placeholder="Nom"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="pseudo">Pseudo <span className="required">*</span></label>
                    <input
                        id="pseudo"
                        name="pseudo"
                        type="text"
                        required
                        value={formData.pseudo}
                        onChange={handleChange}
                        placeholder="VotreNomVoyageur"
                    />
                    <p className="form-hint">Ce nom sera visible par les autres utilisateurs</p>
                </div>

                <div className="form-group">
                    <label htmlFor="password">Mot de passe <span className="required">*</span></label>
                    <div className="password-input">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="toggle-password"
                        >
                            {showPassword ? "Cacher" : "Voir"}
                        </button>
                    </div>
                    <p className="form-hint">Au moins 8 caractères</p>
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmer le mot de passe <span className="required">*</span></label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="profile_picture">Photo de profil (optionnelle)</label>
                    <div className="avatar-upload">
                        <div className="avatar-preview">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar preview" />
                            ) : (
                                <div className="avatar-placeholder">?</div>
                            )}
                        </div>
                        <div className="upload-button">
                            <label htmlFor="profile_picture_input" className="button-like">
                                Choisir une image
                            </label>
                            <input
                                id="profile_picture_input"
                                name="profile_picture"
                                type="file"
                                accept="image/jpeg,image/png,image/gif"
                                onChange={handleFileChange}
                                className="hidden-input"
                            />
                            <p className="form-hint">JPG, PNG ou GIF. 2 Mo maximum.</p>
                        </div>
                    </div>
                </div>

                <div className="terms-checkbox">
                    <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={() => setAgreeTerms(!agreeTerms)}
                    />
                    <label htmlFor="terms">
                        J'accepte les{' '}
                        <button
                            type="button"
                            onClick={openGDPRModal}
                            className="terms-link"
                        >
                            conditions d'utilisation
                        </button>
                        {' '}et la{' '}
                        <button
                            type="button"
                            onClick={openGDPRModal}
                            className="terms-link"
                        >
                            politique de confidentialité
                        </button>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="submit-button"
                >
                    {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
                </button>

                <div className="info-box">
                    <p>Après l'inscription, un email de confirmation vous sera envoyé. Veuillez vérifier votre boîte de réception pour activer votre compte.</p>
                </div>
            </form>

            <GDPRModal
                isOpen={isGDPRModalOpen}
                onClose={handleGDPRClose}
                onAccept={handleGDPRAccept}
            />


        </>
    );
};

export default RegisterForm;