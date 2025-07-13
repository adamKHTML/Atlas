import React, { useEffect } from 'react';
import { useGetNotificationsQuery, useMarkAsReadMutation } from '../../api/endpoints/notifications';

const NotificationList = ({ selectedConversation, onSelectConversation, onNewConversation }) => {
    const { data: notificationsData, refetch } = useGetNotificationsQuery({
        page: 1,
        limit: 100
    });

    const [markAsRead] = useMarkAsReadMutation();

    // 🔄 Rafraîchir automatiquement toutes les 500ms pour l'instantané
    useEffect(() => {
        const interval = setInterval(() => {
            refetch();
        }, 500); // Plus rapide pour du vraiment instantané
        return () => clearInterval(interval);
    }, [refetch]);

    // 📊 Regrouper les notifications par expéditeur/conversation
    const getConversations = () => {
        if (!notificationsData?.notifications) return [];

        const conversations = {};

        notificationsData.notifications.forEach(notif => {
            // Extraire les données de l'expéditeur
            const senderMatch = notif.content_notification.match(/\[SENDER:(\d+)\]\[SENDER_DATA:([A-Za-z0-9+/=]+)\]/);
            let senderId = null;
            let senderData = null;

            if (senderMatch) {
                try {
                    senderId = parseInt(senderMatch[1]);
                    senderData = JSON.parse(atob(senderMatch[2]));
                } catch (e) {
                    console.error('Erreur décodage:', e);
                }
            }

            // Si pas d'expéditeur identifié, ignorer
            if (!senderId || !senderData) {
                return;
            }

            const conversationId = senderId;
            const conversationName = `${senderData.firstname || ''} ${senderData.lastname || ''}`.trim() || senderData.pseudo;
            const avatar = senderData.profile_picture ? `http://localhost:8000${senderData.profile_picture}` : null;

            if (!conversations[conversationId]) {
                conversations[conversationId] = {
                    id: conversationId,
                    name: conversationName,
                    pseudo: senderData.pseudo,
                    avatar: avatar,
                    senderData: senderData,
                    messages: [],
                    unreadCount: 0,
                    lastMessage: null,
                    lastMessageTime: null
                };
            }

            // Nettoyer le contenu du message
            const cleanContent = notif.content_notification.replace(/\[SENDER:\d+\]\[SENDER_DATA:[A-Za-z0-9+/=]+\]/g, '').trim();

            conversations[conversationId].messages.push({
                id: notif.id,
                content: cleanContent,
                isRead: notif.is_read,
                createdAt: notif.created_at,
                createdAtFormatted: notif.created_at_formatted,
                senderId: senderId,
                isFromMe: false // Messages reçus
            });

            if (!notif.is_read) {
                conversations[conversationId].unreadCount++;
            }

            // Dernière message
            if (!conversations[conversationId].lastMessageTime ||
                new Date(notif.created_at) > new Date(conversations[conversationId].lastMessageTime)) {
                conversations[conversationId].lastMessage = cleanContent.length > 45 ?
                    cleanContent.substring(0, 45) + '...' : cleanContent;
                conversations[conversationId].lastMessageTime = notif.created_at;
                conversations[conversationId].lastMessageFormatted = notif.created_at_formatted;
            }
        });

        // Trier par dernière activité
        return Object.values(conversations).sort((a, b) =>
            new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );
    };

    const handleSelectConversation = async (conversation) => {
        onSelectConversation(conversation);

        // Marquer comme lu automatiquement INSTANTANÉMENT
        const unreadMessages = conversation.messages.filter(msg => !msg.isRead);
        for (const message of unreadMessages) {
            try {
                await markAsRead(message.id).unwrap();
            } catch (error) {
                console.error('Erreur marquage lu:', error);
            }
        }

        if (unreadMessages.length > 0) {
            setTimeout(() => refetch(), 100); // Refresh rapide
        }
    };

    const conversations = getConversations();
    const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

    return (
        <div style={{
            width: '380px',
            backgroundColor: 'white',
            borderRight: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header avec nouveau style */}
            <div style={{
                padding: '20px',
                borderBottom: '1px solid #e5e7eb',
                background: 'linear-gradient(135deg, #374640 0%, #2d3a32 100%)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                }}>
                    <h2 style={{
                        color: 'white',
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: '600'
                    }}>
                        💬 Conversations
                    </h2>
                    <button
                        onClick={onNewConversation}
                        style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            cursor: 'pointer',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#059669';
                            e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = '#10b981';
                            e.target.style.transform = 'scale(1)';
                        }}
                    >
                        ✏️
                    </button>
                </div>

                {/* Statistiques avec badges modernes */}
                <div style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                    }}>
                        {conversations.length} contact{conversations.length > 1 ? 's' : ''}
                    </span>

                    {totalUnread > 0 && (
                        <span style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            borderRadius: '12px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                            animation: 'pulse 2s infinite'
                        }}>
                            {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Liste des conversations avec scroll personnalisé */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: '#374640 transparent'
            }}>
                {conversations.length === 0 ? (
                    <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: '#6b7280'
                    }}>
                        <div style={{
                            fontSize: '64px',
                            marginBottom: '16px',
                            filter: 'grayscale(0.3)'
                        }}>
                            💬
                        </div>
                        <h3 style={{
                            margin: '0 0 8px 0',
                            color: '#374640',
                            fontWeight: '600'
                        }}>
                            Aucune conversation
                        </h3>
                        <p style={{
                            margin: '0 0 20px 0',
                            fontSize: '14px',
                            lineHeight: '1.5'
                        }}>
                            Commencez à échanger avec d'autres membres d'Atlas
                        </p>
                        <button
                            onClick={onNewConversation}
                            style={{
                                backgroundColor: '#374640',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '12px 20px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 8px rgba(55, 70, 64, 0.2)'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = '#2d3a32';
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = '#374640';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            ✨ Démarrer une conversation
                        </button>
                    </div>
                ) : (
                    conversations.map(conversation => (
                        <div
                            key={conversation.id}
                            onClick={() => handleSelectConversation(conversation)}
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #f3f4f6',
                                cursor: 'pointer',
                                backgroundColor: selectedConversation?.id === conversation.id ?
                                    'linear-gradient(135deg, #ECF3F0 0%, #d1fae5 100%)' : 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'all 0.2s ease',
                                position: 'relative'
                            }}
                            onMouseOver={(e) => {
                                if (selectedConversation?.id !== conversation.id) {
                                    e.currentTarget.style.backgroundColor = '#f8fafc';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (selectedConversation?.id !== conversation.id) {
                                    e.currentTarget.style.backgroundColor = 'white';
                                }
                            }}
                        >
                            {/* Avatar avec indicateur moderne */}
                            <div style={{ position: 'relative' }}>
                                {conversation.avatar ? (
                                    <img
                                        src={conversation.avatar}
                                        alt={conversation.name}
                                        style={{
                                            width: '52px',
                                            height: '52px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '2px solid #ECF3F0'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '52px',
                                        height: '52px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #374640 0%, #10b981 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                        color: 'white',
                                        fontWeight: '600',
                                        border: '2px solid #ECF3F0'
                                    }}>
                                        {conversation.name.charAt(0).toUpperCase()}
                                    </div>
                                )}

                                {/* Indicateur en ligne avec animation */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '2px',
                                    right: '2px',
                                    width: '14px',
                                    height: '14px',
                                    backgroundColor: '#10b981',
                                    borderRadius: '50%',
                                    border: '3px solid white',
                                    boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)'
                                }} />
                            </div>

                            {/* Contenu conversation avec typography moderne */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '6px'
                                }}>
                                    <span style={{
                                        fontWeight: conversation.unreadCount > 0 ? '600' : '500',
                                        color: '#374640',
                                        fontSize: '15px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '150px'
                                    }}>
                                        {conversation.name}
                                    </span>

                                    {conversation.lastMessageFormatted && (
                                        <span style={{
                                            fontSize: '11px',
                                            color: '#9ca3af',
                                            fontWeight: '500'
                                        }}>
                                            {conversation.lastMessageFormatted}
                                        </span>
                                    )}
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '13px',
                                        color: conversation.unreadCount > 0 ? '#374640' : '#6b7280',
                                        fontWeight: conversation.unreadCount > 0 ? '500' : '400',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1,
                                        lineHeight: '1.4'
                                    }}>
                                        {conversation.lastMessage || 'Aucun message'}
                                    </p>

                                    {conversation.unreadCount > 0 && (
                                        <span style={{
                                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                            color: 'white',
                                            borderRadius: '12px',
                                            padding: '3px 8px',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            minWidth: '20px',
                                            textAlign: 'center',
                                            marginLeft: '8px',
                                            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                                        }}>
                                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Indicateur de conversation active */}
                            {selectedConversation?.id === conversation.id && (
                                <div style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: '4px',
                                    background: 'linear-gradient(180deg, #10b981 0%, #374640 100%)',
                                    borderRadius: '0 3px 3px 0'
                                }} />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationList;