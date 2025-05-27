import React, { useState, useEffect } from 'react';
import { Globe, MapPin, Users, Calendar, Star, Share2, Bookmark, ArrowLeft } from 'lucide-react';

const CountryPage = ({ countryId }) => {
    const [countryData, setCountryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCountryData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Appel API pour récupérer les données du pays + sections
                const response = await fetch(`/api/countries/${countryId}/full`);

                if (!response.ok) {
                    throw new Error('Pays non trouvé');
                }

                const data = await response.json();
                setCountryData(data);

            } catch (error) {
                console.error('Erreur lors du chargement:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (countryId) {
            fetchCountryData();
        }
    }, [countryId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ECF3F0' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#F3CB23' }}></div>
                    <p style={{ color: '#1c2a28' }}>Chargement de la page...</p>
                </div>
            </div>
        );
    }

    if (error || !countryData) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ECF3F0' }}>
                <div className="text-center">
                    <Globe size={48} style={{ color: '#F3CB23' }} className="mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2" style={{ color: '#1c2a28' }}>
                        {error || 'Pays non trouvé'}
                    </h2>
                    <p style={{ color: '#666' }}>Cette page n'existe pas ou n'est pas encore publiée.</p>
                </div>
            </div>
        );
    }

    // Fonction pour rendre le contenu des sections
    const renderSection = (section) => {
        switch (section.type) {
            case 'text':
                return (
                    <div key={section.id} className="prose max-w-none">
                        {section.title && (
                            <h2 className="text-2xl font-bold mb-6" style={{ color: '#1c2a28' }}>
                                {section.title}
                            </h2>
                        )}
                        <div
                            className="text-base leading-relaxed"
                            style={{ color: '#1c2a28' }}
                            dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                    </div>
                );

            case 'image':
                return (
                    <div key={section.id} className="my-8">
                        {section.image_url && (
                            <>
                                <img
                                    src={section.image_url}
                                    alt={section.caption || 'Image de contenu'}
                                    className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
                                />
                                {section.caption && (
                                    <p className="text-center text-sm mt-3 italic" style={{ color: '#666' }}>
                                        {section.caption}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                );

            case 'video':
                return (
                    <div key={section.id} className="my-8">
                        {section.title && (
                            <h3 className="text-xl font-semibold mb-4 text-center" style={{ color: '#1c2a28' }}>
                                {section.title}
                            </h3>
                        )}
                        {section.video_url && (
                            <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#F3CB23' }}>
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                                <p className="text-lg font-medium mb-2" style={{ color: '#1c2a28' }}>Vidéo disponible</p>
                                <p className="text-sm" style={{ color: '#666' }}>Cliquez pour regarder</p>
                                <a
                                    href={section.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-3 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: '#F3CB23' }}
                                >
                                    Regarder la vidéo
                                </a>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#ECF3F0' }}>
            {/* Navigation supérieure */}
            <nav className="bg-white shadow-sm border-b" style={{ borderColor: '#e0e0e0' }}>
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => window.history.back()}
                                className="flex items-center space-x-2 hover:opacity-70 transition-opacity"
                            >
                                <ArrowLeft size={20} style={{ color: '#1c2a28' }} />
                                <span style={{ color: '#1c2a28' }}>Retour</span>
                            </button>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <Bookmark size={20} style={{ color: '#666' }} />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <Share2 size={20} style={{ color: '#666' }} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Image hero avec overlay - Style de votre exemple */}
            <div className="relative h-96 overflow-hidden">
                <img
                    src={countryData.country_image || countryData.image_url}
                    alt={countryData.name}
                    className="w-full h-full object-cover"
                />
                {/* Overlay sombre */}
                <div className="absolute inset-0" style={{ backgroundColor: 'rgba(28, 42, 40, 0.7)' }}></div>

                {/* Contenu superposé */}
                <div className="absolute inset-0 flex items-center">
                    <div className="max-w-7xl mx-auto px-6 w-full">
                        <div className="max-w-3xl">
                            {/* Drapeau et nom du pays */}
                            <div className="flex items-center space-x-4 mb-6">
                                <img
                                    src={countryData.flag_url}
                                    alt={`Drapeau ${countryData.name}`}
                                    className="w-16 h-12 object-cover rounded shadow-lg"
                                />
                                <h1 className="text-5xl font-bold text-white">
                                    {countryData.name}
                                </h1>
                            </div>

                            {/* Description principale */}
                            <p className="text-xl text-white text-opacity-90 leading-relaxed">
                                {countryData.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-lg shadow-sm p-8">
                    {/* Rendu des sections de contenu */}
                    {countryData.sections && countryData.sections.length > 0 ? (
                        <div className="space-y-12">
                            {countryData.sections
                                .sort((a, b) => (a.order || 0) - (b.order || 0))
                                .map(renderSection)}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Globe size={48} style={{ color: '#F3CB23' }} className="mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2" style={{ color: '#1c2a28' }}>
                                Contenu en cours de création
                            </h3>
                            <p style={{ color: '#666' }}>
                                Le contenu détaillé de cette page sera bientôt disponible.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer de page */}
            <footer className="bg-white border-t" style={{ borderColor: '#e0e0e0' }}>
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Globe style={{ color: '#F3CB23' }} size={24} />
                            <span className="font-semibold" style={{ color: '#1c2a28' }}>ATLAS</span>
                        </div>
                        {countryData.updated_at && (
                            <div className="text-sm" style={{ color: '#666' }}>
                                Dernière mise à jour : {new Date(countryData.updated_at).toLocaleDateString('fr-FR')}
                            </div>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default CountryPage;