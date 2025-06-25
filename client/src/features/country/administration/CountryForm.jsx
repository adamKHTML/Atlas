import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Upload, Image, ArrowRight, Check } from 'lucide-react';
import { getNames, getCodes } from 'country-list';
import { useCreateCountryMutation } from '../../../api/endpoints/admin/countries';

const CountryForm = () => {
    const navigate = useNavigate();
    const [createCountry, { isLoading: isCreating }] = useCreateCountryMutation();

    const [formData, setFormData] = useState({
        selectedCountry: '',
        countryCode: '',
        countryImage: null,
        introductionText: ''
    });

    const [imagePreview, setImagePreview] = useState('');
    const [countries, setCountries] = useState([]);
    const [errors, setErrors] = useState({});

    // Initialisation de la liste des pays
    useEffect(() => {
        try {
            const countryNames = getNames();
            const countryCodes = getCodes();

            const countryList = countryNames.map((name, index) => {
                const code = countryCodes[index];
                return {
                    name: name,
                    code: code,
                    flag: `https://flagcdn.com/w320/${code.toLowerCase()}.png`
                };
            }).sort((a, b) => a.name.localeCompare(b.name, 'fr'));

            setCountries(countryList);
        } catch (error) {
            console.error('Erreur lors du chargement des pays:', error);
            setCountries([
                { name: 'France', code: 'FR', flag: 'https://flagcdn.com/w320/fr.png' },
                { name: 'Allemagne', code: 'DE', flag: 'https://flagcdn.com/w320/de.png' },
                { name: 'Espagne', code: 'ES', flag: 'https://flagcdn.com/w320/es.png' },
                { name: 'Italie', code: 'IT', flag: 'https://flagcdn.com/w320/it.png' },
                { name: 'Japon', code: 'JP', flag: 'https://flagcdn.com/w320/jp.png' },
                { name: 'États-Unis', code: 'US', flag: 'https://flagcdn.com/w320/us.png' }
            ]);
        }
    }, []);

    const selectedCountryData = countries.find(c => c.name === formData.selectedCountry);

    const handleCountryChange = (e) => {
        const selectedName = e.target.value;
        const selectedCountry = countries.find(c => c.name === selectedName);

        setFormData(prev => ({
            ...prev,
            selectedCountry: selectedName,
            countryCode: selectedCountry ? selectedCountry.code : ''
        }));

        // Réinitialiser l'erreur du champ
        if (errors.selectedCountry) {
            setErrors(prev => ({ ...prev, selectedCountry: null }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validation du fichier
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, countryImage: 'L\'image ne doit pas dépasser 5MB' }));
                return;
            }

            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({ ...prev, countryImage: 'Veuillez sélectionner un fichier image valide' }));
                return;
            }

            setFormData(prev => ({
                ...prev,
                countryImage: file
            }));

            // Créer l'aperçu
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);

            // Réinitialiser l'erreur
            if (errors.countryImage) {
                setErrors(prev => ({ ...prev, countryImage: null }));
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.selectedCountry) {
            newErrors.selectedCountry = 'Veuillez sélectionner un pays';
        }

        if (!formData.countryImage) {
            newErrors.countryImage = 'Veuillez ajouter une image du pays';
        }

        if (!formData.introductionText.trim()) {
            newErrors.introductionText = 'Veuillez ajouter une description';
        } else if (formData.introductionText.length < 50) {
            newErrors.introductionText = 'La description doit contenir au moins 50 caractères';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            // Préparation des données pour l'API Symfony
            const countryDataToSend = {
                name: formData.selectedCountry,
                code: formData.countryCode,
                flag_url: selectedCountryData.flag,
                description: formData.introductionText,
                country_image: formData.countryImage // 🆕 Image sera uploadée dans /uploads/countries/
            };

            // Appel API
            const result = await createCountry(countryDataToSend).unwrap();

            console.log('✅ Pays créé avec succès:', result);

            // Redirection vers l'éditeur de contenu avec l'ID du pays créé
            navigate(`/country-content/${result.id}`, {
                state: {
                    countryData: result,
                    step: 2,
                    fromCreation: true
                }
            });

        } catch (error) {
            console.error('❌ Erreur lors de la création du pays:', error);

            // Gestion des erreurs spécifiques du backend
            if (error.status === 409) {
                setErrors({ selectedCountry: 'Ce pays existe déjà dans le système' });
            } else if (error.status === 413) {
                setErrors({ countryImage: 'L\'image est trop volumineuse' });
            } else if (error.status === 400) {
                setErrors({ general: 'Données invalides. Vérifiez vos informations.' });
            } else {
                setErrors({ general: 'Erreur lors de la création du pays. Veuillez réessayer.' });
            }
        }
    };

    const resetForm = () => {
        setFormData({
            selectedCountry: '',
            countryCode: '',
            countryImage: null,
            introductionText: ''
        });
        setImagePreview('');
        setErrors({});
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#ECF3F0' }}>
            {/* Header avec navigation */}
            <div className="bg-white shadow-sm border-b" style={{ borderColor: '#e0e0e0' }}>
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Globe style={{ color: '#F3CB23' }} size={24} />
                                <h1 className="text-xl font-semibold" style={{ color: '#1c2a28' }}>Créer une page pays</h1>
                            </div>
                            <div className="flex items-center space-x-2 text-sm" style={{ color: '#666' }}>
                                <span className="text-white px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F3CB23' }}>1</span>
                                <span>Informations de base</span>
                                <ArrowRight size={16} style={{ color: '#ccc' }} />
                                <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#e0e0e0', color: '#666' }}>2</span>
                                <span>Éditeur de contenu</span>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/Dashboard')}
                            className="px-3 py-1 text-sm hover:opacity-70 transition-opacity"
                            style={{ color: '#1c2a28' }}
                        >
                            Retour
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden" style={{ borderColor: '#e0e0e0' }}>

                    {/* Erreur générale */}
                    {errors.general && (
                        <div className="mx-6 mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors.general}</p>
                        </div>
                    )}

                    {/* En-tête du formulaire */}
                    <div className="px-6 py-4 border-b" style={{ backgroundColor: '#FFF8E5', borderColor: '#e0e0e0' }}>
                        <h2 className="text-lg font-medium" style={{ color: '#1c2a28' }}>Étape 1 : Informations de base</h2>
                        <p className="text-sm mt-1" style={{ color: '#666' }}>
                            Sélectionnez le pays et ajoutez les informations principales qui apparaîtront en en-tête de la page.
                        </p>
                    </div>

                    <div className="p-6 space-y-6">

                        {/* Sélection du pays */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#1c2a28' }}>
                                Sélectionnez le pays *
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.selectedCountry}
                                    onChange={handleCountryChange}
                                    className={`w-full px-3 py-2 border rounded-lg appearance-none bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${errors.selectedCountry ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    style={{
                                        '--tw-ring-color': errors.selectedCountry ? '#ef4444' : '#F3CB23'
                                    }}
                                    required
                                >
                                    <option value="">Choisissez un pays...</option>
                                    {countries.map(country => (
                                        <option key={country.code} value={country.name}>
                                            {country.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <svg className="w-4 h-4" style={{ color: '#666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            {errors.selectedCountry && (
                                <p className="text-sm text-red-600 mt-1">{errors.selectedCountry}</p>
                            )}

                            {/* Aperçu du drapeau sélectionné */}
                            {selectedCountryData && (
                                <div className="mt-3 flex items-center space-x-3 p-3 rounded-lg transition-all duration-200" style={{ backgroundColor: '#ECF3F0' }}>
                                    <img
                                        src={selectedCountryData.flag}
                                        alt={`Drapeau ${selectedCountryData.name}`}
                                        className="w-8 h-6 object-cover rounded border shadow-sm"
                                        onError={(e) => {
                                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAzMiAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjI0IiBmaWxsPSIjRkZGIiBzdHJva2U9IiNEREQiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iOCIgZmlsbD0iIzk5OSI+CjxwYXRoIGQ9Ik04IDhMMTYgMTZNMTYgOEw4IDE2Ii8+Cjwvc3ZnPgo8L3N2Zz4K';
                                        }}
                                    />
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: '#1c2a28' }}>{selectedCountryData.name}</p>
                                        <p className="text-xs" style={{ color: '#666' }}>Code: {selectedCountryData.code}</p>
                                    </div>
                                    <Check style={{ color: '#F3CB23' }} size={16} className="ml-auto" />
                                </div>
                            )}
                        </div>

                        {/* Upload d'image du pays */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#1c2a28' }}>
                                Image de présentation du pays *
                            </label>
                            <p className="text-xs mb-3" style={{ color: '#666' }}>
                                Cette image sera affichée en en-tête de la page pays. Format recommandé : 1200x600px (max 5MB)
                            </p>

                            <div
                                className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 hover:border-opacity-70 cursor-pointer ${errors.countryImage ? 'border-red-300' : 'border-yellow-400'
                                    }`}
                                style={{ borderColor: errors.countryImage ? '#ef4444' : '#F3CB23' }}
                                onClick={() => !imagePreview && document.getElementById('country-image-upload').click()}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="country-image-upload"
                                />

                                {!imagePreview ? (
                                    <div className="text-center">
                                        <Upload className="mx-auto mb-2" style={{ color: '#666' }} size={32} />
                                        <p className="text-sm" style={{ color: '#666' }}>
                                            <span className="font-medium" style={{ color: '#F3CB23' }}>Cliquez pour sélectionner</span> ou glissez-déposez
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: '#999' }}>PNG, JPG, WEBP jusqu'à 5MB</p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Aperçu"
                                            className="w-full h-48 object-cover rounded-lg"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center opacity-0 hover:opacity-100">
                                            <label
                                                htmlFor="country-image-upload"
                                                className="cursor-pointer bg-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-shadow"
                                                style={{ color: '#1c2a28' }}
                                            >
                                                Changer l'image
                                            </label>
                                        </div>
                                        <div className="mt-2 flex items-center space-x-2 text-sm" style={{ color: '#F3CB23' }}>
                                            <Check size={16} />
                                            <span>Image sélectionnée</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImagePreview('');
                                                    setFormData(prev => ({ ...prev, countryImage: null }));
                                                }}
                                                className="ml-auto text-xs px-2 py-1 rounded hover:bg-red-50"
                                                style={{ color: '#dc2626' }}
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {errors.countryImage && (
                                <p className="text-sm text-red-600 mt-1">{errors.countryImage}</p>
                            )}
                        </div>

                        {/* Texte d'introduction */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#1c2a28' }}>
                                Paragraphe d'introduction *
                            </label>
                            <p className="text-xs mb-3" style={{ color: '#666' }}>
                                Ce texte sera affiché sous l'image en en-tête de la page. Il doit présenter le pays de manière engageante.
                            </p>
                            <textarea
                                value={formData.introductionText}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, introductionText: e.target.value }));
                                    if (errors.introductionText) {
                                        setErrors(prev => ({ ...prev, introductionText: null }));
                                    }
                                }}
                                className={`w-full px-3 py-2 border rounded-lg resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${errors.introductionText ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                style={{
                                    '--tw-ring-color': errors.introductionText ? '#ef4444' : '#F3CB23'
                                }}
                                rows={6}
                                placeholder="Écrivez une introduction captivante sur ce pays, son histoire, sa culture, ce qui le rend unique..."
                                required
                            />
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs" style={{
                                    color: formData.introductionText.length < 50 || errors.introductionText ? '#dc2626' : '#666'
                                }}>
                                    {formData.introductionText.length} caractères {formData.introductionText.length < 50 && '(minimum 50)'}
                                </span>
                                <span className="text-xs" style={{ color: '#666' }}>
                                    Recommandé : 200-500 caractères
                                </span>
                            </div>
                            {errors.introductionText && (
                                <p className="text-sm text-red-600 mt-1">{errors.introductionText}</p>
                            )}
                        </div>

                        {/* Aperçu */}
                        {formData.selectedCountry && imagePreview && formData.introductionText && (
                            <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#e0e0e0' }}>
                                <div className="px-4 py-2 border-b" style={{ backgroundColor: '#ECF3F0', borderColor: '#e0e0e0' }}>
                                    <h3 className="text-sm font-medium flex items-center" style={{ color: '#1c2a28' }}>
                                        <Image size={16} className="mr-2" style={{ color: '#F3CB23' }} />
                                        Aperçu de l'en-tête
                                    </h3>
                                </div>
                                <div className="relative">
                                    <img
                                        src={imagePreview}
                                        alt="Aperçu pays"
                                        className="w-full h-32 object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-end" style={{ backgroundColor: 'rgba(28, 42, 40, 0.6)' }}>
                                        <div className="text-white p-4 w-full">
                                            <h2 className="text-xl font-bold mb-2">{formData.selectedCountry}</h2>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm" style={{ color: '#666' }}>
                                        {formData.introductionText}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 border-t" style={{ backgroundColor: '#f9f9f9', borderColor: '#e0e0e0' }}>
                        <div className="flex justify-between items-center">
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                                style={{ color: '#666', borderColor: '#ddd' }}
                                disabled={isCreating}
                            >
                                Réinitialiser
                            </button>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => navigate('/Dashboard')}
                                    className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                                    style={{ color: '#1c2a28', borderColor: '#ddd' }}
                                    disabled={isCreating}
                                >
                                    Annuler
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    disabled={isCreating || !formData.selectedCountry || !formData.countryImage || !formData.introductionText.trim()}
                                    className={`px-6 py-2 text-sm rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${isCreating || !formData.selectedCountry || !formData.countryImage || !formData.introductionText.trim()
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:shadow-lg'
                                        }`}
                                    style={{
                                        backgroundColor: '#F3CB23',
                                        color: '#1c2a28',
                                        border: '1px solid #F3CB23'
                                    }}
                                >
                                    {isCreating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                            <span>Création...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Continuer vers l'éditeur</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Note informative */}
                        <div className="mt-3 text-xs" style={{ color: '#666' }}>
                            <p>
                                ℹ️ Après validation, vous serez dirigé vers l'éditeur de contenu pour ajouter les sections détaillées du pays.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CountryForm;