// CreateTopicForm.jsx - Version corrigée avec redirection et sans vidéo
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateDiscussionMutation, useUploadMessageImageMutation } from '../../../api/endpoints/forum';
import { Plus, Eye, EyeOff, Image, Send, X } from 'lucide-react';

const CreateTopicForm = ({ countryId, countryName, onSuccess }) => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPreview, setIsPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const fileInputRef = useRef(null);

    const [createDiscussion] = useCreateDiscussionMutation();
    const [uploadImage] = useUploadMessageImageMutation();

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await uploadImage(formData).unwrap();
            const imageUrl = `http://localhost:8000${response.url}`;
            const imageMarkdown = `\n![Image](${imageUrl})\n`;
            setContent(prev => prev + imageMarkdown);
        } catch (error) {
            console.error('Erreur upload image:', error);
            alert('Erreur lors de l\'upload de l\'image');
        }
    };

    // ✅ CORRECTION: Suppression de la fonction handleVideoLink

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);

        try {
            // ✅ CORRECTION: Récupération de la réponse pour redirection
            const newDiscussion = await createDiscussion({
                countryId: countryId,
                title: title,
                content: content || "Premier message du sujet."
            }).unwrap();

            // ✅ CORRECTION: Redirection vers TopicView
            navigate(`/topic/${newDiscussion.id}`);

            // Callback pour mise à jour parent si nécessaire
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Erreur lors de la création:', error);
            alert('Erreur lors de la création du sujet');
        } finally {
            setIsSubmitting(false);
        }
    };

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

    const handleReset = () => {
        setTitle('');
        setContent('');
        setIsPreview(false);
        setIsExpanded(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* En-tête avec style Atlas */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold" style={{ fontFamily: 'Vollkorn, Georgia, serif' }}>
                            Nouveau sujet
                        </h3>
                        <p className="text-gray-300 text-sm mt-1">
                            Créer une nouvelle discussion sur {countryName}
                        </p>
                    </div>
                    {isExpanded && (
                        <button
                            onClick={handleReset}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Contenu du formulaire */}
            <div className="p-6">
                {!isExpanded ? (
                    // Version compacte - juste un bouton pour démarrer
                    <div className="text-center">
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="inline-flex items-center space-x-2 px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-800 rounded-full font-medium transition-colors shadow-lg"
                        >
                            <Plus size={20} />
                            <span>Créer un nouveau sujet</span>
                        </button>
                        <p className="text-gray-600 text-sm mt-2">
                            Partagez vos expériences et conseils sur {countryName}
                        </p>
                    </div>
                ) : (
                    // Formulaire complet
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Titre du sujet */}
                        <div>
                            <label htmlFor="topic-title" className="block text-sm font-medium text-gray-700 mb-2">
                                Titre du sujet <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="topic-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Quel est le sujet de votre discussion ?"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-colors"
                                maxLength={255}
                                required
                                autoFocus
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                {title.length}/255 caractères
                            </div>
                        </div>

                        {/* Zone de sondage (optionnelle) */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <button
                                type="button"
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
                                onClick={() => alert('Fonctionnalité sondage à implémenter')}
                            >
                                <Plus size={16} />
                                <span>Ajouter un sondage (optionnel)</span>
                            </button>
                        </div>

                        {/* Barre d'outils - ✅ CORRECTION: Suppression du bouton vidéo */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                                >
                                    <Image size={16} />
                                    <span>Image</span>
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsPreview(!isPreview)}
                                className={`flex items-center space-x-1 px-3 py-2 border rounded-lg text-sm transition-colors ${isPreview
                                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                    : 'border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {isPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                                <span>{isPreview ? 'Éditer' : 'Aperçu'}</span>
                            </button>
                        </div>

                        {/* Zone de contenu / aperçu */}
                        {isPreview ? (
                            <div className="min-h-32 p-4 border border-gray-300 rounded-lg bg-gray-50">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu du contenu :</h4>
                                <div className="prose prose-sm max-w-none">
                                    {content ? renderMessageContent(content) : (
                                        <span className="text-gray-500 italic">Aucun contenu pour l'aperçu...</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label htmlFor="topic-content" className="block text-sm font-medium text-gray-700 mb-2">
                                    Contenu du message (optionnel)
                                </label>
                                <textarea
                                    id="topic-content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Décrivez votre sujet, partagez vos expériences, posez vos questions..."
                                    className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-colors"
                                />
                            </div>
                        )}

                        {/* Charte d'utilisation */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-sm text-gray-700 leading-relaxed">
                                <strong>Charte d'utilisation :</strong> Pour que les discussions restent agréables, nous vous remercions de rester poli en toutes circonstances. En postant sur nos espaces, vous vous engagez à en respecter la charte d'utilisation. Tout message discriminatoire ou incitant à la haine sera supprimé et son auteur sanctionné.
                            </p>
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex items-center justify-between pt-4">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Annuler
                            </button>

                            <button
                                type="submit"
                                disabled={!title.trim() || isSubmitting}
                                className="flex items-center space-x-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-full font-medium transition-colors shadow-lg disabled:cursor-not-allowed"
                            >
                                <Send size={18} />
                                <span>{isSubmitting ? 'Création...' : 'Publier le sujet'}</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Input caché pour les fichiers */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
            />
        </div>
    );
};

export default CreateTopicForm;