import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetDiscussionQuery, useAddMessageMutation, useUploadMessageImageMutation, useReactToMessageMutation, useUnreactToMessageMutation } from '../api/endpoints/forum';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';
import { ArrowLeft, ThumbsUp, ThumbsDown, Send, Eye, EyeOff, MessageCircle, User, Clock, Reply, X, Users, FileImage, Menu, Shield, Star, Crown, Medal, Heart } from 'lucide-react';

const TopicView = () => {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [newMessage, setNewMessage] = useState('');
    const [isPreview, setIsPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [showImagePreview, setShowImagePreview] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hoveredMessage, setHoveredMessage] = useState(null);
    const fileInputRef = useRef(null);

    const [screenSize, setScreenSize] = useState({
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024
    });

    const user = useSelector(selectUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    const {
        data: discussionData,
        isLoading,
        error,
        refetch: refetchDiscussion
    } = useGetDiscussionQuery({
        discussionId: parseInt(topicId),
        page,
        limit: 20
    });

    const [addMessage] = useAddMessageMutation();
    const [uploadImage] = useUploadMessageImageMutation();
    const [reactToMessage] = useReactToMessageMutation();
    const [unreactToMessage] = useUnreactToMessageMutation();

    const discussion = discussionData?.discussion;
    const messages = discussionData?.messages || [];
    const pagination = discussionData?.pagination;

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

    // ✅ CORRECTION: Fonction de décodage HTML robuste
    const decodeHtmlEntities = (text) => {
        if (!text) return '';

        const entityMap = {
            '&#039;': "'",
            '&quot;': '"',
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&nbsp;': ' ',
            '&apos;': "'",
            '&cent;': '¢',
            '&pound;': '£',
            '&yen;': '¥',
            '&euro;': '€',
            '&copy;': '©',
            '&reg;': '®'
        };

        let decoded = text;
        for (const [entity, char] of Object.entries(entityMap)) {
            decoded = decoded.replace(new RegExp(entity, 'g'), char);
        }
        return decoded;
    };

    // ✅ CORRECTION: Format des dates en heure française
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const options = {
            timeZone: 'Europe/Paris',
            day: '2-digit',
            month: '2-digit',
            year: screenSize.isMobile ? '2-digit' : 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        return date.toLocaleDateString('fr-FR', options);
    };

    // ✅ CORRECTION: Gestion des vrais rôles utilisateur
    const getUserRoleInfo = (messageUser) => {
        if (!messageUser || !messageUser.pseudo) {
            return {
                name: "Utilisateur supprimé",
                color: "text-gray-500",
                bg: "bg-gray-100",
                icon: User,
                messageCount: 0
            };
        }

        // Calculer le nombre réel de messages pour cet utilisateur
        const userMessages = messages.filter(m => m.user?.id === messageUser.id);
        const realMessageCount = userMessages.length;

        // Déterminer le rôle basé sur les vraies données de la base
        const roles = messageUser.roles || [];

        if (roles.includes('ROLE_ADMIN')) {
            return {
                name: "Administrateur",
                color: "text-red-600",
                bg: "bg-red-100",
                icon: Crown,
                messageCount: realMessageCount
            };
        } else if (roles.includes('ROLE_MODERATOR')) {
            return {
                name: "Modérateur",
                color: "text-purple-600",
                bg: "bg-purple-100",
                icon: Shield,
                messageCount: realMessageCount
            };
        } else if (roles.includes('ROLE_TRAVELER')) {
            return {
                name: "Voyageur",
                color: "text-blue-600",
                bg: "bg-blue-100",
                icon: Star,
                messageCount: realMessageCount
            };
        } else {
            return {
                name: "Utilisateur",
                color: "text-green-600",
                bg: "bg-green-100",
                icon: User,
                messageCount: realMessageCount
            };
        }
    };

    const handleReplyToMessage = (message) => {
        if (!message || !message.content) return;

        const decodedContent = decodeHtmlEntities(message.content.substring(0, 100));
        const decodedPseudo = decodeHtmlEntities(message.user?.pseudo || 'Utilisateur supprimé');

        const replyText = `@${decodedPseudo} a dit :\n> ${decodedContent}${message.content.length > 100 ? '...' : ''}\n\n`;
        setNewMessage(replyText);
        setReplyingTo(message);

        if (screenSize.isMobile) {
            setTimeout(() => {
                document.getElementById('reply-form')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    const cancelReply = () => {
        setReplyingTo(null);
        setNewMessage('');
    };

    // ✅ CORRECTION: Gestion des réactions avec validation
    const handleReaction = async (messageId, type) => {
        if (!isAuthenticated || !messageId) return;

        try {
            const message = messages.find(m => m.id === messageId);
            if (!message) return;

            const currentReaction = message.reactions?.user_reaction;

            if (currentReaction === type) {
                await unreactToMessage({ messageId }).unwrap();
            } else {
                await reactToMessage({ messageId, type }).unwrap();
            }

            refetchDiscussion();
        } catch (error) {
            console.error('Erreur réaction:', error);
            alert('Erreur lors de la réaction. Veuillez réessayer.');
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('L\'image ne doit pas dépasser 5MB');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await uploadImage(formData).unwrap();
            const imageUrl = `http://localhost:8000${response.url}`;

            const imageMarkdown = `\n![Image](${imageUrl})\n`;
            setNewMessage(prev => prev + imageMarkdown);
        } catch (error) {
            console.error('Erreur upload image:', error);
            alert('Erreur lors de l\'upload de l\'image. Veuillez réessayer.');
        }
    };

    const handleSubmitMessage = async () => {
        if (!isAuthenticated) {
            alert('Vous devez être connecté pour poster un message');
            return;
        }

        const sanitizedMessage = newMessage.trim().substring(0, 5000);
        if (!sanitizedMessage) {
            alert('Le message ne peut pas être vide');
            return;
        }

        setIsSubmitting(true);

        try {
            await addMessage({
                discussionId: parseInt(topicId),
                content: sanitizedMessage
            }).unwrap();

            setNewMessage('');
            setIsPreview(false);
            setReplyingTo(null);
            refetchDiscussion();
        } catch (error) {
            console.error('Erreur ajout message:', error);
            alert('Erreur lors de l\'ajout du message. Veuillez réessayer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderMessageContent = (content) => {
        if (!content) return null;

        const decodedContent = decodeHtmlEntities(content);
        const lines = decodedContent.split('\n');
        let result = [];
        let currentQuote = '';
        let inQuote = false;

        lines.forEach((line, index) => {
            if (line.startsWith('> ')) {
                if (!inQuote) {
                    inQuote = true;
                    currentQuote = '';
                }
                currentQuote += line.substring(2) + '\n';
            } else if (line.startsWith('@') && line.includes('a dit :')) {
                result.push(
                    <div key={`mention-${index}`} className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400">
                        <span className="font-medium text-blue-700">
                            {line}
                        </span>
                    </div>
                );
            } else {
                if (inQuote) {
                    result.push(
                        <blockquote key={`quote-${index}`} className="mb-3 p-4 bg-gray-50 border-l-4 border-gray-300 italic text-gray-700 rounded-r-lg">
                            {currentQuote.trim()}
                        </blockquote>
                    );
                    inQuote = false;
                    currentQuote = '';
                }

                const imageMatch = line.match(/\!\[(.*?)\]\((.*?)\)/);
                if (imageMatch) {
                    const imageUrl = imageMatch[2];
                    if (imageUrl.startsWith('http://localhost:8000/uploads/')) {
                        result.push(
                            <div key={`image-${index}`} className="my-4">
                                <img
                                    src={imageUrl}
                                    alt={imageMatch[1]}
                                    className={`max-w-full h-auto rounded-xl cursor-pointer hover:opacity-90 transition-all duration-300 shadow-lg ${screenSize.isMobile ? 'max-h-64' : 'max-h-96'}`}
                                    onClick={() => setShowImagePreview(imageUrl)}
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            </div>
                        );
                    }
                } else if (line.trim()) {
                    result.push(
                        <p key={`text-${index}`} className="mb-2 leading-relaxed text-gray-800">
                            {line}
                        </p>
                    );
                }
            }
        });

        if (inQuote) {
            result.push(
                <blockquote key="final-quote" className="mb-3 p-4 bg-gray-50 border-l-4 border-gray-300 italic text-gray-700 rounded-r-lg">
                    {currentQuote.trim()}
                </blockquote>
            );
        }

        return result;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-green-500 mx-auto mb-4"></div>
                            <Heart className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-green-500 animate-pulse" />
                        </div>
                        <p className="text-slate-600 font-medium">Chargement de la discussion...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !discussion) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
                        <MessageCircle size={48} className="text-red-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-slate-800">
                            Discussion introuvable
                        </h2>
                        <p className="text-slate-600 mb-6">
                            Cette discussion n'existe pas ou a été supprimée.
                        </p>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-medium shadow-lg"
                        >
                            ← Retour
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Navigation moderne */}
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/90 border-b border-slate-200/50 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <img
                                src="/image/SunLogo2.svg"
                                alt="Atlas Logo"
                                className="h-10 w-10 cursor-pointer"
                                onClick={() => navigate('/dashboard')}
                            />
                            {!screenSize.isMobile && (
                                <button
                                    onClick={() => navigate(`/country/${discussion.country.id}/discussions`)}
                                    className="flex items-center space-x-2 text-slate-600 hover:text-green-600 transition-colors font-medium"
                                >
                                    <ArrowLeft size={18} />
                                    <span>Retour au forum</span>
                                </button>
                            )}
                        </div>

                        {!screenSize.isMobile ? (
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-medium shadow-lg"
                                >
                                    Dashboard
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-slate-600 p-2"
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        )}
                    </div>

                    {screenSize.isMobile && isMobileMenuOpen && (
                        <div className="border-t border-slate-200 bg-white/95 backdrop-blur-lg p-4">
                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        navigate(`/country/${discussion.country.id}/discussions`);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center space-x-2 text-slate-600 hover:text-green-600 transition-colors w-full text-left"
                                >
                                    <ArrowLeft size={20} />
                                    <span>Retour au forum</span>
                                </button>
                                <button
                                    onClick={() => {
                                        navigate('/dashboard');
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-medium text-center"
                                >
                                    Dashboard
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Header moderne avec gradient */}
            <div className="pt-16 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">
                            {decodeHtmlEntities(discussion.title)}
                        </h1>
                        <div className="flex items-center justify-center space-x-4 text-emerald-100">
                            <span className="flex items-center space-x-1">
                                <Users size={16} />
                                <span>Forum {decodeHtmlEntities(discussion.country.name)}</span>
                            </span>
                            <span>•</span>
                            <span>{messages.length} message{messages.length > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages avec design moderne */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="space-y-6">
                    {messages.map((message, index) => {
                        const userRole = getUserRoleInfo(message.user);
                        const RoleIcon = userRole.icon;

                        return (
                            <div
                                key={message.id}
                                className={`bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 ${hoveredMessage === message.id ? 'scale-[1.02]' : ''}`}
                                onMouseEnter={() => setHoveredMessage(message.id)}
                                onMouseLeave={() => setHoveredMessage(null)}
                            >
                                {/* Header du message modernisé */}
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            {message.user?.profile_picture ? (
                                                <img
                                                    src={`http://localhost:8000${message.user.profile_picture}`}
                                                    alt=""
                                                    className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shadow-lg ${message.user?.profile_picture ? 'hidden' : ''}`}>
                                                <User size={20} className="text-slate-600" />
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${userRole.bg}`}>
                                                <RoleIcon size={12} className={userRole.color} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-slate-800">
                                                    {decodeHtmlEntities(message.user?.pseudo || 'Utilisateur supprimé')}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${userRole.bg} ${userRole.color} border border-current/20`}>
                                                    {userRole.name}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center space-x-2">
                                                <span>{userRole.messageCount} message{userRole.messageCount > 1 ? 's' : ''}</span>
                                                <span>•</span>
                                                <Clock size={12} />
                                                <span>{formatTime(message.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <span className="px-3 py-1 bg-slate-200 rounded-full text-xs font-medium text-slate-600">
                                            #{index + 1}
                                        </span>
                                    </div>
                                </div>

                                {/* Contenu du message */}
                                <div className="p-6">
                                    <div className="prose prose-slate max-w-none">
                                        {renderMessageContent(message.content)}
                                    </div>
                                </div>

                                {/* Actions avec animations */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-200">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleReaction(message.id, true)}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${message.reactions?.user_reaction === true
                                                ? 'bg-green-100 text-green-700 shadow-lg scale-105'
                                                : 'hover:bg-green-50 text-slate-600 hover:text-green-600'
                                                }`}
                                            disabled={!isAuthenticated}
                                        >
                                            <ThumbsUp size={16} className={message.reactions?.user_reaction === true ? 'animate-pulse' : ''} />
                                            <span className="font-medium">{message.reactions?.likes || 0}</span>
                                        </button>

                                        <button
                                            onClick={() => handleReaction(message.id, false)}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${message.reactions?.user_reaction === false
                                                ? 'bg-red-100 text-red-700 shadow-lg scale-105'
                                                : 'hover:bg-red-50 text-slate-600 hover:text-red-600'
                                                }`}
                                            disabled={!isAuthenticated}
                                        >
                                            <ThumbsDown size={16} className={message.reactions?.user_reaction === false ? 'animate-pulse' : ''} />
                                            <span className="font-medium">{message.reactions?.dislikes || 0}</span>
                                        </button>
                                    </div>

                                    {isAuthenticated && (
                                        <button
                                            onClick={() => handleReplyToMessage(message)}
                                            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-slate-600 hover:text-green-600 hover:bg-green-50 transition-all duration-300"
                                        >
                                            <Reply size={16} />
                                            <span className="font-medium">Citer</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Formulaire de réponse modernisé */}
                {isAuthenticated ? (
                    <div id="reply-form" className="mt-8 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200 p-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                                    <MessageCircle size={20} className="text-green-600" />
                                    <span>{replyingTo ? 'Répondre à un message' : 'Nouvelle réponse'}</span>
                                </h3>
                                {replyingTo && (
                                    <button
                                        onClick={cancelReply}
                                        className="flex items-center space-x-1 text-slate-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                                    >
                                        <X size={16} />
                                        <span>Annuler</span>
                                    </button>
                                )}
                            </div>
                            {replyingTo && (
                                <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                                    <div className="text-sm text-slate-600">
                                        En réponse à <strong className="text-green-700">{decodeHtmlEntities(replyingTo.user?.pseudo || 'Utilisateur supprimé')}</strong>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                        title="Ajouter une image"
                                    >
                                        <FileImage size={16} />
                                        <span>Image</span>
                                    </button>
                                </div>

                                <button
                                    onClick={() => setIsPreview(!isPreview)}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${isPreview
                                        ? 'bg-green-100 text-green-700 border border-green-300'
                                        : 'border border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    {isPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                                    <span>{isPreview ? 'Édition' : 'Aperçu'}</span>
                                </button>
                            </div>

                            {/* Zone de contenu */}
                            {isPreview ? (
                                <div className="min-h-32 p-4 border border-slate-300 rounded-xl bg-slate-50">
                                    <div className="prose prose-slate max-w-none">
                                        {newMessage ? renderMessageContent(newMessage) : (
                                            <span className="text-slate-500 italic">Aperçu du message...</span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Tapez votre message ici..."
                                    className="w-full h-32 p-4 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                                    maxLength="5000"
                                />
                            )}

                            {/* Zone de soumission */}
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-xs text-slate-500">
                                    {newMessage.length}/5000 caractères • Respectez la charte d'utilisation
                                </div>

                                <button
                                    onClick={handleSubmitMessage}
                                    disabled={!newMessage.trim() || isSubmitting}
                                    className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg ${!newMessage.trim() || isSubmitting
                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 hover:shadow-xl transform hover:scale-105'
                                        }`}
                                >
                                    <Send size={16} />
                                    <span>{isSubmitting ? 'Envoi...' : 'Poster'}</span>
                                </button>
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 text-center shadow-lg">
                        <div className="flex items-center justify-center space-x-2 text-yellow-800">
                            <User size={20} />
                            <span className="font-medium">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="underline hover:text-yellow-900 transition-colors"
                                >
                                    Connectez-vous
                                </button> pour participer à cette discussion
                            </span>
                        </div>
                    </div>
                )}

                {/* Pagination moderne */}
                {pagination && pagination.total_pages > 1 && (
                    <div className="mt-8 bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div className="text-slate-700 font-medium">
                                Page {pagination.current_page} sur {pagination.total_pages}
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${page === 1
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300 shadow-lg hover:shadow-xl'
                                        }`}
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    Précédent
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${page === pagination.total_pages
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300 shadow-lg hover:shadow-xl'
                                        }`}
                                    disabled={page === pagination.total_pages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Suivant
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal d'aperçu d'image */}
            {showImagePreview && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowImagePreview(null)}
                >
                    <div className="relative max-w-4xl max-h-full">
                        <img
                            src={showImagePreview}
                            alt="Preview"
                            className="max-w-full max-h-full rounded-xl shadow-2xl"
                        />
                        <button
                            onClick={() => setShowImagePreview(null)}
                            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all duration-300"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Footer moderne */}
            <footer className="bg-white border-t border-slate-200 py-12 mt-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between flex-col md:flex-row space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-4">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                ATLAS
                            </h3>
                            <span className="text-slate-400 hidden md:inline">|</span>
                            <span className="text-slate-600 font-medium text-center md:text-left">
                                Discussion : {decodeHtmlEntities(discussion.title)}
                            </span>
                        </div>
                        <div className="flex items-center space-x-6 text-slate-600">
                            <button
                                onClick={() => navigate(`/country/${discussion.country.id}/discussions`)}
                                className="hover:text-green-600 transition-colors font-medium"
                            >
                                Forum {decodeHtmlEntities(discussion.country.name)}
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="hover:text-green-600 transition-colors font-medium"
                            >
                                Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default TopicView;