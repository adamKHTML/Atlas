import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import { selectUser } from '../../store/slices/authSlice';
import {
    useCreateNotificationMutation,
    useGetNotificationsQuery,
    useMarkAsReadMutation
} from '../../api/endpoints/notifications';

// Fonction pour décoder les entités HTML
const decodeHtmlEntities = (text) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
};

const NotificationView = ({
    conversation,
    onBack,
    isMobile = false,
    screenSize = { isMobile: false, isTablet: false, isDesktop: true }
}) => {
    const currentUser = useSelector(selectUser);
    const currentUserId = currentUser?.id;
    const [newMessage, setNewMessage] = useState('');
    const [editingMessage, setEditingMessage] = useState(null);
    const [editText, setEditText] = useState('');
    const [messages, setMessages] = useState([]);
    const [tempMessages, setTempMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const [createNotification, { isLoading: isSending }] = useCreateNotificationMutation();
    const [markAsRead] = useMarkAsReadMutation();
    const { data: notificationsData, refetch } = useGetNotificationsQuery({
        page: 1,
        limit: 100
    });

    // 🔄 Scroll automatique vers le bas
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 📊 Traitement des messages COMPATIBLE (anciens + nouveaux)
    useEffect(() => {
        if (!conversation || !notificationsData?.notifications || !currentUserId) {
            setMessages([]);
            return;
        }

        const conversationMessages = [];

        notificationsData.notifications.forEach(notif => {
            // 🔍 Essayer d'extraire les données SENDER (nouveaux messages)
            const senderMatch = notif.content_notification.match(/\[SENDER:(\d+)\]\[SENDER_DATA:([A-Za-z0-9+/=]+)\]/);
            let senderId = null;
            let isNewFormat = false;

            if (senderMatch) {
                // ✅ NOUVEAU FORMAT
                senderId = parseInt(senderMatch[1]);
                isNewFormat = true;

                const cleanContent = decodeHtmlEntities(
                    notif.content_notification.replace(/\[SENDER:\d+\]\[SENDER_DATA:[A-Za-z0-9+/=]+\]/g, '').trim()
                );

                // Vérifier si le message appartient à cette conversation
                const belongsToConversation =
                    (senderId === conversation.id && notif.user_id === currentUserId) || // Message reçu
                    (senderId === currentUserId && notif.user_id === conversation.id);   // Message envoyé

                if (belongsToConversation) {
                    conversationMessages.push({
                        id: notif.id,
                        content: cleanContent,
                        isFromMe: senderId === currentUserId,
                        isRead: notif.is_read,
                        createdAt: notif.created_at,
                        createdAtFormatted: notif.created_at_formatted,
                        canEdit: senderId === currentUserId,
                        timestamp: new Date(notif.created_at).getTime(),
                        isOldFormat: false
                    });
                }
            } else {
                // 📱 ANCIEN FORMAT - Logique flexible pour tous les utilisateurs
                isNewFormat = false;

                const cleanContent = decodeHtmlEntities(notif.content_notification.trim());
                let belongsToConversation = false;
                let isFromMe = false;

                // Logique universelle pour anciens messages
                if (notif.user_id === currentUserId) {
                    // Message reçu - accepté pour conversation
                    belongsToConversation = true;
                    isFromMe = false;
                } else if (notif.user_id === conversation.id) {
                    // Message envoyé à cette personne
                    belongsToConversation = true;
                    isFromMe = true;
                }

                if (belongsToConversation) {
                    conversationMessages.push({
                        id: notif.id,
                        content: cleanContent,
                        isFromMe: isFromMe,
                        isRead: notif.is_read,
                        createdAt: notif.created_at,
                        createdAtFormatted: notif.created_at_formatted,
                        canEdit: isFromMe,
                        timestamp: new Date(notif.created_at).getTime(),
                        isOldFormat: true
                    });
                }
            }
        });

        // Combiner avec les messages temporaires et trier
        const allMessages = [...conversationMessages, ...tempMessages];
        allMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(allMessages);

        // Marquer les messages reçus comme lus
        conversationMessages.forEach(msg => {
            if (!msg.isRead && !msg.isFromMe) {
                markAsRead(msg.id).catch(err => console.error('Erreur marquage lu:', err));
            }
        });

    }, [conversation, notificationsData, tempMessages, markAsRead, currentUserId]);

    // 🔄 Scroll vers le bas quand nouveaux messages
    useEffect(() => {
        setTimeout(scrollToBottom, 50);
    }, [messages]);

    // 🔄 Rafraîchir pour l'instantané
    useEffect(() => {
        if (!conversation) return;

        const interval = setInterval(() => {
            refetch();
        }, screenSize.isMobile ? 1000 : 500);

        return () => clearInterval(interval);
    }, [conversation, refetch, screenSize.isMobile]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            adjustTextareaHeight(textareaRef.current);
        }
    }, [newMessage]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !conversation || isSending) return;

        const tempId = `temp-${Date.now()}`;
        const now = Date.now();

        const tempMessage = {
            id: tempId,
            content: newMessage.trim(),
            isFromMe: true,
            isRead: true,
            createdAt: new Date().toISOString(),
            createdAtFormatted: "À l'instant",
            canEdit: true,
            status: 'sending',
            timestamp: now,
            isOldFormat: false
        };

        setTempMessages(prev => [...prev, tempMessage]);
        const messageToSend = newMessage.trim();
        setNewMessage('');

        setTimeout(scrollToBottom, 10);

        try {
            await createNotification({
                recipient_id: conversation.id,
                type_notification: 'message',
                content_notification: messageToSend
            }).unwrap();

            setTempMessages(prev => prev.map(msg =>
                msg.id === tempId
                    ? { ...msg, status: 'sent' }
                    : msg
            ));

            setTimeout(() => {
                refetch();
                setTimeout(() => {
                    setTempMessages(prev => prev.filter(msg => msg.id !== tempId));
                }, 1000);
            }, 300);

        } catch (error) {
            console.error('Erreur envoi:', error);
            setTempMessages(prev => prev.map(msg =>
                msg.id === tempId
                    ? { ...msg, status: 'failed' }
                    : msg
            ));
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleEditMessage = (message) => {
        if (!message.canEdit || message.status === 'sending' || message.isOldFormat) return;
        setEditingMessage(message.id);
        setEditText(message.content);
    };

    const handleSaveEdit = () => {
        if (!editText.trim()) return;

        if (tempMessages.find(msg => msg.id === editingMessage)) {
            setTempMessages(prev => prev.map(msg =>
                msg.id === editingMessage
                    ? { ...msg, content: editText.trim(), edited: true }
                    : msg
            ));
        } else {
            setMessages(prev => prev.map(msg =>
                msg.id === editingMessage
                    ? { ...msg, content: editText.trim(), edited: true }
                    : msg
            ));
        }

        setEditingMessage(null);
        setEditText('');
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
        setEditText('');
    };

    const adjustTextareaHeight = (textarea) => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, screenSize.isMobile ? 100 : 120) + 'px';
    };

    if (!conversation) {
        return (
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                backgroundColor: '#ECF3F0',
                backgroundImage: `
                    radial-gradient(circle at 25% 25%, rgba(55, 70, 64, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)
                `,
                padding: screenSize.isMobile ? '20px' : '60px 40px'
            }}>
                <div style={{
                    textAlign: 'center',
                    color: '#374640',
                    maxWidth: screenSize.isMobile ? '280px' : '500px'
                }}>
                    <div style={{
                        fontSize: screenSize.isMobile ? '60px' : '80px',
                        marginBottom: screenSize.isMobile ? '16px' : '24px',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                    }}>💬</div>
                    <h3 style={{
                        margin: '0 0 12px 0',
                        color: '#374640',
                        fontSize: screenSize.isMobile ? '20px' : '24px',
                        fontWeight: '600'
                    }}>
                        {screenSize.isMobile ? 'Sélectionnez un contact' : 'Sélectionnez une conversation'}
                    </h3>
                    <p style={{
                        margin: 0,
                        color: '#6b7280',
                        fontSize: screenSize.isMobile ? '14px' : '16px',
                        lineHeight: '1.5'
                    }}>
                        {screenSize.isMobile ?
                            'Choisissez un contact pour commencer' :
                            'Choisissez une conversation pour commencer à échanger'
                        }
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            height: '100%'
        }}>
            {/* Header responsive - couleur verte uniforme */}
            <div style={{
                padding: screenSize.isMobile ? '12px 16px' : '16px 24px',
                borderBottom: '1px solid #e5e7eb',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: screenSize.isMobile ? '12px' : '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                {/* Bouton retour mobile */}
                {screenSize.isMobile && (
                    <button
                        onClick={onBack}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            cursor: 'pointer',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        }}
                    >
                        <ArrowLeft size={18} />
                    </button>
                )}

                {/* Avatar adaptatif - vert */}
                <div style={{ position: 'relative' }}>
                    {conversation.avatar ? (
                        <img
                            src={conversation.avatar}
                            alt={conversation.name}
                            style={{
                                width: screenSize.isMobile ? '40px' : '48px',
                                height: screenSize.isMobile ? '40px' : '48px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid rgba(255,255,255,0.2)'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: screenSize.isMobile ? '40px' : '48px',
                            height: screenSize.isMobile ? '40px' : '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: screenSize.isMobile ? '16px' : '20px',
                            color: 'white',
                            fontWeight: '600',
                            border: '2px solid rgba(255,255,255,0.2)'
                        }}>
                            {conversation.name.charAt(0).toUpperCase()}
                        </div>
                    )}

                    {/* Point indicateur vert */}
                    <div style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: screenSize.isMobile ? '10px' : '12px',
                        height: screenSize.isMobile ? '10px' : '12px',
                        backgroundColor: '#22c55e',
                        borderRadius: '50%',
                        border: '2px solid white',
                        boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)'
                    }} />
                </div>

                {/* Info conversation - sans badges */}
                <div style={{ flex: 1 }}>
                    <h3 style={{
                        margin: '0 0 4px 0',
                        color: 'white',
                        fontSize: screenSize.isMobile ? '16px' : '18px',
                        fontWeight: '600'
                    }}>
                        {conversation.name}
                    </h3>
                    <div style={{
                        fontSize: screenSize.isMobile ? '12px' : '13px',
                        color: 'rgba(255,255,255,0.8)'
                    }}>
                        @{conversation.pseudo}
                    </div>
                </div>
            </div>

            {/* Messages responsive */}
            <div style={{
                flex: 1,
                padding: screenSize.isMobile ? '15px' : '20px',
                overflow: 'auto',
                backgroundColor: '#ECF3F0',
                backgroundImage: `
                    radial-gradient(circle at 20% 50%, rgba(55, 70, 64, 0.05) 0%, transparent 50%),
                    radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)
                `,
                backgroundSize: '75px 50px'
            }}>
                {messages.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: screenSize.isMobile ? '40px 15px' : '60px 20px',
                        color: '#6b7280'
                    }}>
                        <div style={{
                            fontSize: screenSize.isMobile ? '32px' : '48px',
                            marginBottom: screenSize.isMobile ? '12px' : '16px'
                        }}>✨</div>
                        <p style={{
                            margin: 0,
                            fontSize: screenSize.isMobile ? '14px' : '16px'
                        }}>
                            Commencez votre conversation avec {conversation.name}
                        </p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isEditing = editingMessage === message.id;

                        return (
                            <div key={message.id || `temp-${index}`} style={{
                                marginBottom: screenSize.isMobile ? '8px' : '12px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: message.isFromMe ? 'flex-end' : 'flex-start',
                                    marginBottom: '4px'
                                }}>
                                    <div
                                        style={{
                                            maxWidth: screenSize.isMobile ? '85%' : '70%',
                                            padding: screenSize.isMobile ? '10px 14px' : '12px 16px',
                                            borderRadius: message.isFromMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            backgroundColor: message.isFromMe ?
                                                (message.status === 'sending' ? '#d1fae5' :
                                                    message.status === 'failed' ? '#fee2e2' : '#22c55e') : // ✅ Vert clair
                                                'white',
                                            color: message.isFromMe ?
                                                (message.status === 'sending' ? '#065f46' :
                                                    message.status === 'failed' ? '#991b1b' : 'white') :
                                                '#374640',
                                            boxShadow: message.isFromMe ?
                                                '0 2px 8px rgba(34, 197, 94, 0.3)' :
                                                '0 2px 8px rgba(0,0,0,0.1)',
                                            position: 'relative',
                                            cursor: (message.canEdit && !message.status && !message.isOldFormat) ? 'pointer' : 'default',
                                            transition: 'all 0.2s',
                                            wordBreak: 'break-word'
                                        }}
                                        onClick={() => handleEditMessage(message)}
                                        onMouseOver={(e) => {
                                            if (message.canEdit && !isEditing && !screenSize.isMobile && !message.status && !message.isOldFormat) {
                                                e.currentTarget.style.transform = 'scale(1.02)';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (message.canEdit && !isEditing && !screenSize.isMobile && !message.status && !message.isOldFormat) {
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }
                                        }}
                                    >
                                        {isEditing ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <textarea
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    style={{
                                                        border: 'none',
                                                        outline: 'none',
                                                        backgroundColor: 'transparent',
                                                        color: 'inherit',
                                                        fontSize: screenSize.isMobile ? '13px' : '14px',
                                                        resize: 'none',
                                                        minHeight: '20px',
                                                        fontFamily: 'inherit',
                                                        width: '100%'
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSaveEdit();
                                                        }
                                                        if (e.key === 'Escape') {
                                                            handleCancelEdit();
                                                        }
                                                    }}
                                                    autoFocus
                                                />
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCancelEdit();
                                                        }}
                                                        style={{
                                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                                            color: 'inherit',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            padding: screenSize.isMobile ? '3px 6px' : '4px 8px',
                                                            fontSize: '10px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSaveEdit();
                                                        }}
                                                        style={{
                                                            backgroundColor: 'rgba(255,255,255,0.9)',
                                                            color: '#22c55e',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            padding: screenSize.isMobile ? '3px 6px' : '4px 8px',
                                                            fontSize: '10px',
                                                            cursor: 'pointer',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        ✓
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{
                                                    fontSize: screenSize.isMobile ? '13px' : '14px',
                                                    lineHeight: '1.4',
                                                    whiteSpace: 'pre-wrap',
                                                    marginBottom: '4px'
                                                }}>
                                                    {message.content}
                                                </div>

                                                {/* Status et time - sans badges anciens */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '8px',
                                                    fontSize: screenSize.isMobile ? '10px' : '11px',
                                                    color: message.isFromMe ? 'rgba(255,255,255,0.8)' : '#9ca3af'
                                                }}>
                                                    <span>{message.createdAtFormatted}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {message.edited && <span title="Message édité">✏️</span>}
                                                        {message.canEdit && !screenSize.isMobile && !message.status && !message.isOldFormat && (
                                                            <svg
                                                                width="12"
                                                                height="12"
                                                                viewBox="0 0 24 24"
                                                                fill="currentColor"
                                                                style={{ opacity: 0.7 }}
                                                            >
                                                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                                            </svg>
                                                        )}
                                                        {message.isFromMe && (
                                                            <span style={{ fontSize: screenSize.isMobile ? '10px' : '12px' }}>
                                                                {message.status === 'sending' ? '⏳' :
                                                                    message.status === 'failed' ? '❌' : '✓✓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie responsive */}
            <div style={{
                padding: screenSize.isMobile ? '12px 16px' : '16px 20px',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'flex-end',
                gap: screenSize.isMobile ? '8px' : '12px'
            }}>
                {/* Zone de texte responsive */}
                <div style={{
                    flex: 1,
                    backgroundColor: '#f9fafb',
                    borderRadius: screenSize.isMobile ? '20px' : '24px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'flex-end',
                    overflow: 'hidden'
                }}>
                    <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            adjustTextareaHeight(e.target);
                        }}
                        onKeyPress={handleKeyPress}
                        placeholder="Tapez votre message..."
                        style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            padding: screenSize.isMobile ? '10px 14px' : '12px 16px',
                            fontSize: screenSize.isMobile ? '13px' : '14px',
                            backgroundColor: 'transparent',
                            resize: 'none',
                            minHeight: '20px',
                            maxHeight: screenSize.isMobile ? '100px' : '120px',
                            fontFamily: 'inherit',
                            lineHeight: '1.4'
                        }}
                        rows={1}
                    />
                </div>

                {/* Bouton d'envoi responsive - vert */}
                <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    style={{
                        backgroundColor: newMessage.trim() ? '#22c55e' : '#d1d5db',
                        border: 'none',
                        borderRadius: '50%',
                        width: screenSize.isMobile ? '40px' : '44px',
                        height: screenSize.isMobile ? '40px' : '44px',
                        cursor: newMessage.trim() && !isSending ? 'pointer' : 'not-allowed',
                        fontSize: screenSize.isMobile ? '16px' : '18px',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: newMessage.trim() ? '0 2px 8px rgba(34, 197, 94, 0.3)' : 'none',
                        transform: isSending ? 'scale(0.95)' : 'scale(1)'
                    }}
                >
                    {isSending ? '⏳' : '➤'}
                </button>
            </div>
        </div>
    );
};

export default NotificationView;