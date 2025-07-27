// CountryForum.jsx - Version simplifiée et responsive
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetCountryDiscussionsQuery } from '../api/endpoints/forum';
import { useGetCountryByIdQuery } from '../api/endpoints/countries';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';
import { MessageCircle, Users, Clock, ArrowLeft, MessageSquare, Star, User, Menu, X } from 'lucide-react';
import CreateTopicForm from '../features/country/topic/CreateTopicForm';

const CountryForum = () => {
    const { countryId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Hook pour détecter la taille d'écran
    const [screenSize, setScreenSize] = useState({
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024
    });

    // Récupération de l'utilisateur
    const user = useSelector(selectUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    // RTK Query hooks
    const {
        data: countryData,
        isLoading: countryLoading
    } = useGetCountryByIdQuery(countryId);

    const {
        data: discussionsData,
        isLoading: discussionsLoading,
        error,
        refetch: refetchDiscussions
    } = useGetCountryDiscussionsQuery({
        countryId: countryId,
        page,
        limit: 15
    });

    // Effet pour gérer le resize
    useEffect(() => {
        const handleResize = () => {
            setScreenSize({
                isMobile: window.innerWidth < 768,
                isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
                isDesktop: window.innerWidth >= 1024
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Format time like JVC
    const formatTime = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes < 1 ? 'maintenant' : minutes + 'min'}`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}j`;

        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    };

    const getTopicIcon = (discussion) => {
        if (discussion.is_pinned) {
            return <Star size={16} className="text-red-500 fill-current" />;
        }
        if (discussion.message_count > 1000) {
            return <MessageCircle size={16} className="text-red-500" />;
        }
        return <MessageSquare size={16} className="text-yellow-600" />;
    };

    const handleTopicCreated = () => {
        refetchDiscussions();
    };

    if (countryLoading || discussionsLoading) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: '#4a5c52' }}>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                        <p className="text-white">Chargement du forum...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !countryData) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: '#4a5c52' }}>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <MessageCircle size={48} className="text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2 text-white">
                            Erreur de chargement
                        </h2>
                        <p className="text-gray-300 mb-4">
                            Impossible de charger le forum de ce pays.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-2 border border-dashed border-yellow-400 text-yellow-400 rounded-full hover:bg-yellow-400 hover:text-gray-800 transition-all duration-300"
                        >
                            ✦ Retour au tableau de bord ✦
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const discussions = discussionsData?.discussions || [];
    const stats = discussionsData?.stats || {
        total_discussions: 0,
        total_messages: 0,
        active_users: 0
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#4a5c52' }}>
            {/* Navigation supérieure alignée sur CountryPage */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-3 sm:py-6">
                <div className="flex items-center justify-between">
                    {/* Logo et retour */}
                    <div className="flex items-center space-x-4 sm:space-x-8">
                        <img
                            src="/image/SunLogo2.svg"
                            alt="Atlas Logo"
                            style={{ height: screenSize.isMobile ? '60px' : '80px' }}
                            className="cursor-pointer"
                            onClick={() => navigate('/dashboard')}
                        />
                        {/* Bouton retour caché sur mobile */}
                        {!screenSize.isMobile && (
                            <button
                                onClick={() => navigate(`/country/${countryId}`)}
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
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-4 sm:px-6 py-2 border border-dashed border-yellow-400 text-yellow-400 rounded-full hover:bg-yellow-400 hover:text-gray-800 transition-all duration-300 text-sm"
                            >
                                ✦ DASHBOARD ✦
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
                                onClick={() => {
                                    navigate(`/country/${countryId}`);
                                    setIsMobileMenuOpen(false);
                                }}
                                className="flex items-center space-x-2 text-white hover:text-yellow-400 transition-colors w-full text-left"
                            >
                                <ArrowLeft size={20} />
                                <span>Retour au pays</span>
                            </button>

                            <button
                                onClick={() => {
                                    navigate('/dashboard');
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full px-4 py-2 border border-dashed border-yellow-400 text-yellow-400 rounded-full hover:bg-yellow-400 hover:text-gray-800 transition-all duration-300 text-sm text-center"
                            >
                                ✦ DASHBOARD ✦
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero section */}
            <div className="relative h-96 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>
                <div className="relative h-full flex flex-col justify-center items-center text-center px-4 sm:px-8">
                    <div className="flex items-center space-x-4 mb-6">
                        <img
                            src={countryData.flag_url}
                            alt={`Drapeau ${countryData.name}`}
                            className="w-12 h-8 sm:w-16 sm:h-12 object-cover rounded shadow-lg"
                        />
                        <h1
                            className="text-3xl sm:text-4xl lg:text-5xl font-light text-white"
                            style={{ fontFamily: 'Vollkorn, Georgia, serif' }}
                        >
                            Forum {countryData.name}
                        </h1>
                    </div>
                    <p className="text-white text-base sm:text-lg font-light max-w-2xl px-4">
                        Échangez et partagez vos expériences sur {countryData.name}
                    </p>
                </div>
            </div>

            {/* Container principal avec espacement corrigé */}
            <div className={`mx-auto ${screenSize.isMobile ? 'w-[96%]' : 'w-[88%]'}`} style={{ marginTop: screenSize.isMobile ? '4rem' : '8rem' }}>
                <div className="rounded-xl sm:rounded-3xl overflow-hidden" style={{ backgroundColor: '#E6EDEA', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                    <div className={`${screenSize.isMobile ? 'p-4' : 'p-6 lg:p-10'}`}>
                        {/* Stats section responsive */}
                        <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-10">
                            <div className="text-center">
                                <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">
                                    {stats.total_discussions}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 uppercase tracking-wide">
                                    Sujets
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">
                                    {stats.total_messages}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 uppercase tracking-wide">
                                    Messages
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">
                                    {stats.active_users}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 uppercase tracking-wide">
                                    {screenSize.isMobile ? 'Actifs' : 'Utilisateurs actifs'}
                                </div>
                            </div>
                        </div>

                        {/* Liste des discussions responsive */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 sm:mb-8">
                            {/* Header tableau - version desktop */}
                            {!screenSize.isMobile && (
                                <div className="bg-gray-100 px-4 sm:px-6 py-3 sm:py-4 border-b">
                                    <div className="grid grid-cols-12 gap-4 text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wide">
                                        <div className="col-span-6">SUJET</div>
                                        <div className="col-span-2 text-center">AUTEUR</div>
                                        <div className="col-span-1 text-center">NB</div>
                                        <div className="col-span-3 text-center">DERNIER MSG</div>
                                    </div>
                                </div>
                            )}

                            {/* Corps du tableau */}
                            {discussions.length === 0 ? (
                                <div className="text-center py-12 sm:py-16">
                                    <MessageCircle size={screenSize.isMobile ? 32 : 48} className="text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg sm:text-xl font-medium mb-2 text-gray-800">
                                        Aucune discussion
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-600 mb-6 px-4">
                                        Soyez le premier à lancer une discussion sur {countryData.name} !
                                    </p>
                                </div>
                            ) : (
                                discussions.map((discussion, index) => (
                                    <div
                                        key={discussion.id}
                                        className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                        onClick={() => navigate(`/topic/${discussion.id}`)}
                                    >
                                        {screenSize.isMobile ? (
                                            // Version mobile
                                            <div className="p-4">
                                                <div className="flex items-start space-x-3 mb-2">
                                                    {getTopicIcon(discussion)}
                                                    <h3 className="text-sm font-medium text-gray-900 flex-1">
                                                        {discussion.title}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <div className="flex items-center space-x-2">
                                                        {discussion.latest_message?.user?.profile_picture ? (
                                                            <img
                                                                src={`http://localhost:8000${discussion.latest_message.user.profile_picture}`}
                                                                alt=""
                                                                className="w-4 h-4 rounded-full"
                                                            />
                                                        ) : (
                                                            <User size={12} className="text-gray-400" />
                                                        )}
                                                        <span>{discussion.latest_message?.user?.pseudo || 'Anonyme'}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <span className="font-medium">{discussion.message_count} msg</span>
                                                        <span>{formatTime(discussion.latest_message?.created_at || discussion.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // Version desktop
                                            <div className="grid grid-cols-12 gap-4 items-center px-6 py-4">
                                                <div className="col-span-6">
                                                    <div className="flex items-start space-x-3">
                                                        {getTopicIcon(discussion)}
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-sm hover:text-blue-600 transition-colors text-gray-900 font-medium">
                                                                {discussion.title}
                                                            </h3>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {formatTime(discussion.created_at)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-span-2 text-center">
                                                    {discussion.latest_message ? (
                                                        <div className="flex items-center justify-center space-x-2">
                                                            {discussion.latest_message.user?.profile_picture ? (
                                                                <img
                                                                    src={`http://localhost:8000${discussion.latest_message.user.profile_picture}`}
                                                                    alt=""
                                                                    className="w-6 h-6 rounded-full"
                                                                />
                                                            ) : (
                                                                <User size={16} className="text-gray-400" />
                                                            )}
                                                            <span className="text-sm text-gray-700 truncate">
                                                                {discussion.latest_message.user?.pseudo || 'Anonyme'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </div>

                                                <div className="col-span-1 text-center">
                                                    <span className={`text-sm font-medium ${discussion.message_count > 1000 ? 'text-red-600' :
                                                        discussion.message_count > 100 ? 'text-orange-600' : 'text-gray-700'}`}>
                                                        {discussion.message_count}
                                                    </span>
                                                </div>

                                                <div className="col-span-3 text-center">
                                                    {discussion.latest_message ? (
                                                        <div className="text-sm text-gray-600">
                                                            {formatTime(discussion.latest_message.created_at)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination responsive */}
                        {discussionsData?.pagination && discussionsData.pagination.total_pages > 1 && (
                            <div className="flex justify-center items-center space-x-2 mb-6 sm:mb-8">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="px-3 py-2 sm:px-4 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {screenSize.isMobile ? 'Préc.' : 'Précédent'}
                                </button>

                                <div className="flex space-x-1">
                                    {Array.from({ length: Math.min(screenSize.isMobile ? 3 : 5, discussionsData.pagination.total_pages) }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm transition-colors ${pageNum === page
                                                    ? 'bg-yellow-400 text-gray-800 font-medium'
                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === discussionsData.pagination.total_pages}
                                    className="px-3 py-2 sm:px-4 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {screenSize.isMobile ? 'Suiv.' : 'Suivant'}
                                </button>
                            </div>
                        )}

                        {/* Formulaire de création pour tous les utilisateurs connectés */}
                        {isAuthenticated && (
                            <CreateTopicForm
                                countryId={countryId}
                                countryName={countryData.name}
                                onSuccess={handleTopicCreated}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Footer responsive */}
            <footer className="bg-white border-t border-gray-200 py-8 sm:py-12 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <div className={`flex items-center justify-between ${screenSize.isMobile ? 'flex-col space-y-4' : 'flex-col md:flex-row space-y-4 md:space-y-0'}`}>
                        <div className="flex items-center space-x-4">
                            <h3 className="text-lg sm:text-xl font-serif italic text-gray-800">
                                ATLAS
                            </h3>
                            {!screenSize.isMobile && <span className="text-gray-400">|</span>}
                            <span className="text-xs sm:text-sm text-gray-600 font-light">
                                Forum de discussion sur {countryData.name}
                            </span>
                        </div>
                        <div className="flex items-center space-x-4 sm:space-x-8 text-xs sm:text-sm text-gray-600">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="hover:text-yellow-400 transition-colors font-light"
                            >
                                Retour au tableau de bord
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default CountryForum;