// CountryForum.jsx - Version améliorée avec CreateTopicForm intégré
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetCountryDiscussionsQuery } from '../api/endpoints/forum';
import { useGetCountryByIdQuery } from '../api/endpoints/countries';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';
import { MessageCircle, Users, Clock, ArrowLeft, MessageSquare, Star, User, Bell, Heart, Share2, Phone, ShoppingCart } from 'lucide-react';
import CreateTopicForm from '../features/country/topic/CreateTopicForm';

const CountryForum = () => {
    const { countryId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(1);

    // Récupération de l'utilisateur comme dans Dashboard
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
            {/* Navigation améliorée avec toutes les icônes demandées */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <h1
                            className="text-2xl font-serif italic text-white cursor-pointer"
                            onClick={() => navigate('/dashboard')}
                        >
                            ATLAS
                        </h1>
                        <button
                            onClick={() => navigate(`/country/${countryId}`)}
                            className="flex items-center space-x-2 text-white hover:text-yellow-400 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Retour</span>
                        </button>
                    </div>

                    {/* Navigation utilisateur complète */}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                {/* Panier */}
                                <button className="text-white hover:text-yellow-400 transition-colors">
                                    <ShoppingCart size={20} />
                                </button>

                                {/* Favoris */}
                                <button className="text-white hover:text-yellow-400 transition-colors flex items-center space-x-1">
                                    <Heart size={20} />
                                    <span className="hidden md:inline">FAVORIS</span>
                                </button>

                                {/* Partager */}
                                <button className="text-white hover:text-yellow-400 transition-colors flex items-center space-x-1">
                                    <Share2 size={20} />
                                    <span className="hidden md:inline">PARTAGER</span>
                                </button>

                                {/* Contact */}
                                <button className="text-white hover:text-yellow-400 transition-colors flex items-center space-x-1">
                                    <Phone size={20} />
                                    <span className="hidden md:inline">CONTACT</span>
                                </button>

                                {/* Notifications */}
                                <button className="text-white hover:text-yellow-400 transition-colors">
                                    <Bell size={20} />
                                </button>

                                {/* Photo de profil et pseudo - comme dans Dashboard */}
                                <div className="flex items-center space-x-3">
                                    {user.profile_picture ? (
                                        <img
                                            src={`http://localhost:8000${user.profile_picture}`}
                                            alt=""
                                            className="w-8 h-8 rounded-full border-2 border-white"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                                            <User size={16} className="text-gray-800" />
                                        </div>
                                    )}
                                    <span className="text-white font-medium">{user.pseudo}</span>
                                </div>
                            </>
                        ) : (
                            // Si pas connecté, rediriger vers login
                            <button
                                onClick={() => navigate('/login')}
                                className="px-4 py-2 border border-yellow-400 text-yellow-400 rounded-full hover:bg-yellow-400 hover:text-gray-800 transition-all duration-300"
                            >
                                Se connecter
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero section */}
            <div className="relative h-96 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>
                <div className="relative h-full flex flex-col justify-center items-center text-center px-8 pt-20">
                    <div className="flex items-center space-x-4 mb-6">
                        <img
                            src={countryData.flag_url}
                            alt={`Drapeau ${countryData.name}`}
                            className="w-16 h-12 object-cover rounded shadow-lg"
                        />
                        <h1
                            className="text-4xl lg:text-5xl font-light text-white"
                            style={{ fontFamily: 'Vollkorn, Georgia, serif' }}
                        >
                            Forum {countryData.name}
                        </h1>
                    </div>
                    <p className="text-white text-lg font-light max-w-2xl">
                        Échangez et partagez vos expériences sur {countryData.name}
                    </p>
                </div>
            </div>

            {/* Container principal avec espacement corrigé */}
            <div className="w-[88%] mx-auto" style={{ marginTop: '-2rem' }}>
                <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: '#E6EDEA', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                    <div className="p-6 lg:p-10">
                        {/* Stats section */}
                        <div className="grid grid-cols-3 gap-8 mb-10">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-600 mb-2">
                                    {stats.total_discussions}
                                </div>
                                <div className="text-sm text-gray-600 uppercase tracking-wide">
                                    Sujets
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-600 mb-2">
                                    {stats.total_messages}
                                </div>
                                <div className="text-sm text-gray-600 uppercase tracking-wide">
                                    Messages
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-600 mb-2">
                                    {stats.active_users}
                                </div>
                                <div className="text-sm text-gray-600 uppercase tracking-wide">
                                    Utilisateurs actifs
                                </div>
                            </div>
                        </div>

                        {/* Liste des discussions */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
                            {/* Header tableau */}
                            <div className="bg-gray-100 px-6 py-4 border-b">
                                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 uppercase tracking-wide">
                                    <div className="col-span-6">SUJET</div>
                                    <div className="col-span-2 text-center">AUTEUR</div>
                                    <div className="col-span-1 text-center">NB</div>
                                    <div className="col-span-3 text-center">DERNIER MSG</div>
                                </div>
                            </div>

                            {/* Corps du tableau */}
                            {discussions.length === 0 ? (
                                <div className="text-center py-16">
                                    <MessageCircle size={48} className="text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium mb-2 text-gray-800">
                                        Aucune discussion
                                    </h3>
                                    <p className="text-gray-600 mb-6">
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
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {discussionsData?.pagination && discussionsData.pagination.total_pages > 1 && (
                            <div className="flex justify-center items-center space-x-2 mb-8">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Précédent
                                </button>

                                <div className="flex space-x-1">
                                    {Array.from({ length: Math.min(5, discussionsData.pagination.total_pages) }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`px-4 py-2 rounded-lg transition-colors ${pageNum === page
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
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Suivant
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

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-4">
                            <h3 className="text-xl font-serif italic text-gray-800">
                                ATLAS
                            </h3>
                            <span className="text-gray-400">|</span>
                            <span className="text-sm text-gray-600 font-light">
                                Forum de discussion sur {countryData.name}
                            </span>
                        </div>
                        <div className="flex items-center space-x-8 text-sm text-gray-600">
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