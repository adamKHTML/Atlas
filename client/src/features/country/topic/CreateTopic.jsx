import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCreateDiscussionMutation, useUploadMessageImageMutation } from '../../../api/endpoints/forum';
import { useGetCountryByIdQuery } from '../../../api/endpoints/countries';
import { useSelector } from 'react-redux';
import { ArrowLeft, Image, Video, Send, Eye, EyeOff } from 'lucide-react';

const CreateTopic = () => {
    const { id: countryId } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPreview, setIsPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const user = useSelector(state => state.auth?.user);

    // RTK Query hooks
    const { data: countryData } = useGetCountryByIdQuery(countryId);
    const [createDiscussion] = useCreateDiscussionMutation();
    const [uploadImage] = useUploadMessageImageMutation();

    // Redirection si non connecté
    React.useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await uploadImage(formData).unwrap();
            const imageUrl = `http://localhost:8000${response.url}`;

            // Insérer l'image dans le contenu
            const imageMarkdown = `\n![Image](${imageUrl})\n`;
            setContent(prev => prev + imageMarkdown);
        } catch (error) {
            console.error('Erreur upload image:', error);
            alert('Erreur lors de l\'upload de l\'image');
        }
    };

    const handleVideoLink = () => {
        const videoUrl = prompt('Entrez l\'URL de la vidéo (YouTube, etc.) :');
        if (videoUrl) {
            const videoMarkdown = `\n[Vidéo](${videoUrl})\n`;
            setContent(prev => prev + videoMarkdown);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            alert('Le titre et le contenu sont obligatoires');
            return;
        }

        setIsSubmitting(true);

        try {
            const newDiscussion = await createDiscussion({
                countryId: parseInt(countryId),
                title: title.trim(),
                content: content.trim()
            }).unwrap();

            // Redirection vers la discussion créée
            navigate(`/topic/${newDiscussion.id}`);
        } catch (error) {
            console.error('Erreur création discussion:', error);
            alert('Erreur lors de la création de la discussion');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Rendu du contenu avec markdown simple
    const renderPreview = (text) => {
        return text
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded my-2" />')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br />');
    };

    if (!countryData) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#4a5c52' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                    <p className="text-white">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#4a5c52' }}>
            {/* Header */}
            <nav className="bg-black bg-opacity-50 backdrop-blur-sm border-b border-gray-700">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            <h1
                                className="text-2xl font-serif italic text-white cursor-pointer"
                                onClick={() => navigate('/dashboard')}
                                style={{ fontFamily: 'Vollkorn, Georgia, serif' }}
                            >
                                ATLAS
                            </h1>
                            <button
                                onClick={() => navigate(`/country/${countryId}/forum`)}
                                className="flex items-center space-x-2 text-white hover:text-yellow-400 transition-colors"
                            >
                                <ArrowLeft size={20} />
                                <span>Retour au forum</span>
                            </button>
                        </div>

                        <div className="flex items-center space-x-4">
                            <img
                                src={countryData.flag_url}
                                alt={`Drapeau ${countryData.name}`}
                                className="w-8 h-6 object-cover rounded shadow"
                            />
                            <span className="text-white font-medium">{countryData.name}</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Formulaire */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* En-tête */}
                    <div className="bg-gray-800 text-white px-6 py-4">
                        <h2 className="text-xl font-semibold">Nouveau sujet</h2>
                        <p className="text-gray-300 text-sm mt-1">
                            Créer une nouvelle discussion sur {countryData.name}
                        </p>
                    </div>

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit} className="p-6">
                        {/* Titre */}
                        <div className="mb-6">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Titre du sujet <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Saisir le titre du sujet"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-colors"
                                maxLength={255}
                                required
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                {title.length}/255 caractères
                            </div>
                        </div>

                        {/* Barre d'outils */}
                        <div className="mb-4">
                            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                    <Image size={16} />
                                    <span className="text-sm">Image</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleVideoLink}
                                    className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                >
                                    <Video size={16} />
                                    <span className="text-sm">Vidéo</span>
                                </button>

                                <div className="flex-1"></div>

                                <button
                                    type="button"
                                    onClick={() => setIsPreview(!isPreview)}
                                    className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                >
                                    {isPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                                    <span className="text-sm">{isPreview ? 'Éditer' : 'Aperçu'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Zone de contenu */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contenu <span className="text-red-500">*</span>
                            </label>

                            {isPreview ? (
                                <div
                                    className="w-full min-h-48 p-4 border border-gray-300 rounded-lg bg-gray-50"
                                    dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
                                />
                            ) : (
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Pour que les discussions restent agréables, nous vous remercions de rester poli en toutes circonstances. En postant sur nos espaces, vous vous engagez à en respecter la charte d'utilisation..."
                                    className="w-full min-h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-colors resize-none"
                                    required
                                />
                            )}

                            <div className="text-xs text-gray-500 mt-1">
                                Vous pouvez ajouter des images et des liens vidéo
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Astuce :</span> Utilisez **gras** et *italique* pour formater votre texte
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/country/${countryId}/forum`)}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !title.trim() || !content.trim()}
                                    className="flex items-center space-x-2 px-6 py-2 bg-yellow-400 text-gray-800 rounded-lg font-medium hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
                                            <span>Publication...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            <span>Publier</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Input file caché */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                />
            </div>
        </div>
    );
};

export default CreateTopic;