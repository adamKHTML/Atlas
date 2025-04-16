import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterMutation } from '../../api/endpoints/register';

export const RegisterForm = () => {
    const [formData, setFormData] = useState({
        email: '',
        pseudo: '',
        password: '',
        confirmPassword: '',
        profile_picture: null
    });

    const [showPassword, setShowPassword] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [agreeTerms, setAgreeTerms] = useState(false);

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
        if (formData.password !== formData.confirmPassword) {
            alert('Les mots de passe ne correspondent pas');
            return false;
        }

        if (formData.password.length < 8) {
            alert('Le mot de passe doit contenir au moins 8 caractères');
            return false;
        }

        if (!agreeTerms) {
            alert('Vous devez accepter les conditions d\'utilisation');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const { confirmPassword, ...dataToSend } = formData;

        try {
            await register(dataToSend).unwrap();
            alert('Inscription réussie! Veuillez vérifier votre email pour activer votre compte.');
            navigate('/login');
        } catch (error) {
            console.error('Registration error:', error);
            alert('Une erreur est survenue lors de l\'inscription');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="register-form">
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
                    J'accepte les <Link to="/terms">conditions d'utilisation</Link> et la <Link to="/privacy">politique de confidentialité</Link>
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
    );
};