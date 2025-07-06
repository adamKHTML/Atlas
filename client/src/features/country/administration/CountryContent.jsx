import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
    Move,
    Upload,
    Eye,
    Save
} from 'lucide-react';
import { useUpdateCountryContentMutation, useUploadSectionImageMutation } from '../../../api/endpoints/admin/countries';

const CountryContent = () => {
    const navigate = useNavigate();
    const { countryId } = useParams();
    const location = useLocation();

    // Récupération des données du pays depuis l'étape 1
    const countryData = location.state?.countryData;
    const fromCreation = location.state?.fromCreation;

    const [updateCountryContent, { isLoading: isUpdating }] = useUpdateCountryContentMutation();
    const [uploadSectionImage, { isLoading: isUploading }] = useUploadSectionImageMutation();

    const [sections, setSections] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [errors, setErrors] = useState({});

    // Initialisation avec une section par défaut
    useEffect(() => {
        if (sections.length === 0) {
            setSections([{
                id: Date.now(),
                type: 'text',
                title: '',
                content: '',
                imageUrl: null,
                order: 1
            }]);
        }
    }, []);

    // Types de sections disponibles
    const sectionTypes = [
        { id: 'text', label: 'Texte', icon: Type, description: 'Paragraphe de texte' },
        { id: 'image', label: 'Image', icon: ImageIcon, description: 'Image avec légende' },
        { id: 'video', label: 'Vidéo', icon: Video, description: 'Vidéo YouTube/Vimeo' }
    ];

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
    };

    const updateSection = (sectionId, field, value) => {
        setSections(sections.map(section =>
            section.id === sectionId
                ? { ...section, [field]: value }
                : section
        ));

        // Réinitialiser l'erreur pour cette section
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
    };

    const handleImageUpload = async (sectionId, file) => {
        if (!file) return;

        // Validation côté client
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
            console.log('📤 Upload d\'image en cours...', { sectionId, fileName: file.name });

            const imageUrl = await uploadSectionImage({
                countryId: parseInt(countryId),
                imageFile: file
            }).unwrap();

            console.log('✅ Image uploadée avec succès:', imageUrl);

            updateSection(sectionId, 'imageUrl', imageUrl);

            // Réinitialiser les erreurs pour cette section
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

    const validateSections = () => {
        const newErrors = {};
        let hasErrors = false;

        sections.forEach(section => {
            const sectionErrors = {};

            if (!section.title.trim()) {
                sectionErrors.title = 'Le titre est obligatoire';
                hasErrors = true;
            }

            if (section.type === 'text' && !section.content.trim()) {
                sectionErrors.content = 'Le contenu est obligatoire';
                hasErrors = true;
            }

            if (section.type === 'image' && !section.imageUrl) {
                sectionErrors.image = 'Veuillez ajouter une image';
                hasErrors = true;
            }

            if (Object.keys(sectionErrors).length > 0) {
                newErrors[section.id] = sectionErrors;
            }
        });

        setErrors(newErrors);
        return !hasErrors;
    };

    const handleSave = async () => {
        if (!validateSections()) {
            return;
        }

        try {
            console.log('📤 Sections avant envoi:', sections);

            // 🔧 SIMPLIFICATION : Envoyez directement les sections
            // La transformation se fait maintenant dans l'API
            const result = await updateCountryContent({
                countryId: parseInt(countryId),
                sections: sections // ✅ Envoi direct, transformation dans l'API
            }).unwrap();

            console.log('✅ Contenu sauvegardé avec succès:', result);

            // Redirection vers le Dashboard avec message de succès
            navigate('/Dashboard', {
                state: {
                    message: `Le pays "${countryData?.name || 'nouveau pays'}" a été créé avec succès !`,
                    type: 'success'
                }
            });

        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);

            // Affichage d'une erreur plus détaillée
            const errorMessage = error?.data?.error || error?.message || 'Erreur lors de la sauvegarde. Veuillez réessayer.';
            setErrors({ general: errorMessage });
        }
    };

    const renderSectionEditor = (section, index) => {
        const sectionErrors = errors[section.id] || {};

        return (
            <div key={section.id} className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: '#e0e0e0' }}>
                {/* En-tête de section */}
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

                {/* Contenu de la section */}
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
                                        src={section.imageUrl}
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

                            {/* Légende */}
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
            {/* Header */}
            <div className="bg-white shadow-sm border-b" style={{ borderColor: '#e0e0e0' }}>
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Globe style={{ color: '#F3CB23' }} size={24} />
                                <h1 className="text-xl font-semibold" style={{ color: '#1c2a28' }}>
                                    Éditeur de contenu - {countryData?.name || 'Pays'}
                                </h1>
                            </div>
                            <div className="flex items-center space-x-2 text-sm" style={{ color: '#666' }}>
                                <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#e0e0e0', color: '#666' }}>1</span>
                                <span>Informations de base</span>
                                <ArrowRight size={16} style={{ color: '#ccc' }} />
                                <span className="text-white px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#F3CB23' }}>2</span>
                                <span>Éditeur de contenu</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                                style={{ color: '#1c2a28', borderColor: '#ddd' }}
                            >
                                <Eye size={16} />
                                <span>{showPreview ? 'Éditeur' : 'Aperçu'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Panel principal */}
                    <div className="lg:col-span-3 space-y-6">
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-600">{errors.general}</p>
                            </div>
                        )}

                        {/* En-tête informatif */}
                        <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#e0e0e0' }}>
                            <h2 className="text-lg font-medium mb-2" style={{ color: '#1c2a28' }}>
                                Ajoutez le contenu de votre pays
                            </h2>
                            <p className="text-sm" style={{ color: '#666' }}>
                                Créez des sections pour présenter l'histoire, la culture, la géographie et tout ce qui rend ce pays unique.
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
                        {/* Actions */}
                        <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#e0e0e0' }}>
                            <h3 className="font-medium mb-4" style={{ color: '#1c2a28' }}>Actions</h3>

                            <div className="space-y-3">
                                <button
                                    onClick={handleSave}
                                    disabled={isUpdating || sections.length === 0}
                                    className="w-full px-4 py-2 text-white rounded-lg font-medium transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                                    style={{ backgroundColor: '#F3CB23' }}
                                >
                                    {isUpdating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                            <span>Enregistrement...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            <span>Enregistrer</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => navigate('/Dashboard')}
                                    className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                                    style={{ color: '#1c2a28', borderColor: '#ddd' }}
                                    disabled={isUpdating}
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>

                        {/* Informations du pays */}
                        {countryData && (
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
                                </div>
                            </div>
                        )}

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

                {/* Aperçu modal */}
                {showPreview && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="text-lg font-medium" style={{ color: '#1c2a28' }}>
                                    Aperçu - {countryData?.name}
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
                                        {countryData?.name}
                                    </h1>
                                    <p className="text-gray-600">
                                        {countryData?.description}
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
                                                        src={section.imageUrl}
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

export default CountryContent;