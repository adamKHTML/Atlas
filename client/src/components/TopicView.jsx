import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetDiscussionQuery, useAddMessageMutation, useUploadMessageImageMutation, useReactToMessageMutation, useUnreactToMessageMutation } from '../api/endpoints/forum';
import { useSelector } from 'react-redux';
import { ArrowLeft, ThumbsUp, ThumbsDown, Image, Video, Send, Eye, EyeOff, MessageCircle, User, Clock } from 'lucide-react';

const TopicView = () => {
    const { topicId } = useParams(); // Note: devrait être topicId selon vos routes
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [newMessage, setNewMessage] = useState('');
    const [isPreview, setIsPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const user = useSelector(state => state.auth?.user);
    const isAuthenticated = !!user;

    // RTK Query hooks - Vraies données de la base
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

    // Extract real data
    const discussion = discussionData?.discussion;
    const messages = discussionData?.messages || [];
    const pagination = discussionData?.pagination;

    // Format time for display
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get user level based on message count (simulation based on user data)
    const getUserLevel = (userId) => {
        const levels = [
            { min: 0, max: 10, name: "Niveau 1", color: "text-gray-600" },
            { min: 11, max: 50, name: "Niveau 2", color: "text-green-600" },
            { min: 51, max: 200, name: "Niveau 3", color: "text-blue-600" },
            { min: 201, max: 1000, name: "Niveau 4", color: "text-purple-600" },
            { min: 1001, max: 5000, name: "Niveau 5", color: "text-orange-600" },
        ];

        // Simulation du nombre de messages basé sur l'ID utilisateur
        const messageCount = Math.floor(Math.random() * 500) + 1;
        const level = levels.find(l => messageCount >= l.min && messageCount <= l.max) || levels[0];

        return { ...level, messageCount };
    };

    // Handle reactions
    const handleReaction = async (messageId, type) => {
        if (!isAuthenticated) return;

        try {
            const message = messages.find(m => m.id === messageId);
            const currentReaction = message?.reactions?.user_reaction;

            if (currentReaction === type) {
                // Remove reaction
                await unreactToMessage({ messageId }).unwrap();
            } else {
                // Add/change reaction
                await reactToMessage({ messageId, type }).unwrap();
            }

            // Refresh discussion to get updated reactions
            refetchDiscussion();
        } catch (error) {
            console.error('Erreur réaction:', error);
        }
    };

    // Handle image upload
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await uploadImage(formData).unwrap();
            const imageUrl = `http://localhost:8000${response.url}`;

            const imageMarkdown = `\n![Image](${imageUrl})\n`;
            setNewMessage(prev => prev + imageMarkdown);
        } catch (error) {
            console.error('Erreur upload image:', error);
            alert('Erreur lors de l\'upload de l\'image');
        }
    };

    // Handle video link
    const handleVideoLink = () => {
        const videoUrl = prompt('Entrez l\'URL de la vidéo (YouTube, etc.)');
        if (!videoUrl) return;

        const videoMarkdown = `\n[Vidéo](${videoUrl})\n`;
        setNewMessage(prev => prev + videoMarkdown);
    };

    // Submit new message
    const handleSubmitMessage = async () => {
        if (!newMessage.trim() || !isAuthenticated) return;

        setIsSubmitting(true);

        try {
            await addMessage({
                discussionId: parseInt(topicId),
                content: newMessage
            }).unwrap();

            setNewMessage('');
            setIsPreview(false);
            refetchDiscussion();
        } catch (error) {
            console.error('Erreur ajout message:', error);
            alert('Erreur lors de l\'ajout du message');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render message content with markdown-like parsing
    const renderMessageContent = (content) => {
        if (!content) return null;

        const parts = content.split(/(\!\[.*?\]\(.*?\))/g);

        return parts.map((part, index) => {
            const imageMatch = part.match(/\!\[(.*?)\]\((.*?)\)/);
            if (imageMatch) {
                return (
                    <img
                        key={index}
                        src={imageMatch[2]}
                        alt={imageMatch[1]}
                        className="max-w-full h-auto rounded-lg mt-2 mb-2"
                        onError={(e) => e.target.style.display = 'none'}
                    />
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Chargement de la discussion...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !discussion) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <MessageCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2 text-gray-900">
                            Discussion introuvable
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Cette discussion n'existe pas ou a été supprimée.
                        </p>
                        <button
                            onClick={() => navigate(-1)}
                            className="text-teal-600 hover:text-teal-800 underline"
                        >
                            Retour
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate(`/country/${discussion.country.id}/discussions`)}
                            className="flex items-center space-x-2 text-yellow-300 hover:text-yellow-200 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Retour au forum</span>
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-yellow-300 truncate">
                                {discussion.title}
                            </h1>
                            <p className="text-sm text-gray-200">
                                Forum {discussion.country.name}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="space-y-4">
                    {messages.map((message, index) => {
                        const userLevel = getUserLevel(message.user.id);

                        return (
                            <div key={message.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                                {/* Message header */}
                                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        {message.user.profile_picture ? (
                                            <img
                                                src={`http://localhost:8000${message.user.profile_picture}`}
                                                alt=""
                                                className="w-10 h-10 rounded-full border-2 border-gray-200"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center ${message.user.profile_picture ? 'hidden' : ''}`}>
                                            <User size={20} className="text-gray-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-gray-900">
                                                    {message.user.pseudo}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${userLevel.color}`}>
                                                    {userLevel.name}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {userLevel.messageCount} messages
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-500 flex items-center space-x-1">
                                        <Clock size={14} />
                                        <span>{formatTime(message.created_at)}</span>
                                    </div>
                                </div>

                                {/* Message content */}
                                <div className="px-4 py-4">
                                    <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                                        {renderMessageContent(message.content)}
                                    </div>
                                </div>

                                {/* Reactions */}
                                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => handleReaction(message.id, true)}
                                            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${message.reactions?.user_reaction === true
                                                ? 'bg-green-100 text-green-700'
                                                : 'hover:bg-gray-100 text-gray-600'
                                                }`}
                                            disabled={!isAuthenticated}
                                        >
                                            <ThumbsUp size={16} />
                                            <span>{message.reactions?.likes || 0}</span>
                                        </button>

                                        <button
                                            onClick={() => handleReaction(message.id, false)}
                                            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${message.reactions?.user_reaction === false
                                                ? 'bg-red-100 text-red-700'
                                                : 'hover:bg-gray-100 text-gray-600'
                                                }`}
                                            disabled={!isAuthenticated}
                                        >
                                            <ThumbsDown size={16} />
                                            <span>{message.reactions?.dislikes || 0}</span>
                                        </button>
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        #{index + 1}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Reply form */}
                {isAuthenticated ? (
                    <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <h3 className="font-medium text-gray-900">Répondre</h3>
                        </div>

                        <div className="p-4">
                            {/* Toolbar */}
                            <div className="flex items-center space-x-2 mb-3 border-b border-gray-200 pb-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                                    title="Ajouter une image"
                                >
                                    <Image size={16} />
                                    <span>Image</span>
                                </button>

                                <button
                                    onClick={handleVideoLink}
                                    className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                                    title="Ajouter une vidéo"
                                >
                                    <Video size={16} />
                                    <span>Vidéo</span>
                                </button>

                                <div className="flex-1"></div>

                                <button
                                    onClick={() => setIsPreview(!isPreview)}
                                    className={`flex items-center space-x-1 px-3 py-1 border rounded text-sm transition-colors ${isPreview
                                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                        : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {isPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                                    <span>{isPreview ? 'Édition' : 'Aperçu'}</span>
                                </button>
                            </div>

                            {/* Content area */}
                            {isPreview ? (
                                <div className="min-h-32 p-3 border border-gray-300 rounded bg-gray-50 text-gray-800">
                                    {newMessage ? renderMessageContent(newMessage) : (
                                        <span className="text-gray-500 italic">Aperçu du message...</span>
                                    )}
                                </div>
                            ) : (
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Tapez votre message ici..."
                                    className="w-full h-32 p-3 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                />
                            )}

                            {/* Submit button */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-xs text-gray-500">
                                    Pour que les discussions restent agréables, respectez la charte d'utilisation.
                                </div>

                                <button
                                    onClick={handleSubmitMessage}
                                    disabled={!newMessage.trim() || isSubmitting}
                                    className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-6 py-2 rounded transition-colors"
                                >
                                    <Send size={16} />
                                    <span>{isSubmitting ? 'Envoi...' : 'Poster'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <p className="text-yellow-800">
                            <span
                                className="font-medium underline cursor-pointer"
                                onClick={() => navigate('/login')}
                            >
                                Connectez-vous
                            </span> pour répondre à cette discussion
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.total_pages > 1 && (
                    <div className="mt-6 bg-white rounded-lg border border-gray-200 px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Page {pagination.current_page} sur {pagination.total_pages}
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    Précédent
                                </button>
                                <button
                                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
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
        </div>
    );
};

export default TopicView;