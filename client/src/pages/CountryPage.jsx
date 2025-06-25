import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe, ShoppingCart, Share2, Bookmark, ArrowLeft } from 'lucide-react';
import { useGetCountryWithContentQuery } from '../api/endpoints/countries';

const CountryPage = () => {
    const { countryId } = useParams();
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);

    // RTK Query hook pour récupérer les données complètes du pays
    const {
        data: countryData,
        isLoading,
        error
    } = useGetCountryWithContentQuery(countryId);

    // Effet de parallax pour l'image hero
    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fonction pour scroller vers la section de contenu
    const scrollToContent = () => {
        const contentSection = document.querySelector('[data-content-section]');
        if (contentSection) {
            contentSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    // Fonction pour scroller vers la galerie/topics
    const scrollToTopics = () => {
        const contentSection = document.querySelector('[data-content-section]');
        if (contentSection) {
            contentSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#4a5c52' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                    <p className="text-white">Chargement de la page...</p>
                </div>
            </div>
        );
    }

    if (error || !countryData) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#4a5c52' }}>
                <div className="text-center">
                    <Globe size={48} className="text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2 text-white">
                        {error?.status === 404 ? 'Pays non trouvé' : 'Erreur de chargement'}
                    </h2>
                    <p className="text-gray-300">
                        {error?.status === 404
                            ? 'Cette page n\'existe pas ou n\'est pas encore publiée.'
                            : 'Une erreur est survenue lors du chargement de la page.'
                        }
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-6 py-2 border border-dashed border-yellow-400 text-yellow-400 rounded-full hover:bg-yellow-400 hover:text-gray-800 transition-all duration-300"
                    >
                        ✦ Retour à l'accueil ✦
                    </button>
                </div>
            </div>
        );
    }

    // Fonction pour partager la page
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `ATLAS - ${countryData.name}`,
                    text: countryData.description,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Erreur lors du partage:', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Lien copié dans le presse-papiers !');
        }
    };

    // Fonction pour sauvegarder/retirer des favoris
    const handleBookmark = () => {
        alert('Fonctionnalité de sauvegarde à implémenter');
    };

    // Utiliser l'image du pays depuis le backend
    const getCountryImage = () => {
        if (countryData.country_image) {
            return `http://localhost:8000${countryData.country_image}`;
        }
        return countryData.flag_url;
    };

    // Fonction pour extraire l'ID YouTube d'une URL
    const getYouTubeVideoId = (url) => {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    // Fonction pour rendre le contenu des sections
    const renderSection = (section) => {
        switch (section.type) {
            case 'text':
                return (
                    <div key={section.id} className="mb-12">
                        {section.title && (
                            <h2 className="text-2xl font-bold mb-6 text-gray-800 italic">
                                {section.title}
                            </h2>
                        )}
                        <div
                            className="text-lg leading-relaxed text-gray-700 font-light"
                            style={{
                                fontFamily: 'Georgia, serif',
                                lineHeight: '1.8'
                            }}
                            dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                    </div>
                );

            case 'image':
                return (
                    <div key={section.id} className="mb-12">
                        {section.image_url && (
                            <div className="mb-8">
                                <img
                                    src={`http://localhost:8000${section.image_url}`}
                                    alt={section.title || 'Image de contenu'}
                                    className="w-full max-w-4xl mx-auto rounded-lg shadow-2xl"
                                    style={{
                                        filter: 'sepia(0.1) contrast(1.1)',
                                        transition: 'transform 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                    loading="lazy"
                                    onError={(e) => {
                                        console.error('Erreur image:', e.target.src);
                                    }}
                                />
                                {section.title && (
                                    <p className="text-center text-sm mt-4 italic text-gray-600 font-light">
                                        {section.title}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                );

            case 'video':
                const videoId = getYouTubeVideoId(section.content);

                return (
                    <div key={section.id} className="mb-12">
                        {section.title && (
                            <h3 className="text-2xl font-semibold mb-8 text-gray-800 italic text-center">
                                {section.title}
                            </h3>
                        )}
                        {videoId ? (
                            <div className="max-w-4xl mx-auto">
                                <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${videoId}`}
                                        title={section.title || 'Vidéo'}
                                        className="absolute inset-0 w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        loading="lazy"
                                    ></iframe>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="inline-block p-8 bg-white rounded-lg shadow-lg border border-gray-200">
                                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-yellow-400 mb-6 mx-auto">
                                        <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-medium mb-2 text-gray-800">Vidéo disponible</p>
                                    <p className="text-sm mb-6 text-gray-600">Cliquez pour regarder</p>
                                    <a
                                        href={section.content}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block px-8 py-3 border border-dashed border-yellow-400 text-gray-800 rounded-full hover:bg-yellow-400 transition-all duration-300"
                                    >
                                        ✦ Regarder la vidéo ✦
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#4a5c52' }}>
            {/* 🎯 Section Hero - Style Uganda EXACT */}
            <div className="relative h-screen overflow-hidden">

                {/* Navigation supérieure - FIXE */}
                <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-8">
                            <h1 className="text-2xl font-serif italic text-white">
                                ATLAS
                            </h1>
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center space-x-2 text-white hover:text-yellow-400 transition-colors"
                            >
                                <ArrowLeft size={20} />
                                <span>Retour</span>
                            </button>
                        </div>

                        <div className="flex items-center space-x-6">
                            <ShoppingCart size={20} className="text-white hover:text-yellow-400 cursor-pointer transition-colors" />
                            <span className="text-white">|</span>
                            <button
                                onClick={handleBookmark}
                                className="text-white hover:text-yellow-400 transition-colors"
                                title="Favoris"
                            >
                                FAVORIS
                            </button>
                            <button
                                onClick={handleShare}
                                className="text-white hover:text-yellow-400 transition-colors"
                                title="Partager"
                            >
                                PARTAGER
                            </button>
                            <button className="px-6 py-2 border border-dashed border-yellow-400 text-yellow-400 rounded-full hover:bg-yellow-400 hover:text-gray-800 transition-all duration-300">
                                ✦ CONTACT ✦
                            </button>
                        </div>
                    </div>
                </nav>

                {/* 🎯 Container principal avec nouveau layout */}
                <div className="relative h-full flex flex-col justify-center px-8 pt-20">
                    <div className="max-w-7xl mx-auto w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

                            {/* Partie gauche - ATLAS DÉCOUVERTE */}
                            <div
                                className="space-y-8"
                                style={{
                                    opacity: Math.max(0, 1 - scrollY / 400),
                                    transform: `translateY(${scrollY * 0.2}px)`,
                                    transition: 'opacity 0.1s ease-out'
                                }}
                            >
                                <div>
                                    <p className="text-white text-sm font-light tracking-[0.3em] mb-6 uppercase">
                                        ATLAS DÉCOUVERTE:
                                    </p>
                                </div>

                                {/* Nom du pays - TAILLE RÉDUITE */}
                                <div className="mt-32">
                                    <h1
                                        className="text-4xl lg:text-5xl xl:text-6xl font-light text-white leading-[0.8] mb-12"
                                        style={{
                                            fontFamily: 'Vollkorn, Georgia, serif',
                                            fontWeight: '300',
                                            letterSpacing: '-0.02em'
                                        }}
                                    >
                                        {countryData.name}
                                    </h1>

                                    {/* Drapeau - centré sous le nom */}
                                    <div className="flex justify-center mb-12">
                                        <img
                                            src={countryData.flag_url}
                                            alt={`Drapeau ${countryData.name}`}
                                            className="w-20 h-14 object-cover rounded shadow-lg"
                                            loading="eager"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Partie droite - Description + Boutons */}
                            <div
                                className="space-y-8 flex flex-col items-end justify-center"
                                style={{
                                    opacity: Math.max(0, 1 - scrollY / 400),
                                    transform: `translateY(${scrollY * 0.2}px)`,
                                    transition: 'opacity 0.1s ease-out'
                                }}
                            >
                                {/* Description - TAILLE RÉDUITE */}
                                <p
                                    className="text-white text-base lg:text-lg leading-relaxed font-light max-w-lg text-right mb-8"
                                    style={{
                                        fontFamily: 'Vollkorn, Georgia, serif',
                                        lineHeight: '1.6',
                                        letterSpacing: '0.01em'
                                    }}
                                >
                                    {countryData.description}
                                </p>

                                {/* Boutons - REPOSITIONNÉS À GAUCHE EN BAS DE LA DESCRIPTION */}
                                <div className="flex space-x-4 center">
                                    <button
                                        onClick={scrollToTopics}
                                        className="px-6 py-2 border border-dashed border-white text-white rounded-full hover:bg-white hover:text-gray-800 transition-all duration-300 tracking-wide text-sm"
                                    >
                                        DISCUSSIONS
                                    </button>
                                    <button
                                        onClick={scrollToContent}
                                        className="px-6 py-2 border border-dashed border-white text-white rounded-full hover:bg-white hover:text-gray-800 transition-all duration-300 tracking-wide text-sm"
                                    >
                                        SCROLL
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🎯 Container unifié - remonte avec le scroll */}
            <div
                className="relative"
                style={{
                    transform: `translateY(${Math.min(0, -scrollY * 0.8)}px)`,
                    transition: 'transform 0.1s ease-out'
                }}
            >
                {/* Container principal arrondi - 92% width - plus haut */}
                <div className="w-[92%] mx-auto" style={{ marginTop: '-8rem' }}>
                    <div
                        className="rounded-3xl shadow-2xl overflow-hidden"
                        style={{
                            backgroundColor: '#E6EDEA'
                        }}
                    >
                        {/* Image principale du pays - PLEINE HAUTEUR/LARGEUR */}
                        <div className="relative h-96 lg:h-[600px] overflow-hidden">
                            <img
                                src={getCountryImage()}
                                alt={countryData.name}
                                className="w-full h-full object-cover"
                                style={{
                                    filter: 'sepia(0.1) contrast(1.1) brightness(0.95)'
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>

                        {/* Section de contenu */}
                        <div className="p-8 lg:p-16" data-content-section>
                            {/* En-tête de section */}
                            <div className="text-center mb-16">
                                <h2
                                    className="text-3xl font-light italic text-gray-800 mb-4"
                                    style={{ fontFamily: 'Vollkorn, Georgia, serif' }}
                                >
                                    Découvrir {countryData.name}
                                </h2>
                                <div className="w-24 h-px bg-yellow-400 mx-auto"></div>
                            </div>

                            {/* Sections de contenu */}
                            {countryData.sections && countryData.sections.length > 0 ? (
                                <div className="space-y-16">
                                    {Array.from(countryData.sections)
                                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                                        .map(renderSection)}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <Globe size={48} className="text-yellow-400 mx-auto mb-6" />
                                    <h3 className="text-xl font-medium mb-4 text-gray-800 italic">
                                        Contenu en cours de création
                                    </h3>
                                    <p className="text-gray-600 font-light">
                                        Le contenu détaillé de cette page sera bientôt disponible.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bouton BACK comme sur Uganda */}
                <div className="text-center py-12">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-12 py-4 border border-dashed border-white text-white rounded-full hover:bg-white hover:text-gray-800 transition-all duration-300 tracking-wider text-lg"
                        style={{ backgroundColor: 'transparent' }}
                    >
                        BACK
                    </button>
                </div>
            </div>

            {/* Footer simple */}
            <footer className="bg-white border-t border-gray-200 py-12 relative z-30">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-4">
                            <h3
                                className="text-xl font-serif italic text-gray-800"
                                style={{ fontFamily: 'Vollkorn, Georgia, serif' }}
                            >
                                ATLAS
                            </h3>
                            <span className="text-gray-400">|</span>
                            <span className="text-sm text-gray-600 font-light">
                                Découverte culturelle et voyage
                            </span>
                        </div>

                        <div className="flex items-center space-x-8 text-sm text-gray-600">
                            {countryData.updated_at && (
                                <span className="font-light">
                                    Dernière mise à jour : {new Date(countryData.updated_at).toLocaleDateString('fr-FR')}
                                </span>
                            )}
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="hover:text-yellow-400 transition-colors font-light"
                            >
                                Découvrir d'autres pays
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default CountryPage;