import React, { useState, useEffect } from 'react';
import { Globe, Upload, Image, ArrowRight, Check } from 'lucide-react';
import { getNames, getCodes } from 'country-list';

const CountryForm = () => {
    const [formData, setFormData] = useState({
        selectedCountry: '',
        countryCode: '',
        countryImage: null,
        introductionText: ''
    });

    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [countries, setCountries] = useState([]);

    // Initialisation de la liste des pays
    useEffect(() => {
        try {
            // Récupération des pays avec country-list
            const countryNames = getNames();
            const countryCodes = getCodes();

            // Création de la liste des pays avec drapeaux
            const countryList = countryNames.map((name, index) => {
                const code = countryCodes[index];
                return {
                    name: name,
                    code: code,
                    flag: `https://flagcdn.com/w320/${code.toLowerCase()}.png`
                };
            }).sort((a, b) => a.name.localeCompare(b.name, 'fr')); // Tri alphabétique français

            setCountries(countryList);
        } catch (error) {
            console.error('Erreur lors du chargement des pays:', error);
            // Fallback avec quelques pays principaux
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
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validation du fichier
            if (file.size > 5 * 1024 * 1024) { // 5MB max
                alert('L\'image ne doit pas dépasser 5MB');
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert('Veuillez sélectionner un fichier image valide');
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
        }
    };

    const handleSubmit = async () => {
        if (!formData.selectedCountry || !formData.countryImage || !formData.introductionText.trim()) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (formData.introductionText.length < 50) {
            alert('La description doit contenir au moins 50 caractères');
            return;
        }

        setLoading(true);

        try {
            // Simulation de l'appel API vers votre backend Symfony
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.selectedCountry);
            formDataToSend.append('code', formData.countryCode);
            formDataToSend.append('flag_url', selectedCountryData.flag);
            formDataToSend.append('description', formData.introductionText);
            formDataToSend.append('country_image', formData.countryImage);

            // Simulation de la requête
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('Données à envoyer vers /api/countries:', {
                name: formData.selectedCountry,
                code: formData.countryCode,
                flag_url: selectedCountryData.flag,
                description: formData.introductionText,
                country_image: formData.countryImage.name
            });

            // Ici vous feriez l'appel réel à votre API Symfony
            // const response = await fetch('/api/countries', {
            //   method: 'POST',
            //   body: formDataToSend,
            //   headers: {
            //     'Authorization': `Bearer ${userToken}`
            //   }
            // });

            alert('Pays créé avec succès ! Redirection vers l\'éditeur de contenu...');
            // Redirection vers l'étape 2 ou vers la liste des pays
            // navigate('/admin/countries/edit/' + newCountryId);

        } catch (error) {
            console.error('Erreur lors de la création du pays:', error);
            alert('Erreur lors de la création du pays. Veuillez réessayer.');
        } finally {
            setLoading(false);
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
                            onClick={() => window.history.back()}
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
                                    className="w-full px-3 py-2 border rounded-lg appearance-none bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                                    style={{
                                        borderColor: '#ddd',
                                        '--tw-ring-color': '#F3CB23'
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
                                {/* Icône de sélection personnalisée */}
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <svg className="w-4 h-4" style={{ color: '#666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

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
                                className="border-2 border-dashed rounded-lg p-6 transition-all duration-200 hover:border-opacity-70 cursor-pointer"
                                style={{ borderColor: '#F3CB23' }}
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
                                onChange={(e) => setFormData(prev => ({ ...prev, introductionText: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                                style={{
                                    borderColor: '#ddd',
                                    '--tw-ring-color': '#F3CB23'
                                }}
                                rows={6}
                                placeholder="Écrivez une introduction captivante sur ce pays, son histoire, sa culture, ce qui le rend unique..."
                                required
                            />
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs" style={{ color: formData.introductionText.length < 50 ? '#dc2626' : '#666' }}>
                                    {formData.introductionText.length} caractères {formData.introductionText.length < 50 && '(minimum 50)'}
                                </span>
                                <span className="text-xs" style={{ color: '#666' }}>
                                    Recommandé : 200-500 caractères
                                </span>
                            </div>
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
                                    <p className="text-sm leading-relaxed" style={{ color: '#1c2a28' }}>
                                        {formData.introductionText}
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 border-t" style={{ backgroundColor: '#ECF3F0', borderColor: '#e0e0e0' }}>
                        <div className="flex items-center justify-between">
                            <div className="text-sm flex items-center space-x-4" style={{ color: '#666' }}>
                                <span>Les champs marqués d'un * sont obligatoires</span>
                                {countries.length > 0 && (
                                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#F3CB23', color: 'white' }}>
                                        {countries.length} pays disponibles
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={resetForm}
                                    className="px-4 py-2 text-sm hover:opacity-70 transition-opacity"
                                    style={{ color: '#666' }}
                                >
                                    Réinitialiser
                                </button>
                                <button
                                    onClick={() => window.history.back()}
                                    className="px-4 py-2 bg-white border rounded-lg hover:opacity-70 transition-opacity"
                                    style={{ color: '#1c2a28', borderColor: '#ddd' }}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !formData.selectedCountry || !formData.countryImage || !formData.introductionText.trim() || formData.introductionText.length < 50}
                                    className="px-6 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
                                    style={{ backgroundColor: '#F3CB23' }}
                                >
                                    {loading && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    )}
                                    <span>{loading ? 'Création...' : 'Continuer vers l\'éditeur'}</span>
                                    {!loading && <ArrowRight size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CountryForm;