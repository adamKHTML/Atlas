import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import {
    useCreateNotificationMutation,
    useGetNotificationsQuery,
    useMarkAsReadMutation
} from '../../api/endpoints/notifications';

const NotificationView = ({ conversation, onBack }) => {
    const currentUser = useSelector(selectUser);
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

    // 📊 Traitement des messages BIDIRECTIONNEL - LOGIQUE CORRECTE
    useEffect(() => {
        if (!conversation || !notificationsData?.notifications || !currentUser) {
            setMessages([]);
            return;
        }

        console.log('🔍 Toutes les notifications:', notificationsData.notifications);
        console.log('👤 Current user:', currentUser.id);
        console.log('💬 Conversation avec:', conversation.id);

        const conversationMessages = [];

        // PARCOURIR TOUTES LES NOTIFICATIONS pour trouver celles de cette conversation
        notificationsData.notifications.forEach(notif => {
            const senderMatch = notif.content_notification.match(/\[SENDER:(\d+)\]\[SENDER_DATA:([A-Za-z0-9+/=]+)\]/);

            if (senderMatch) {
                const senderId = parseInt(senderMatch[1]);
                const cleanContent = notif.content_notification.replace(/\[SENDER:\d+\]\[SENDER_DATA:[A-Za-z0-9+/=]+\]/g, '').trim();

                // Messages REÇUS : l'autre m'envoie (senderId = conversation.id ET notif.user.id = currentUser.id)
                if (senderId === conversation.id && notif.user_id === currentUser.id) {
                    console.log('📨 Message REÇU de', conversation.id, ':', cleanContent);
                    conversationMessages.push({
                        id: notif.id,
                        content: cleanContent,
                        isFromMe: false,
                        isRead: notif.is_read,
                        createdAt: notif.created_at,
                        createdAtFormatted: notif.created_at_formatted,
                        canEdit: false,
                        timestamp: new Date(notif.created_at).getTime()
                    });
                }

                // Messages ENVOYÉS : j'envoie à l'autre (senderId = currentUser.id ET notif.user_id = conversation.id)
                if (senderId === currentUser.id && notif.user_id === conversation.id) {
                    console.log('📤 Message ENVOYÉ vers', conversation.id, ':', cleanContent);
                    conversationMessages.push({
                        id: notif.id,
                        content: cleanContent,
                        isFromMe: true,
                        isRead: true,
                        createdAt: notif.created_at,
                        createdAtFormatted: notif.created_at_formatted,
                        canEdit: true,
                        timestamp: new Date(notif.created_at).getTime()
                    });
                }
            }
        });

        console.log('📋 Total messages trouvés:', conversationMessages.length);

        // Combiner avec les messages temporaires
        const allMessages = [...conversationMessages, ...tempMessages];

        // Trier par timestamp
        allMessages.sort((a, b) => a.timestamp - b.timestamp);

        setMessages(allMessages);

        // Marquer comme lu INSTANTANÉMENT (seulement les messages reçus)
        conversationMessages.forEach(msg => {
            if (!msg.isRead && !msg.isFromMe) {
                markAsRead(msg.id);
            }
        });

    }, [conversation, notificationsData, tempMessages, markAsRead, currentUser]);

    // 🔄 Scroll vers le bas quand nouveaux messages
    useEffect(() => {
        setTimeout(scrollToBottom, 50);
    }, [messages]);

    // 🔄 Rafraîchir pour l'instantané
    useEffect(() => {
        if (!conversation) return;

        const interval = setInterval(() => {
            refetch();
        }, 500);

        return () => clearInterval(interval);
    }, [conversation, refetch]);

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
            timestamp: now
        };

        // ⚡ Affichage INSTANTANÉ
        setTempMessages(prev => [...prev, tempMessage]);
        const messageToSend = newMessage.trim();
        setNewMessage('');

        setTimeout(scrollToBottom, 10);

        try {
            const response = await createNotification({
                recipient_id: conversation.id,
                type_notification: 'message',
                content_notification: messageToSend
            }).unwrap();

            // Mettre à jour le message temporaire
            setTempMessages(prev => prev.map(msg =>
                msg.id === tempId
                    ? { ...msg, status: 'sent' }
                    : msg
            ));

            // Rafraîchir et nettoyer
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
        if (!message.canEdit) return;
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
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
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
                `
            }}>
                <div style={{
                    textAlign: 'center',
                    color: '#374640',
                    padding: '60px 40px',
                    maxWidth: '500px'
                }}>
                    <div style={{
                        fontSize: '80px',
                        marginBottom: '24px',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                    }}>💬</div>
                    <h3 style={{
                        margin: '0 0 12px 0',
                        color: '#374640',
                        fontSize: '24px',
                        fontWeight: '600'
                    }}>
                        Sélectionnez une conversation
                    </h3>
                    <p style={{
                        margin: 0,
                        color: '#6b7280',
                        fontSize: '16px',
                        lineHeight: '1.5'
                    }}>
                        Choisissez une conversation pour commencer à échanger
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
            backgroundColor: 'white'
        }}>
            {/* Header simplifié */}
            <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e5e7eb',
                background: 'linear-gradient(135deg, #374640 0%, #2d3a32 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                {/* Avatar avec point vert */}
                <div style={{ position: 'relative' }}>
                    {conversation.avatar ? (
                        <img
                            src={conversation.avatar}
                            alt={conversation.name}
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid rgba(255,255,255,0.2)'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            color: 'white',
                            fontWeight: '600',
                            border: '2px solid rgba(255,255,255,0.2)'
                        }}>
                            {conversation.name.charAt(0).toUpperCase()}
                        </div>
                    )}

                    {/* Point vert décoratif */}
                    <div style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        border: '2px solid white',
                        boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)'
                    }} />
                </div>

                {/* Info conversation */}
                <div style={{ flex: 1 }}>
                    <h3 style={{
                        margin: '0 0 4px 0',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '600'
                    }}>
                        {conversation.name}
                    </h3>
                    <div style={{
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.8)'
                    }}>
                        @{conversation.pseudo}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                padding: '20px',
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
                        padding: '60px 20px',
                        color: '#6b7280'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
                        <p style={{ margin: 0, fontSize: '16px' }}>
                            Commencez votre conversation avec {conversation.name}
                        </p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isEditing = editingMessage === message.id;

                        return (
                            <div key={message.id || `temp-${index}`} style={{ marginBottom: '12px' }}>
                                {/* Message bubble */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: message.isFromMe ? 'flex-end' : 'flex-start',
                                    marginBottom: '4px'
                                }}>
                                    <div
                                        style={{
                                            maxWidth: '70%',
                                            padding: '12px 16px',
                                            borderRadius: message.isFromMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            backgroundColor: message.isFromMe ?
                                                (message.status === 'sending' ? '#d1fae5' :
                                                    message.status === 'failed' ? '#fee2e2' : '#10b981') :
                                                'white',
                                            color: message.isFromMe ?
                                                (message.status === 'sending' ? '#065f46' :
                                                    message.status === 'failed' ? '#991b1b' : 'white') :
                                                '#374640',
                                            boxShadow: message.isFromMe ?
                                                '0 2px 8px rgba(16, 185, 129, 0.3)' :
                                                '0 2px 8px rgba(0,0,0,0.1)',
                                            position: 'relative',
                                            cursor: message.canEdit ? 'pointer' : 'default',
                                            transition: 'all 0.2s',
                                            wordBreak: 'break-word'
                                        }}
                                        onClick={() => handleEditMessage(message)}
                                        onMouseOver={(e) => {
                                            if (message.canEdit && !isEditing) {
                                                e.target.style.transform = 'scale(1.02)';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (message.canEdit && !isEditing) {
                                                e.target.style.transform = 'scale(1)';
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
                                                        fontSize: '14px',
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
                                                            padding: '4px 8px',
                                                            fontSize: '11px',
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
                                                            color: '#10b981',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            padding: '4px 8px',
                                                            fontSize: '11px',
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
                                                    fontSize: '14px',
                                                    lineHeight: '1.4',
                                                    whiteSpace: 'pre-wrap',
                                                    marginBottom: '4px'
                                                }}>
                                                    {message.content}
                                                </div>

                                                {/* Status et time */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '8px',
                                                    fontSize: '11px',
                                                    color: message.isFromMe ? 'rgba(255,255,255,0.8)' : '#9ca3af'
                                                }}>
                                                    <span>{message.createdAtFormatted}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {message.edited && <span title="Message édité">✏️</span>}
                                                        {message.canEdit && (
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
                                                            <span style={{ fontSize: '12px' }}>
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

            {/* Zone de saisie simplifiée */}
            <div style={{
                padding: '16px 20px',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '12px'
            }}>
                {/* Zone de texte */}
                <div style={{
                    flex: 1,
                    backgroundColor: '#f9fafb',
                    borderRadius: '24px',
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
                            padding: '12px 16px',
                            fontSize: '14px',
                            backgroundColor: 'transparent',
                            resize: 'none',
                            minHeight: '20px',
                            maxHeight: '120px',
                            fontFamily: 'inherit',
                            lineHeight: '1.4'
                        }}
                        rows={1}
                    />
                </div>

                {/* Bouton d'envoi */}
                <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    style={{
                        backgroundColor: newMessage.trim() ? '#10b981' : '#d1d5db',
                        border: 'none',
                        borderRadius: '50%',
                        width: '44px',
                        height: '44px',
                        cursor: newMessage.trim() && !isSending ? 'pointer' : 'not-allowed',
                        fontSize: '18px',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: newMessage.trim() ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
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