import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Globe,
    ArrowRight,
    ArrowLeft,
    Check,
    Plus,
    Trash2,
    Image as ImageIcon,
    Type,
    Video,
    Upload,
    Eye,
    Save,
    Edit3
} from 'lucide-react';
import { getNames, getCodes } from 'country-list';
import {
    useGetCountryWithContentQuery
} from '../../../api/endpoints/countries';
import {
    useUpdateCountryMutation,
    useUpdateCountryContentMutation,
    useUploadSectionImageMutation
} from '../../../api/endpoints/admin/countries';

const CountryEdit = () => {
    const navigate = useNavigate();
    const { countryId } = useParams();

    // RTK Query hooks
    const {
        data: countryData,
        isLoading: isLoadingCountry,
        error: countryError
    } = useGetCountryWithContentQuery(countryId);

    const [updateCountry, { isLoading: isUpdatingCountry }] = useUpdateCountryMutation();
    const [updateCountryContent, { isLoading: isUpdatingContent }] = useUpdateCountryContentMutation();
    const [uploadSectionImage, { isLoading: isUploading }] = useUploadSectionImageMutation();

    // États du formulaire
    const [activeTab, setActiveTab] = useState('basic'); // 'basic' ou 'content'
    const [hasChanges, setHasChanges] = useState(false);

    // États pour les infos de base (comme CountryForm)
    const [formData, setFormData] = useState({
        selectedCountry: '',
        countryCode: '',
        countryImage: null,
        introductionText: '',
        flagUrl: ''
    });
    const [imagePreview, setImagePreview] = useState('');
    const [countries, setCountries] = useState([]);

    // États pour le contenu (comme CountryContent)
    const [sections, setSections] = useState([]);
    const [showPreview, setShowPreview] = useState(false);

    // Erreurs
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
        }
    }, []);

    // Pré-remplissage avec les données existantes
    useEffect(() => {
        if (countryData) {
            console.log('🔄 Chargement des données du pays:', countryData);

            // Pré-remplir les infos de base
            setFormData({
                selectedCountry: countryData.name || '',
                countryCode: countryData.code || '',
                countryImage: null, // Sera null car on garde l'existante
                introductionText: countryData.description || '',
                flagUrl: countryData.flag_url || ''
            });

            // Définir l'aperçu de l'image existante
            if (countryData.country_image) {
                setImagePreview(`http://localhost:8000${countryData.country_image}`);
            }

            // Pré-remplir les sections de contenu
            if (countryData.sections && countryData.sections.length > 0) {
                const transformedSections = countryData.sections.map((section, index) => ({
                    id: section.id || Date.now() + index,
                    type: section.type || 'text',
                    title: section.title || '',
                    content: section.content || '',
                    imageUrl: section.image_url || null,
                    order: index + 1
                }));
                setSections(transformedSections);
            } else {
                // Section par défaut si pas de contenu
                setSections([{
                    id: Date.now(),
                    type: 'text',
                    title: '',
                    content: '',
                    imageUrl: null,
                    order: 1
                }]);
            }
        }
    }, [countryData]);

    // Types de sections disponibles
    const sectionTypes = [
        { id: 'text', label: 'Texte', icon: Type, description: 'Paragraphe de texte' },
        { id: 'image', label: 'Image', icon: ImageIcon, description: 'Image avec légende' },
        { id: 'video', label: 'Vidéo', icon: Video, description: 'Vidéo YouTube/Vimeo' }
    ];

    // ==========================================
    // 📌 GESTION DES INFOS DE BASE
    // ==========================================

    const selectedCountryData = countries.find(c => c.name === formData.selectedCountry);

    const handleCountryChange = (e) => {
        const selectedName = e.target.value;
        const selectedCountry = countries.find(c => c.name === selectedName);

        setFormData(prev => ({
            ...prev,
            selectedCountry: selectedName,
            countryCode: selectedCountry ? selectedCountry.code : '',
            flagUrl: selectedCountry ? selectedCountry.flag : ''
        }));

        setHasChanges(true);

        if (errors.selectedCountry) {
            setErrors(prev => ({ ...prev, selectedCountry: null }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
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

            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);

            setHasChanges(true);

            if (errors.countryImage) {
                setErrors(prev => ({ ...prev, countryImage: null }));
            }
        }
    };

    const handleTextChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);

        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    // ==========================================
    // 📌 GESTION DU CONTENU
    // ==========================================

    const addSection = (type = 'text') => {
        const newSection = {
            id: Date.now(),
            type,
            title: '',
            content: '',
            imageUrl: null,
            order: sections.length + 1
        };
        setSections([...sections, newSection]);
        setHasChanges(true);
    };

    const updateSection = (sectionId, field, value) => {
        setSections(sections.map(section =>
            section.id === sectionId
                ? { ...section, [field]: value }
                : section
        ));

        setHasChanges(true);

        if (errors[sectionId]) {
            setErrors(prev => ({
                ...prev,
                [sectionId]: { ...prev[sectionId], [field]: null }
            }));
        }
    };

    const removeSection = (sectionId) => {
        if (sections.length <= 1) {
            alert('Vous devez conserver au moins une section');
            return;
        }
        setSections(sections.filter(section => section.id !== sectionId));
        setHasChanges(true);
    };

    const moveSection = (sectionId, direction) => {
        const index = sections.findIndex(s => s.id === sectionId);
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === sections.length - 1)
        ) {
            return;
        }

        const newSections = [...sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];

        setSections(newSections.map((section, idx) => ({
            ...section,
            order: idx + 1
        })));

        setHasChanges(true);
    };

    const handleImageUpload = async (sectionId, file) => {
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({
                ...prev,
                [sectionId]: { ...prev[sectionId], image: 'L\'image ne doit pas dépasser 5MB' }
            }));
            return;
        }

        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({
                ...prev,
                [sectionId]: { ...prev[sectionId], image: 'Veuillez sélectionner un fichier image valide' }
            }));
            return;
        }

        try {
            const imageUrl = await uploadSectionImage({
                countryId: parseInt(countryId),
                imageFile: file
            }).unwrap();

            updateSection(sectionId, 'imageUrl', imageUrl);

            setErrors(prev => ({
                ...prev,
                [sectionId]: { ...prev[sectionId], image: null }
            }));

        } catch (error) {
            console.error('❌ Erreur upload image:', error);
            const errorMessage = error?.data?.error || 'Erreur lors de l\'upload de l\'image';
            setErrors(prev => ({
                ...prev,
                [sectionId]: { ...prev[sectionId], image: errorMessage }
            }));
        }
    };

    // ==========================================
    // 📌 VALIDATION ET SAUVEGARDE
    // ==========================================

    const validateForm = () => {
        const newErrors = {};

        // Validation des infos de base
        if (!formData.selectedCountry) {
            newErrors.selectedCountry = 'Veuillez sélectionner un pays';
        }

        if (!formData.introductionText.trim()) {
            newErrors.introductionText = 'Veuillez ajouter une description';
        } else if (formData.introductionText.length < 50) {
            newErrors.introductionText = 'La description doit contenir au moins 50 caractères';
        }

        // Validation des sections
        sections.forEach(section => {
            const sectionErrors = {};

            if (!section.title.trim()) {
                sectionErrors.title = 'Le titre est obligatoire';
            }

            if (section.type === 'text' && !section.content.trim()) {
                sectionErrors.content = 'Le contenu est obligatoire';
            }

            if (section.type === 'image' && !section.imageUrl) {
                sectionErrors.image = 'Veuillez ajouter une image';
            }

            if (Object.keys(sectionErrors).length > 0) {
                newErrors[section.id] = sectionErrors;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            // 1. Mise à jour des infos de base
            const updateData = {
                id: parseInt(countryId),
                name: formData.selectedCountry,
                code: formData.countryCode,
                flag_url: formData.flagUrl,
                description: formData.introductionText
            };

            if (formData.countryImage) {
                updateData.country_image = formData.countryImage;
            }

            await updateCountry(updateData).unwrap();

            // 2. Mise à jour du contenu
            await updateCountryContent({
                countryId: parseInt(countryId),
                sections: sections
            }).unwrap();

            console.log('✅ Pays mis à jour avec succès');

            // Redirection vers la page du pays
            navigate(`/country/${countryId}`, {
                state: {
                    message: `Le pays "${formData.selectedCountry}" a été mis à jour avec succès !`,
                    type: 'success'
                }
            });

        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour:', error);

            if (error.status === 409) {
                setErrors({ selectedCountry: 'Ce pays existe déjà dans le système' });
            } else if (error.status === 413) {
                setErrors({ countryImage: 'L\'image est trop volumineuse' });
            } else {
                setErrors({ general: 'Erreur lors de la mise à jour. Veuillez réessayer.' });
            }
        }
    };

    const handleCancel = () => {
        if (hasChanges) {
            const confirmLeave = window.confirm(
                'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?'
            );
            if (!confirmLeave) return;
        }

        navigate(`/country/${countryId}`);
    };

    // ==========================================
    // 📌 RENDUS CONDITIONNELS
    // ==========================================

    if (isLoadingCountry) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ECF3F0' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des données...</p>
                </div>
            </div>
        );
    }

    if (countryError || !countryData) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ECF3F0' }}>
                <div className="text-center">
                    <Globe size={48} className="text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">
                        Erreur de chargement
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Impossible de charger les données du pays.
                    </p>
                    <button
                        onClick={() => navigate(`/country/${countryId}`)}
                        className="px-6 py-2 border border-dashed border-yellow-400 text-gray-800 rounded-full hover:bg-yellow-400 transition-all duration-300"
                    >
                        ✦ Retour à la page pays ✦
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================
    // 📌 RENDU DES SECTIONS
    // ==========================================

    const renderSectionEditor = (section, index) => {
        const sectionErrors = errors[section.id] || {};

        return (
            <div key={section.id} className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: '#e0e0e0' }}>
                <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between" style={{ borderColor: '#e0e0e0' }}>
                    <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white" style={{ backgroundColor: '#F3CB23' }}>
                            {index + 1}
                        </div>
                        <select
                            value={section.type}
                            onChange={(e) => updateSection(section.id, 'type', e.target.value)}
                            className="text-sm border-none bg-transparent font-medium focus:outline-none"
                        >
                            {sectionTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => moveSection(section.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                            ↑
                        </button>
                        <button
                            onClick={() => moveSection(section.id, 'down')}
                            disabled={index === sections.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                            ↓
                        </button>
                        <button
                            onClick={() => removeSection(section.id)}
                            className="p-1 text-red-400 hover:text-red-600"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {/* Titre */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#1c2a28' }}>
                            Titre de la section *
                        </label>
                        <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 ${sectionErrors.title ? 'border-red-300' : 'border-gray-300'}`}
                            style={{ '--tw-ring-color': sectionErrors.title ? '#ef4444' : '#F3CB23' }}
                            placeholder="Ex: Histoire du pays, Culture locale..."
                        />
                        {sectionErrors.title && (
                            <p className="text-sm text-red-600 mt-1">{sectionErrors.title}</p>
                        )}
                    </div>

                    {/* Contenu selon le type */}
                    {section.type === 'text' && (
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#1c2a28' }}>
                                Contenu *
                            </label>
                            <textarea
                                value={section.content}
                                onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-opacity-50 ${sectionErrors.content ? 'border-red-300' : 'border-gray-300'}`}
                                style={{ '--tw-ring-color': sectionErrors.content ? '#ef4444' : '#F3CB23' }}
                                rows={6}
                                placeholder="Rédigez le contenu de cette section..."
                            />
                            {sectionErrors.content && (
                                <p className="text-sm text-red-600 mt-1">{sectionErrors.content}</p>
                            )}
                        </div>
                    )}

                    {section.type === 'image' && (
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#1c2a28' }}>
                                Image *
                            </label>

                            {!section.imageUrl ? (
                                <div
                                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${sectionErrors.image ? 'border-red-300' : 'border-gray-300 hover:border-yellow-400'}`}
                                    onClick={() => document.getElementById(`image-upload-${section.id}`).click()}
                                >
                                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                                    <p className="text-sm text-gray-600">Cliquez pour ajouter une image</p>
                                    <input
                                        type="file"
                                        id={`image-upload-${section.id}`}
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(section.id, e.target.files[0])}
                                        className="hidden"
                                    />
                                </div>
                            ) : (
                                <div className="relative">
                                    <img
                                        src={section.imageUrl.startsWith('http') ? section.imageUrl : `http://localhost:8000${section.imageUrl}`}
                                        alt="Section"
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                    <button
                                        onClick={() => updateSection(section.id, 'imageUrl', null)}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}

                            {sectionErrors.image && (
                                <p className="text-sm text-red-600 mt-1">{sectionErrors.image}</p>
                            )}

                            <div className="mt-3">
                                <label className="block text-sm font-medium mb-2" style={{ color: '#1c2a28' }}>
                                    Légende (optionnel)
                                </label>
                                <input
                                    type="text"
                                    value={section.content}
                                    onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                                    style={{ '--tw-ring-color': '#F3CB23' }}
                                    placeholder="Légende de l'image..."
                                />
                            </div>
                        </div>
                    )}

                    {section.type === 'video' && (
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#1c2a28' }}>
                                URL de la vidéo (YouTube, Vimeo...)
                            </label>
                            <input
                                type="url"
                                value={section.content}
                                onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                                style={{ '--tw-ring-color': '#F3CB23' }}
                                placeholder="https://youtube.com/watch?v=..."
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#ECF3F0' }}>
            {/* Header avec navigation */}
            <div className="bg-white shadow-sm border-b" style={{ borderColor: '#e0e0e0' }}>
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Globe style={{ color: '#F3CB23' }} size={24} />
                                <h1 className="text-xl font-semibold" style={{ color: '#1c2a28' }}>
                                    Modifier : {countryData.name}
                                </h1>
                            </div>
                            {hasChanges && (
                                <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                                    Modifications non sauvegardées
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleCancel}
                            className="flex items-center space-x-2 px-3 py-1 text-sm hover:opacity-70 transition-opacity"
                            style={{ color: '#1c2a28' }}
                        >
                            <ArrowLeft size={16} />
                            <span>Retour</span>
                        </button>
                    </div>

                    {/* Onglets */}
                    <div className="flex space-x-4 mt-4">
                        <button
                            onClick={() => setActiveTab('basic')}
                            className={`px-4 py-2 text-sm rounded-lg transition-all ${activeTab === 'basic'
                                ? 'bg-yellow-400 text-gray-800 font-medium'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Informations de base
                        </button>
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`px-4 py-2 text-sm rounded-lg transition-all ${activeTab === 'content'
                                ? 'bg-yellow-400 text-gray-800 font-medium'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Contenu et sections
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {errors.general && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{errors.general}</p>
                    </div>
                )}

                {/* Onglet Informations de base */}
                {activeTab === 'basic' && (
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden" style={{ borderColor: '#e0e0e0' }}>
                        <div className="px-6 py-4 border-b" style={{ backgroundColor: '#FFF8E5', borderColor: '#e0e0e0' }}>
                            <h2 className="text-lg font-medium" style={{ color: '#1c2a28' }}>
                                Informations de base du pays
                            </h2>
                            <p className="text-sm mt-1" style={{ color: '#666' }}>
                                Modifiez les informations principales qui apparaîtront en en-tête de la page.
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Sélection du pays */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#1c2a28' }}>
                                    Pays *
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.selectedCountry}
                                        onChange={handleCountryChange}
                                        className={`w-full px-3 py-2 border rounded-lg appearance-none bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${errors.selectedCountry ? 'border-red-300' : 'border-gray-300'}`}
                                        style={{ '--tw-ring-color': errors.selectedCountry ? '#ef4444' : '#F3CB23' }}
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

                                {selectedCountryData && (
                                    <div className="mt-3 flex items-center space-x-3 p-3 rounded-lg transition-all duration-200" style={{ backgroundColor: '#ECF3F0' }}>
                                        <img
                                            src={selectedCountryData.flag}
                                            alt={`Drapeau ${selectedCountryData.name}`}
                                            className="w-8 h-6 object-cover rounded border shadow-sm"
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
                                    Image de présentation du pays
                                </label>
                                <p className="text-xs mb-3" style={{ color: '#666' }}>
                                    Laissez vide pour conserver l'image actuelle. Format recommandé : 1200x600px (max 5MB)
                                </p>

                                <div
                                    className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 hover:border-opacity-70 cursor-pointer ${errors.countryImage ? 'border-red-300' : 'border-yellow-400'}`}
                                    style={{ borderColor: errors.countryImage ? '#ef4444' : '#F3CB23' }}
                                    onClick={() => document.getElementById('country-image-upload').click()}
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
                                                <span className="font-medium" style={{ color: '#F3CB23' }}>Cliquez pour changer</span> l'image
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
                                                <span>
                                                    {formData.countryImage ? 'Nouvelle image sélectionnée' : 'Image actuelle'}
                                                </span>
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
                                    Ce texte sera affiché sous l'image en en-tête de la page.
                                </p>
                                <textarea
                                    value={formData.introductionText}
                                    onChange={(e) => handleTextChange('introductionText', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${errors.introductionText ? 'border-red-300' : 'border-gray-300'}`}
                                    style={{ '--tw-ring-color': errors.introductionText ? '#ef4444' : '#F3CB23' }}
                                    rows={6}
                                    placeholder="Écrivez une introduction captivante sur ce pays..."
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
                        </div>
                    </div>
                )}

                {/* Onglet Contenu et sections */}
                {activeTab === 'content' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Panel principal */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* En-tête informatif */}
                            <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#e0e0e0' }}>
                                <h2 className="text-lg font-medium mb-2" style={{ color: '#1c2a28' }}>
                                    Contenu du pays
                                </h2>
                                <p className="text-sm" style={{ color: '#666' }}>
                                    Modifiez les sections pour présenter l'histoire, la culture, la géographie et tout ce qui rend ce pays unique.
                                </p>
                            </div>

                            {/* Sections */}
                            {sections.map((section, index) => renderSectionEditor(section, index))}

                            {/* Boutons d'ajout */}
                            <div className="flex flex-wrap gap-3">
                                {sectionTypes.map(type => {
                                    const Icon = type.icon;
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => addSection(type.id)}
                                            className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed rounded-lg hover:border-solid transition-all"
                                            style={{ borderColor: '#F3CB23', color: '#1c2a28' }}
                                        >
                                            <Icon size={16} />
                                            <span>Ajouter {type.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-4">
                            {/* Informations du pays */}
                            <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#e0e0e0' }}>
                                <h3 className="font-medium mb-3" style={{ color: '#1c2a28' }}>Informations du pays</h3>

                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium">Nom:</span> {countryData.name}
                                    </div>
                                    <div>
                                        <span className="font-medium">Code:</span> {countryData.code}
                                    </div>
                                    <div>
                                        <span className="font-medium">Sections:</span> {sections.length}
                                    </div>
                                    <div>
                                        <span className="font-medium">Créé le:</span> {new Date(countryData.created_at).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                            </div>

                            {/* Conseils */}
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <h4 className="font-medium text-blue-800 mb-2">💡 Conseils</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• Utilisez des titres clairs et informatifs</li>
                                    <li>• Alternez texte et images pour plus d'engagement</li>
                                    <li>• Les sections peuvent être réorganisées</li>
                                    <li>• Les images doivent être en haute qualité</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions en bas */}
                <div className="mt-8 bg-white rounded-lg border p-6" style={{ borderColor: '#e0e0e0' }}>
                    <div className="flex justify-between items-center">
                        <div className="text-xs" style={{ color: '#666' }}>
                            Dernière modification : {new Date(countryData.updated_at).toLocaleString('fr-FR')}
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={handleCancel}
                                className="flex items-center space-x-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                                style={{ color: '#1c2a28', borderColor: '#ddd' }}
                                disabled={isUpdatingCountry || isUpdatingContent}
                            >
                                <ArrowLeft size={16} />
                                <span>Annuler</span>
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={isUpdatingCountry || isUpdatingContent || !hasChanges || !formData.selectedCountry || !formData.introductionText.trim()}
                                className={`flex items-center space-x-2 px-6 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${isUpdatingCountry || isUpdatingContent || !hasChanges || !formData.selectedCountry || !formData.introductionText.trim()
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:shadow-lg'
                                    }`}
                                style={{
                                    backgroundColor: '#F3CB23',
                                    color: '#1c2a28',
                                    border: '1px solid #F3CB23'
                                }}
                            >
                                {isUpdatingCountry || isUpdatingContent ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        <span>Mise à jour...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        <span>Sauvegarder les modifications</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Aperçu modal */}
                {showPreview && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="text-lg font-medium" style={{ color: '#1c2a28' }}>
                                    Aperçu - {formData.selectedCountry}
                                </h3>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                                {/* En-tête du pays */}
                                <div className="mb-6">
                                    <h1 className="text-3xl font-bold mb-4" style={{ color: '#1c2a28' }}>
                                        {formData.selectedCountry}
                                    </h1>
                                    <p className="text-gray-600">
                                        {formData.introductionText}
                                    </p>
                                </div>

                                {/* Sections */}
                                <div className="space-y-8">
                                    {sections.map((section, index) => (
                                        <div key={section.id}>
                                            {section.title && (
                                                <h2 className="text-xl font-semibold mb-4" style={{ color: '#1c2a28' }}>
                                                    {section.title}
                                                </h2>
                                            )}

                                            {section.type === 'text' && section.content && (
                                                <div className="prose max-w-none">
                                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                        {section.content}
                                                    </p>
                                                </div>
                                            )}

                                            {section.type === 'image' && section.imageUrl && (
                                                <div>
                                                    <img
                                                        src={section.imageUrl.startsWith('http') ? section.imageUrl : `http://localhost:8000${section.imageUrl}`}
                                                        alt={section.title}
                                                        className="w-full rounded-lg shadow-sm"
                                                    />
                                                    {section.content && (
                                                        <p className="text-sm text-gray-600 mt-2 italic">
                                                            {section.content}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {section.type === 'video' && section.content && (
                                                <div className="aspect-video">
                                                    <iframe
                                                        src={section.content}
                                                        className="w-full h-full rounded-lg"
                                                        allowFullScreen
                                                    ></iframe>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CountryEdit;