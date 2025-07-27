import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe, ArrowLeft, Edit, Trash2, Menu, X } from 'lucide-react';
import { useGetCountryWithContentQuery } from '../api/endpoints/countries';
import { useDeleteCountryMutation } from '../api/endpoints/admin/countries';
import { useSelector } from 'react-redux';
import DOMPurify from 'dompurify';

const CountryPage = () => {
    const { countryId } = useParams();
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Hook pour détecter la taille d'écran
    const [screenSize, setScreenSize] = useState({
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024
    });

    // Récupération du statut d'authentification et du rôle depuis Redux
    const user = useSelector(state => state.auth?.user);
    const isAuthenticated = useSelector(state => state.auth?.isAuthenticated || false);
    const userRole = user?.roles || [];
    const isAdmin = userRole.includes('ROLE_ADMIN');

    // RTK Query hooks
    const {
        data: countryData,
        isLoading,
        error
    } = useGetCountryWithContentQuery(countryId);

    const [deleteCountry, { isLoading: isDeleting }] = useDeleteCountryMutation();

    // Effet pour gérer le resize et le parallax
    useEffect(() => {
        const handleResize = () => {
            setScreenSize({
                isMobile: window.innerWidth < 768,
                isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
                isDesktop: window.innerWidth >= 1024
            });
        };

        const handleScroll = () => setScrollY(window.scrollY);

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Fonction sécurisée pour scroller vers la section de contenu
    const scrollToContent = () => {
        const contentSection = document.querySelector('[data-content-section]');
        if (contentSection) {
            contentSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
        setIsMobileMenuOpen(false);
    };

    // Fonction pour aller aux discussions (seulement si authentifié)
    const scrollToForum = () => {
        if (!isAuthenticated) {
            alert('Veuillez vous connecter pour accéder aux discussions');
            navigate('/login');
            return;
        }
        navigate(`/country/${countryId}/discussions`);
        setIsMobileMenuOpen(false);
    };

    // Fonction pour le bouton retour (sécurisée)
    const handleBack = () => {
        if (isAuthenticated) {
            navigate('/dashboard');
        } else {
            navigate('/');
        }
        setIsMobileMenuOpen(false);
    };

    // Fonction pour la navigation principale (sécurisée)
    const handleMainNavigation = () => {
        if (isAuthenticated) {
            navigate('/dashboard');
        } else {
            navigate('/');
        }
        setIsMobileMenuOpen(false);
    };

    // Fonction pour modifier le pays (sécurisée)
    const handleEdit = () => {
        if (!isAdmin) {
            alert('Accès non autorisé');
            return;
        }
        navigate(`/country-edit/${countryId}`, {
            state: {
                countryData: countryData
            }
        });
        setIsMobileMenuOpen(false);
    };

    // Fonction pour supprimer le pays (sécurisée)
    const handleDelete = async () => {
        if (!isAdmin) {
            alert('Accès non autorisé');
            return;
        }

        try {
            await deleteCountry(countryId).unwrap();

            navigate('/dashboard', {
                state: {
                    message: `Le pays "${countryData.name}" a été supprimé avec succès`,
                    type: 'success'
                }
            });
        } catch (error) {
            console.error('❌ Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression du pays. Veuillez réessayer.');
        }
        setShowDeleteModal(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#4a5c52' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                    <p className="text-white text-sm sm:text-base px-4">Chargement de la page...</p>
                </div>
            </div>
        );
    }

    if (error || !countryData) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#4a5c52' }}>
                <div className="text-center max-w-md">
                    <Globe size={screenSize.isMobile ? 32 : 48} className="text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-lg sm:text-xl font-semibold mb-2 text-white">
                        {error?.status === 404 ? 'Pays non trouvé' : 'Erreur de chargement'}
                    </h2>
                    <p className="text-gray-300 text-sm sm:text-base mb-6">
                        {error?.status === 404
                            ? 'Cette page n\'existe pas ou n\'est pas encore publiée.'
                            : 'Une erreur est survenue lors du chargement de la page.'
                        }
                    </p>
                    <button
                        onClick={handleMainNavigation}
                        className="px-4 sm:px-6 py-2 border border-dashed border-yellow-400 text-yellow-400 rounded-full hover:bg-yellow-400 hover:text-gray-800 transition-all duration-300 text-sm"
                    >
                        ✦ Retour à l'accueil ✦
                    </button>
                </div>
            </div>
        );
    }

    // Fonction pour décoder les entités HTML
    const decodeHtmlEntities = (text) => {
        if (!text || typeof text !== 'string') return text;

        const textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    };

    // Fonction pour extraire l'ID YouTube d'une URL de manière sécurisée
    const getYouTubeVideoId = (url) => {
        if (!url || typeof url !== 'string') return null;

        try {
            const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
            const match = url.match(regex);
            return match ? match[1] : null;
        } catch (error) {
            console.error('Erreur lors de l\'extraction de l\'ID YouTube:', error);
            return null;
        }
    };

    // Utiliser l'image du pays depuis le backend de manière sécurisée
    const getCountryImage = () => {
        if (countryData.country_image) {
            // Validation simple de l'URL
            if (countryData.country_image.startsWith('/uploads/')) {
                return `http://localhost:8000${countryData.country_image}`;
            }
        }
        return countryData.flag_url || '/default-country-image.jpg';
    };

    // Fonction pour rendre le contenu des sections de manière sécurisée et responsive
    const renderSection = (section) => {
        if (!section || !section.type) return null;

        switch (section.type) {
            case 'text':
                return (
                    <div key={section.id} className="mb-8 sm:mb-12">
                        {section.title && (
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 italic">
                                {decodeHtmlEntities(DOMPurify.sanitize(section.title))}
                            </h2>
                        )}
                        <div
                            className="text-base sm:text-lg leading-relaxed text-gray-700 font-light"
                            style={{
                                fontFamily: 'Georgia, serif',
                                lineHeight: screenSize.isMobile ? '1.6' : '1.8'
                            }}
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(decodeHtmlEntities(section.content || ''))
                            }}
                        />
                    </div>
                );

            case 'image':
                return (
                    <div key={section.id} className="mb-8 sm:mb-12">
                        {section.image_url && section.image_url.startsWith('/uploads/') && (
                            <div className="mb-6 sm:mb-8">
                                <img
                                    src={`http://localhost:8000${section.image_url}`}
                                    alt={decodeHtmlEntities(DOMPurify.sanitize(section.title || 'Image de contenu'))}
                                    className="w-full max-w-4xl mx-auto rounded-lg shadow-xl sm:shadow-2xl"
                                    style={{
                                        filter: 'sepia(0.1) contrast(1.1)',
                                        transition: 'transform 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => !screenSize.isMobile && (e.target.style.transform = 'scale(1.02)')}
                                    onMouseLeave={(e) => !screenSize.isMobile && (e.target.style.transform = 'scale(1)')}
                                    loading="lazy"
                                    onError={(e) => {
                                        console.error('Erreur image:', e.target.src);
                                        e.target.style.display = 'none';
                                    }}
                                />
                                {section.title && (
                                    <p className="text-center text-xs sm:text-sm mt-3 sm:mt-4 italic text-gray-600 font-light px-4">
                                        {decodeHtmlEntities(DOMPurify.sanitize(section.title))}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                );

            case 'video':
                const videoId = getYouTubeVideoId(section.content);

                return (
                    <div key={section.id} className="mb-8 sm:mb-12">
                        {section.title && (
                            <h3 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8 text-gray-800 italic text-center px-4">
                                {decodeHtmlEntities(DOMPurify.sanitize(section.title))}
                            </h3>
                        )}
                        {videoId ? (
                            <div className="max-w-4xl mx-auto px-4">
                                <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl sm:shadow-2xl">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}`}
                                        title={decodeHtmlEntities(DOMPurify.sanitize(section.title || 'Vidéo'))}
                                        className="absolute inset-0 w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        loading="lazy"
                                    ></iframe>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center px-4">
                                <div className="inline-block p-6 sm:p-8 bg-white rounded-lg shadow-lg border border-gray-200 max-w-sm">
                                    <div className="flex items-center justify-center w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-yellow-400 mb-4 sm:mb-6 mx-auto">
                                        <svg className="w-6 sm:w-8 h-6 sm:h-8 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                    <p className="text-base sm:text-lg font-medium mb-2 text-gray-800">Vidéo disponible</p>
                                    <p className="text-xs sm:text-sm mb-4 sm:mb-6 text-gray-600">Cliquez pour regarder</p>
                                    <a
                                        href={section.content}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block px-6 sm:px-8 py-2 sm:py-3 border border-dashed border-yellow-400 text-gray-800 rounded-full hover:bg-yellow-400 transition-all duration-300 text-sm"
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
            {/* Section Hero */}
            <div className="relative h-screen overflow-hidden">

                {/* Navigation supérieure responsive */}
                <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-3 sm:py-6">
                    <div className="flex items-center justify-between">
                        {/* Logo et retour */}
                        <div className="flex items-center space-x-4 sm:space-x-8">
                            <img
                                src="/image/SunLogo2.svg"
                                alt='Atlas Logo'
                                style={{ height: screenSize.isMobile ? '60px' : '80px' }}
                            />
                            {/* Bouton retour caché sur mobile */}
                            {!screenSize.isMobile && (
                                <button
                                    onClick={handleBack}
                                    className="flex items-center space-x-2 text-white hover:text-yellow-400 transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                    <span>Retour</span>
                                </button>
                            )}
                        </div>

                        {/* Menu desktop */}
                        {!screenSize.isMobile ? (
                            <div className="flex items-center space-x-6">
                                {/* Boutons d'administration (visible seulement pour les admins) */}
                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={handleEdit}
                                            className="flex items-center space-x-2 text-white hover:text-yellow-400 transition-colors"
                                            title="Modifier le pays"
                                        >
                                            <Edit size={20} />
                                            <span className="hidden lg:block">Modifier</span>
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteModal(true)}
                                            className="flex items-center space-x-2 text-white hover:text-red-400 transition-colors"
                                            title="Supprimer le pays"
                                        >
                                            <Trash2 size={20} />
                                            <span className="hidden lg:block">Supprimer</span>
                                        </button>
                                        <span className="text-white">|</span>
                                    </>
                                )}

                                <button
                                    onClick={handleMainNavigation}
                                    className="px-4 sm:px-6 py-2 border border-dashed border-yellow-400 text-yellow-400 rounded-full hover:bg-yellow-400 hover:text-gray-800 transition-all duration-300 text-sm"
                                >
                                    ✦ {isAuthenticated ? 'DASHBOARD' : 'ACCUEIL'} ✦
                                </button>
                            </div>
                        ) : (
                            /* Menu mobile - hamburger */
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-white p-2"
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        )}
                    </div>

                    {/* Menu mobile ouvert */}
                    {screenSize.isMobile && isMobileMenuOpen && (
                        <div className="absolute top-full left-0 right-0 bg-gray-800/95 backdrop-blur-sm border-t border-gray-600 p-4">
                            <div className="space-y-4">
                                <button
                                    onClick={handleBack}
                                    className="flex items-center space-x-2 text-white hover:text-yellow-400 transition-colors w-full text-left"
                                >
                                    <ArrowLeft size={20} />
                                    <span>Retour</span>
                                </button>

                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={handleEdit}
                                            className="flex items-center space-x-2 text-white hover:text-yellow-400 transition-colors w-full text-left"
                                        >
                                            <Edit size={20} />
                                            <span>Modifier</span>
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteModal(true)}
                                            className="flex items-center space-x-2 text-white hover:text-red-400 transition-colors w-full text-left"
                                        >
                                            <Trash2 size={20} />
                                            <span>Supprimer</span>
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={handleMainNavigation}
                                    className="w-full px-4 py-2 border border-dashed border-yellow-400 text-yellow-400 rounded-full hover:bg-yellow-400 hover:text-gray-800 transition-all duration-300 text-sm text-center"
                                >
                                    ✦ {isAuthenticated ? 'DASHBOARD' : 'ACCUEIL'} ✦
                                </button>
                            </div>
                        </div>
                    )}
                </nav>

                {/* Container principal avec layout responsive */}
                <div className="relative h-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24">
                    <div className="max-w-7xl mx-auto w-full">
                        <div className={`grid gap-8 items-start ${screenSize.isMobile ? 'grid-cols-1 text-center' : 'grid-cols-1 lg:grid-cols-2 gap-16'}`}>

                            {/* Partie gauche - ATLAS DÉCOUVERTE + Nom du pays + Drapeau */}
                            <div
                                className={`space-y-6 sm:space-y-8 ${screenSize.isMobile ? 'order-1' : ''}`}
                                style={{
                                    opacity: Math.max(0, 1 - scrollY / 400),
                                    transform: `translateY(${scrollY * 0.2}px)`,
                                    transition: 'opacity 0.1s ease-out'
                                }}
                            >
                                {/* ATLAS DÉCOUVERTE */}
                                <div>
                                    <p className="text-white text-xs sm:text-sm font-light tracking-[0.2em] sm:tracking-[0.3em] mb-4 sm:mb-6 uppercase">
                                        ATLAS DÉCOUVERTE:
                                    </p>
                                </div>

                                {/* Nom du pays */}
                                <div className={screenSize.isMobile ? "mt-8" : "mt-32"}>
                                    <h1
                                        className={`font-light text-white leading-[0.8] mb-8 sm:mb-12 ${screenSize.isMobile ? 'text-3xl' :
                                            screenSize.isTablet ? 'text-4xl' :
                                                'text-4xl lg:text-5xl xl:text-6xl'
                                            }`}
                                        style={{
                                            fontFamily: 'Vollkorn, Georgia, serif',
                                            fontWeight: '300',
                                            letterSpacing: '-0.02em'
                                        }}
                                    >
                                        {decodeHtmlEntities(DOMPurify.sanitize(countryData.name))}
                                    </h1>

                                    {/* Drapeau */}
                                    <div className="flex justify-center mb-8 sm:mb-12">
                                        <img
                                            src={countryData.flag_url}
                                            alt={`Drapeau ${decodeHtmlEntities(DOMPurify.sanitize(countryData.name))}`}
                                            className={`object-cover rounded shadow-lg ${screenSize.isMobile ? 'w-16 h-11' : 'w-20 h-14'
                                                }`}
                                            loading="eager"
                                            onError={(e) => {
                                                e.target.src = '/default-flag.jpg';
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Partie droite - Description + Boutons */}
                            <div
                                className={`space-y-6 sm:space-y-8 flex flex-col ${screenSize.isMobile ? 'items-center justify-center order-2' : 'items-end justify-center'}`}
                                style={{
                                    opacity: Math.max(0, 1 - scrollY / 400),
                                    transform: `translateY(${scrollY * 0.2}px)`,
                                    transition: 'opacity 0.1s ease-out'
                                }}
                            >
                                {/* Description */}
                                <p
                                    className={`text-white leading-relaxed font-light mb-6 sm:mb-8 ${screenSize.isMobile ?
                                        'text-sm max-w-sm text-center px-4' :
                                        'text-base sm:text-lg max-w-lg text-right'
                                        }`}
                                    style={{
                                        fontFamily: 'Vollkorn, Georgia, serif',
                                        lineHeight: '1.6',
                                        letterSpacing: '0.01em'
                                    }}
                                >
                                    {decodeHtmlEntities(DOMPurify.sanitize(countryData.description))}
                                </p>

                                {/* Boutons */}
                                <div className={`flex ${screenSize.isMobile ? 'flex-col space-y-3 w-full px-8' : 'space-x-4'} items-center`}>
                                    {/* Bouton Discussions - visible seulement si authentifié */}
                                    {isAuthenticated && (
                                        <button
                                            onClick={scrollToForum}
                                            className={`border border-dashed border-white text-white rounded-full hover:bg-white hover:text-gray-800 transition-all duration-300 tracking-wide text-sm ${screenSize.isMobile ? 'w-full py-3 px-6' : 'px-6 py-2'
                                                }`}
                                        >
                                            DISCUSSIONS
                                        </button>
                                    )}
                                    <button
                                        onClick={scrollToContent}
                                        className={`border border-dashed border-white text-white rounded-full hover:bg-white hover:text-gray-800 transition-all duration-300 tracking-wide text-sm ${screenSize.isMobile ? 'w-full py-3 px-6' : 'px-6 py-2'
                                            }`}
                                    >
                                        DÉCOUVRIR
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Container unifié responsive */}
            <div
                className="relative"
                style={{
                    transform: `translateY(${Math.min(0, -scrollY * 0.8)}px)`,
                    transition: 'transform 0.1s ease-out'
                }}
            >
                {/* Container principal arrondi */}
                <div className={`mx-auto ${screenSize.isMobile ? 'w-[96%]' : 'w-[92%]'}`} style={{ marginTop: screenSize.isMobile ? '-4rem' : '-8rem' }}>
                    <div
                        className="rounded-xl sm:rounded-3xl shadow-xl sm:shadow-2xl overflow-hidden"
                        style={{
                            backgroundColor: '#E6EDEA'
                        }}
                    >
                        {/* Image principale du pays */}
                        <div className={`relative overflow-hidden ${screenSize.isMobile ? 'h-64' : screenSize.isTablet ? 'h-80' : 'h-96 lg:h-[600px]'}`}>
                            <img
                                src={getCountryImage()}
                                alt={DOMPurify.sanitize(countryData.name)}
                                className="w-full h-full object-cover"
                                style={{
                                    filter: 'sepia(0.1) contrast(1.1) brightness(0.95)'
                                }}
                                onError={(e) => {
                                    e.target.src = '/default-country-image.jpg';
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>

                        {/* Section de contenu */}
                        <div className={`${screenSize.isMobile ? 'p-4 sm:p-6' : 'p-8 lg:p-16'}`} data-content-section>
                            {/* En-tête de section */}
                            <div className="text-center mb-8 sm:mb-16">
                                <h2
                                    className={`font-light italic text-gray-800 mb-3 sm:mb-4 ${screenSize.isMobile ? 'text-2xl' : 'text-3xl'}`}
                                    style={{ fontFamily: 'Vollkorn, Georgia, serif' }}
                                >
                                    Découvrir {decodeHtmlEntities(DOMPurify.sanitize(countryData.name))}
                                </h2>
                                <div className={`h-px bg-yellow-400 mx-auto ${screenSize.isMobile ? 'w-16' : 'w-24'}`}></div>
                            </div>

                            {/* Sections de contenu */}
                            {countryData.sections && countryData.sections.length > 0 ? (
                                <div className="space-y-8 sm:space-y-16">
                                    {Array.from(countryData.sections)
                                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                                        .map(renderSection)}
                                </div>
                            ) : (
                                <div className="text-center py-12 sm:py-16">
                                    <Globe size={screenSize.isMobile ? 32 : 48} className="text-yellow-400 mx-auto mb-4 sm:mb-6" />
                                    <h3 className="text-lg sm:text-xl font-medium mb-3 sm:mb-4 text-gray-800 italic">
                                        Contenu en cours de création
                                    </h3>
                                    <p className="text-gray-600 font-light text-sm sm:text-base px-4">
                                        Le contenu détaillé de cette page sera bientôt disponible.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bouton BACK responsive */}
                <div className="text-center py-8 sm:py-12">
                    <button
                        onClick={handleMainNavigation}
                        className={`border border-dashed border-white text-white rounded-full hover:bg-white hover:text-gray-800 transition-all duration-300 tracking-wider ${screenSize.isMobile ? 'px-8 py-3 text-base' : 'px-12 py-4 text-lg'
                            }`}
                        style={{ backgroundColor: 'transparent' }}
                    >
                        RETOUR
                    </button>
                </div>
            </div>

            {/* Modal de confirmation de suppression responsive */}
            {showDeleteModal && isAdmin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className={`bg-white rounded-lg w-full p-4 sm:p-6 ${screenSize.isMobile ? 'max-w-sm' : 'max-w-md'}`}>
                        <div className="flex items-center mb-4">
                            <div className={`rounded-full bg-red-100 flex items-center justify-center mr-3 sm:mr-4 ${screenSize.isMobile ? 'w-10 h-10' : 'w-12 h-12'}`}>
                                <Trash2 className="text-red-600" size={screenSize.isMobile ? 20 : 24} />
                            </div>
                            <div>
                                <h3 className={`font-semibold text-gray-900 ${screenSize.isMobile ? 'text-base' : 'text-lg'}`}>
                                    Supprimer le pays
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600">
                                    Cette action est irréversible
                                </p>
                            </div>
                        </div>

                        <p className={`text-gray-700 mb-4 sm:mb-6 ${screenSize.isMobile ? 'text-sm' : 'text-base'}`}>
                            Êtes-vous sûr de vouloir supprimer <strong>"{decodeHtmlEntities(DOMPurify.sanitize(countryData.name))}"</strong> ?
                            <br />
                            <span className="text-xs sm:text-sm text-red-600 mt-1 block">
                                Toutes les sections et le contenu associé seront définitivement supprimés.
                            </span>
                        </p>

                        <div className={`flex ${screenSize.isMobile ? 'flex-col space-y-3' : 'space-x-3'}`}>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className={`border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base ${screenSize.isMobile ? 'w-full px-4 py-3' : 'flex-1 px-4 py-2'
                                    }`}
                                disabled={isDeleting}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className={`bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center text-sm sm:text-base ${screenSize.isMobile ? 'w-full px-4 py-3' : 'flex-1 px-4 py-2'
                                    }`}
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Suppression...
                                    </>
                                ) : (
                                    screenSize.isMobile ? 'Supprimer' : 'Supprimer définitivement'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer responsive */}
            <footer className="bg-white border-t border-gray-200 py-8 sm:py-12 relative z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className={`flex items-center justify-between ${screenSize.isMobile ? 'flex-col space-y-4 text-center' : 'flex-col md:flex-row space-y-4 md:space-y-0'}`}>
                        <div className={`flex items-center ${screenSize.isMobile ? 'flex-col space-y-2' : 'space-x-4'}`}>
                            <h3
                                className={`font-serif italic text-gray-800 ${screenSize.isMobile ? 'text-lg' : 'text-xl'}`}
                                style={{ fontFamily: 'Vollkorn, Georgia, serif' }}
                            >
                                ATLAS
                            </h3>
                            {!screenSize.isMobile && <span className="text-gray-400">|</span>}
                            <span className={`text-gray-600 font-light ${screenSize.isMobile ? 'text-xs' : 'text-sm'}`}>
                                Découverte culturelle et voyage
                            </span>
                        </div>

                        <div className={`flex items-center text-gray-600 ${screenSize.isMobile ? 'flex-col space-y-2 text-xs' : 'space-x-8 text-sm'
                            }`}>
                            {countryData.updated_at && (
                                <span className="font-light">
                                    Dernière mise à jour : {new Date(countryData.updated_at).toLocaleDateString('fr-FR')}
                                </span>
                            )}
                            <button
                                onClick={handleMainNavigation}
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