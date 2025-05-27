import React, { useState } from 'react';
import {
    Globe, Plus, Type, Image, Video, Move, Trash2,
    Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight,
    Eye, Save, ArrowLeft, Upload, Play
} from 'lucide-react';

const CountryContent = () => {
    // Données du pays (provenant de l'étape 1)
    const [countryData] = useState({
        name: 'France',
        code: 'FR',
        flag: 'https://flagcdn.com/w320/fr.png',
        image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=800',
        description: 'Pays de la gastronomie et de l\'art de vivre, la France offre une richesse culturelle exceptionnelle avec ses monuments historiques, sa cuisine raffinée et ses paysages variés.'
    });

    const [sections, setSections] = useState([]);
    const [previewMode, setPreviewMode] = useState(false);
    const [loading, setLoading] = useState(false);

    // Types de sections disponibles
    const sectionTypes = [
        { id: 'text', name: 'Paragraphe de texte', icon: Type, description: 'Ajouter du contenu textuel' },
        { id: 'image', name: 'Image', icon: Image, description: 'Ajouter une image avec légende' },
        { id: 'video', name: 'Vidéo', icon: Video, description: 'Intégrer une vidéo YouTube/Vimeo' }
    ];

    // Ajouter une nouvelle section
    const addSection = (type) => {
        const newSection = {
            id: Date.now(),
            type: type,
            content: type === 'text' ? '' : '',
            title: '',
            imageUrl: '',
            videoUrl: '',
            caption: '',
            alignment: 'left',
            order: sections.length
        };
        setSections([...sections, newSection]);
    };

    // Supprimer une section
    const removeSection = (sectionId) => {
        setSections(sections.filter(section => section.id !== sectionId));
    };

    // Mettre à jour une section
    const updateSection = (sectionId, updates) => {
        setSections(sections.map(section =>
            section.id === sectionId ? { ...section, ...updates } : section
        ));
    };

    // Déplacer une section
    const moveSection = (sectionId, direction) => {
        const currentIndex = sections.findIndex(section => section.id === sectionId);
        if (
            (direction === 'up' && currentIndex === 0) ||
            (direction === 'down' && currentIndex === sections.length - 1)
        ) return;

        const newSections = [...sections];
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        [newSections[currentIndex], newSections[targetIndex]] = [newSections[targetIndex], newSections[currentIndex]];
        setSections(newSections);
    };

    // Barre d'outils de formatage
    const TextToolbar = ({ sectionId, content, onUpdate }) => {
        const [selectedText, setSelectedText] = useState('');

        const formatText = (command) => {
            document.execCommand(command, false, null);
        };

        return (
            <div className="flex items-center space-x-2 p-2 border-b" style={{ borderColor: '#e0e0e0', backgroundColor: '#f9f9f9' }}>
                <button
                    onClick={() => formatText('bold')}
                    className="p-1 rounded hover:bg-white transition-colors"
                    title="Gras"
                >
                    <Bold size={16} style={{ color: '#1c2a28' }} />
                </button>
                <button
                    onClick={() => formatText('italic')}
                    className="p-1 rounded hover:bg-white transition-colors"
                    title="Italique"
                >
                    <Italic size={16} style={{ color: '#1c2a28' }} />
                </button>
                <button
                    onClick={() => formatText('underline')}
                    className="p-1 rounded hover:bg-white transition-colors"
                    title="Souligné"
                >
                    <Underline size={16} style={{ color: '#1c2a28' }} />
                </button>
                <div className="w-px h-4" style={{ backgroundColor: '#e0e0e0' }}></div>
                <button
                    onClick={() => formatText('insertUnorderedList')}
                    className="p-1 rounded hover:bg-white transition-colors"
                    title="Liste à puces"
                >
                    <List size={16} style={{ color: '#1c2a28' }} />
                </button>
                <div className="w-px h-4" style={{ backgroundColor: '#e0e0e0' }}></div>
                <button
                    onClick={() => formatText('justifyLeft')}
                    className="p-1 rounded hover:bg-white transition-colors"
                    title="Aligner à gauche"
                >
                    <AlignLeft size={16} style={{ color: '#1c2a28' }} />
                </button>
                <button
                    onClick={() => formatText('justifyCenter')}
                    className="p-1 rounded hover:bg-white transition-colors"
                    title="Centrer"
                >
                    <AlignCenter size={16} style={{ color: '#1c2a28' }} />
                </button>
                <button
                    onClick={() => formatText('justifyRight')}
                    className="p-1 rounded hover:bg-white transition-colors"
                    title="Aligner à droite"
                >
                    <AlignRight size={16} style={{ color: '#1c2a28' }} />
                </button>
            </div>
        );
    };

    // Composant section de texte
    const TextSection = ({ section }) => (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#e0e0e0' }}>
            <div className="flex items-center justify-between p-3" style={{ backgroundColor: '#ECF3F0' }}>
                <div className="flex items-center space-x-2">
                    <Type size={16} style={{ color: '#F3CB23' }} />
                    <span className="text-sm font-medium" style={{ color: '#1c2a28' }}>Paragraphe de texte</span>
                </div>
                <SectionControls sectionId={section.id} />
            </div>

            <input
                type="text"
                placeholder="Titre de la section (optionnel)"
                value={section.title}
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                className="w-full px-3 py-2 border-b focus:outline-none"
                style={{ borderColor: '#e0e0e0' }}
            />

            <TextToolbar sectionId={section.id} content={section.content} onUpdate={updateSection} />

            <div
                contentEditable
                suppressContentEditableWarning
                className="p-4 min-h-32 focus:outline-none"
                style={{ color: '#1c2a28' }}
                onInput={(e) => updateSection(section.id, { content: e.target.innerHTML })}
                placeholder="Écrivez votre contenu ici..."
            />
        </div>
    );

    // Composant section d'image
    const ImageSection = ({ section }) => (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#e0e0e0' }}>
            <div className="flex items-center justify-between p-3" style={{ backgroundColor: '#ECF3F0' }}>
                <div className="flex items-center space-x-2">
                    <Image size={16} style={{ color: '#F3CB23' }} />
                    <span className="text-sm font-medium" style={{ color: '#1c2a28' }}>Image</span>
                </div>
                <SectionControls sectionId={section.id} />
            </div>

            <div className="p-4 space-y-4">
                {!section.imageUrl ? (
                    <div
                        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-opacity-70 transition-all"
                        style={{ borderColor: '#F3CB23' }}
                        onClick={() => document.getElementById(`image-upload-${section.id}`).click()}
                    >
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`image-upload-${section.id}`}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (e) => updateSection(section.id, { imageUrl: e.target.result });
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                        <Upload className="mx-auto mb-2" style={{ color: '#666' }} size={32} />
                        <p className="text-sm" style={{ color: '#666' }}>
                            <span className="font-medium" style={{ color: '#F3CB23' }}>Cliquez pour sélectionner</span> une image
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <img
                            src={section.imageUrl}
                            alt="Image de section"
                            className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                placeholder="URL de l'image"
                                value={section.imageUrl}
                                onChange={(e) => updateSection(section.id, { imageUrl: e.target.value })}
                                className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-opacity-50"
                                style={{ borderColor: '#ddd', '--tw-ring-color': '#F3CB23' }}
                            />
                            <button
                                onClick={() => updateSection(section.id, { imageUrl: '' })}
                                className="px-3 py-2 text-sm rounded hover:bg-red-50"
                                style={{ color: '#dc2626' }}
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                )}

                <input
                    type="text"
                    placeholder="Légende de l'image (optionnel)"
                    value={section.caption}
                    onChange={(e) => updateSection(section.id, { caption: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{ borderColor: '#ddd', '--tw-ring-color': '#F3CB23' }}
                />
            </div>
        </div>
    );

    // Composant section vidéo
    const VideoSection = ({ section }) => (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#e0e0e0' }}>
            <div className="flex items-center justify-between p-3" style={{ backgroundColor: '#ECF3F0' }}>
                <div className="flex items-center space-x-2">
                    <Video size={16} style={{ color: '#F3CB23' }} />
                    <span className="text-sm font-medium" style={{ color: '#1c2a28' }}>Vidéo</span>
                </div>
                <SectionControls sectionId={section.id} />
            </div>

            <div className="p-4 space-y-4">
                <input
                    type="url"
                    placeholder="URL de la vidéo (YouTube, Vimeo...)"
                    value={section.videoUrl}
                    onChange={(e) => updateSection(section.id, { videoUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{ borderColor: '#ddd', '--tw-ring-color': '#F3CB23' }}
                />

                {section.videoUrl && (
                    <div className="bg-gray-100 rounded-lg p-8 text-center">
                        <Play className="mx-auto mb-2" style={{ color: '#666' }} size={32} />
                        <p className="text-sm" style={{ color: '#666' }}>Aperçu vidéo</p>
                        <p className="text-xs mt-1" style={{ color: '#999' }}>{section.videoUrl}</p>
                    </div>
                )}

                <input
                    type="text"
                    placeholder="Titre de la vidéo (optionnel)"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{ borderColor: '#ddd', '--tw-ring-color': '#F3CB23' }}
                />
            </div>
        </div>
    );

    // Contrôles de section (déplacer, supprimer)
    const SectionControls = ({ sectionId }) => (
        <div className="flex items-center space-x-1">
            <button
                onClick={() => moveSection(sectionId, 'up')}
                className="p-1 rounded hover:bg-white transition-colors"
                title="Déplacer vers le haut"
            >
                <Move size={14} style={{ color: '#666', transform: 'rotate(-90deg)' }} />
            </button>
            <button
                onClick={() => moveSection(sectionId, 'down')}
                className="p-1 rounded hover:bg-white transition-colors"
                title="Déplacer vers le bas"
            >
                <Move size={14} style={{ color: '#666', transform: 'rotate(90deg)' }} />
            </button>
            <button
                onClick={() => removeSection(sectionId)}
                className="p-1 rounded hover:bg-red-50 transition-colors"
                title="Supprimer"
            >
                <Trash2 size={14} style={{ color: '#dc2626' }} />
            </button>
        </div>
    );

    // Sauvegarde du contenu
    const handleSave = async () => {
        setLoading(true);
        try {
            // Simulation de l'appel API
            await new Promise(resolve => setTimeout(resolve, 2000));

            const pageData = {
                country_id: countryData.id,
                sections: sections.map((section, index) => ({
                    ...section,
                    order: index,
                    type: section.type,
                    content: section.content,
                    title: section.title,
                    image_url: section.imageUrl,
                    video_url: section.videoUrl,
                    caption: section.caption
                }))
            };

            console.log('Données à sauvegarder:', pageData);
            alert('Page pays sauvegardée avec succès !');

        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    // Rendu d'une section selon son type
    const renderSection = (section) => {
        switch (section.type) {
            case 'text':
                return <TextSection key={section.id} section={section} />;
            case 'image':
                return <ImageSection key={section.id} section={section} />;
            case 'video':
                return <VideoSection key={section.id} section={section} />;
            default:
                return null;
        }
    };

    // Mode prévisualisation
    const PreviewMode = () => (
        <div className="max-w-4xl mx-auto">
            {/* En-tête du pays */}
            <div className="relative mb-8">
                <img
                    src={countryData.image}
                    alt={countryData.name}
                    className="w-full h-64 object-cover rounded-lg"
                />
                <div className="absolute inset-0 flex items-end rounded-lg" style={{ backgroundColor: 'rgba(28, 42, 40, 0.6)' }}>
                    <div className="text-white p-6 w-full">
                        <h1 className="text-3xl font-bold mb-3">{countryData.name}</h1>
                        <p className="text-lg opacity-90">{countryData.description}</p>
                    </div>
                </div>
            </div>

            {/* Contenu des sections */}
            <div className="space-y-8">
                {sections.map((section, index) => (
                    <div key={section.id} className="prose max-w-none">
                        {section.type === 'text' && (
                            <div>
                                {section.title && <h2 className="text-2xl font-bold mb-4" style={{ color: '#1c2a28' }}>{section.title}</h2>}
                                <div
                                    dangerouslySetInnerHTML={{ __html: section.content }}
                                    style={{ color: '#1c2a28' }}
                                />
                            </div>
                        )}

                        {section.type === 'image' && section.imageUrl && (
                            <div className="text-center">
                                <img
                                    src={section.imageUrl}
                                    alt="Image de contenu"
                                    className="w-full max-w-2xl mx-auto rounded-lg shadow-sm"
                                />
                                {section.caption && (
                                    <p className="text-sm mt-2 italic" style={{ color: '#666' }}>{section.caption}</p>
                                )}
                            </div>
                        )}

                        {section.type === 'video' && section.videoUrl && (
                            <div className="text-center">
                                {section.title && <h3 className="text-xl font-semibold mb-4" style={{ color: '#1c2a28' }}>{section.title}</h3>}
                                <div className="bg-gray-100 rounded-lg p-12">
                                    <Play className="mx-auto mb-4" style={{ color: '#F3CB23' }} size={48} />
                                    <p className="text-lg font-medium" style={{ color: '#1c2a28' }}>Vidéo intégrée</p>
                                    <p className="text-sm mt-2" style={{ color: '#666' }}>{section.videoUrl}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#ECF3F0' }}>
            {/* Header */}
            <div className="bg-white shadow-sm border-b" style={{ borderColor: '#e0e0e0' }}>
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Globe style={{ color: '#F3CB23' }} size={24} />
                                <div>
                                    <h1 className="text-xl font-semibold" style={{ color: '#1c2a28' }}>
                                        Éditeur de contenu - {countryData.name}
                                    </h1>
                                    <p className="text-sm" style={{ color: '#666' }}>
                                        Ajoutez et organisez le contenu de la page pays
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setPreviewMode(!previewMode)}
                                className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:opacity-70 transition-opacity"
                                style={{ color: '#1c2a28', borderColor: '#ddd' }}
                            >
                                <Eye size={16} />
                                <span>{previewMode ? 'Retour à l\'éditeur' : 'Aperçu'}</span>
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                                style={{ backgroundColor: '#F3CB23' }}
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <Save size={16} />
                                )}
                                <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {previewMode ? (
                    <PreviewMode />
                ) : (
                    <div className="grid grid-cols-12 gap-6">
                        {/* Panneau d'ajout de sections */}
                        <div className="col-span-3">
                            <div className="bg-white rounded-lg shadow-sm border sticky top-6" style={{ borderColor: '#e0e0e0' }}>
                                <div className="p-4 border-b" style={{ borderColor: '#e0e0e0' }}>
                                    <h3 className="font-medium" style={{ color: '#1c2a28' }}>Ajouter une section</h3>
                                    <p className="text-xs mt-1" style={{ color: '#666' }}>
                                        Cliquez pour ajouter du contenu
                                    </p>
                                </div>
                                <div className="p-4 space-y-3">
                                    {sectionTypes.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => addSection(type.id)}
                                            className="w-full p-3 border rounded-lg hover:border-opacity-70 transition-all text-left"
                                            style={{ borderColor: '#F3CB23' }}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <type.icon size={20} style={{ color: '#F3CB23' }} />
                                                <div>
                                                    <p className="text-sm font-medium" style={{ color: '#1c2a28' }}>{type.name}</p>
                                                    <p className="text-xs" style={{ color: '#666' }}>{type.description}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Zone d'édition */}
                        <div className="col-span-9">
                            <div className="space-y-6">
                                {sections.length === 0 ? (
                                    <div className="bg-white rounded-lg border-2 border-dashed p-12 text-center" style={{ borderColor: '#F3CB23' }}>
                                        <Plus className="mx-auto mb-4" size={48} style={{ color: '#F3CB23' }} />
                                        <h3 className="text-lg font-medium mb-2" style={{ color: '#1c2a28' }}>
                                            Commencez à créer votre contenu
                                        </h3>
                                        <p className="text-sm" style={{ color: '#666' }}>
                                            Utilisez le panneau de gauche pour ajouter des sections de texte, images ou vidéos
                                        </p>
                                    </div>
                                ) : (
                                    sections.map(renderSection)
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CountryContent;