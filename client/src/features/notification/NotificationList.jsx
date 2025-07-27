import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useGetNotificationsQuery, useMarkAsReadMutation, useGetUsersListQuery } from '../../api/endpoints/notifications';

// Fonction pour décoder les entités HTML
const decodeHtmlEntities = (text) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
};

const NotificationList = ({
    selectedConversation,
    onSelectConversation,
    onNewConversation,
    isMobile = false,
    screenSize = { isMobile: false, isTablet: false, isDesktop: true }
}) => {
    const { data: notificationsData, refetch } = useGetNotificationsQuery({
        page: 1,
        limit: 100
    });

    const { data: usersData } = useGetUsersListQuery();
    const [markAsRead] = useMarkAsReadMutation();

    // Utiliser Redux pour récupérer l'utilisateur connecté
    const currentUser = useSelector(selectUser);
    const currentUserId = currentUser?.id;

    // Cache des utilisateurs
    const [usersCache, setUsersCache] = useState({});

    useEffect(() => {
        if (usersData?.users) {
            const cache = {};
            usersData.users.forEach(user => {
                cache[user.id] = user;
            });
            setUsersCache(cache);
        }
    }, [usersData]);

    // Rafraîchir automatiquement
    useEffect(() => {
        const interval = setInterval(() => {
            refetch();
        }, screenSize.isMobile ? 1000 : 500);
        return () => clearInterval(interval);
    }, [refetch, screenSize.isMobile]);

    // 📱 Logique de conversation nettoyée
    const getConversations = () => {
        if (!notificationsData?.notifications || !currentUserId) {
            return [];
        }

        const conversations = {};

        notificationsData.notifications.forEach((notif) => {
            // 🔍 Essayer d'extraire les données SENDER (nouveaux messages)
            const senderMatch = notif.content_notification.match(/\[SENDER:(\d+)\]\[SENDER_DATA:([A-Za-z0-9+/=]+)\]/);
            let senderId = null;
            let senderData = null;
            let isNewFormat = false;

            if (senderMatch) {
                // ✅ NOUVEAU FORMAT avec données SENDER
                try {
                    senderId = parseInt(senderMatch[1]);
                    senderData = JSON.parse(atob(senderMatch[2]));
                    isNewFormat = true;
                } catch (e) {
                    console.error('Erreur décodage SENDER:', e);
                    return;
                }
            } else {
                // 📱 ANCIEN FORMAT
                isNewFormat = false;
            }

            let otherPersonId = null;
            let isMessageFromMe = false;
            let contactInfo = null;

            if (isNewFormat) {
                // 🆕 NOUVEAU FORMAT : Logique complète
                if (senderId === currentUserId) {
                    // 📤 Message envoyé par moi
                    otherPersonId = notif.user_id;
                    isMessageFromMe = true;
                    contactInfo = usersCache[otherPersonId] || {
                        id: otherPersonId,
                        pseudo: `User_${otherPersonId}`,
                        firstname: '',
                        lastname: '',
                        profile_picture: null
                    };
                } else if (notif.user_id === currentUserId) {
                    // 📥 Message reçu
                    otherPersonId = senderId;
                    isMessageFromMe = false;
                    contactInfo = senderData;
                } else {
                    // 🚫 Ne me concerne pas
                    return;
                }
            } else {
                // 📱 ANCIEN FORMAT : Logique universelle
                if (notif.user_id === currentUserId) {
                    // Message reçu - accepter pour compatibilité
                    otherPersonId = 9; // ID par défaut pour anciens messages
                    isMessageFromMe = false;
                    contactInfo = usersCache[otherPersonId] || {
                        id: otherPersonId,
                        pseudo: `User_${otherPersonId}`,
                        firstname: '',
                        lastname: '',
                        profile_picture: null
                    };
                } else {
                    // Message envoyé
                    otherPersonId = notif.user_id;
                    isMessageFromMe = true;
                    contactInfo = usersCache[otherPersonId] || {
                        id: otherPersonId,
                        pseudo: `User_${otherPersonId}`,
                        firstname: '',
                        lastname: '',
                        profile_picture: null
                    };
                }
            }

            // 🚫 Éviter les conversations avec soi-même
            if (otherPersonId === currentUserId) {
                return;
            }

            // 📋 Créer ou mettre à jour la conversation
            if (!conversations[otherPersonId]) {
                const conversationName = contactInfo
                    ? (`${contactInfo.firstname || ''} ${contactInfo.lastname || ''}`.trim() || contactInfo.pseudo)
                    : `User_${otherPersonId}`;

                const avatar = contactInfo?.profile_picture ?
                    (contactInfo.profile_picture.startsWith('http') ?
                        contactInfo.profile_picture :
                        `http://localhost:8000${contactInfo.profile_picture}`) : null;

                conversations[otherPersonId] = {
                    id: otherPersonId,
                    name: conversationName,
                    pseudo: contactInfo?.pseudo || `user_${otherPersonId}`,
                    avatar: avatar,
                    contactData: contactInfo,
                    messages: [],
                    unreadCount: 0,
                    lastMessage: null,
                    lastMessageTime: null,
                    lastMessageFormatted: null
                };
            }

            // 💬 Ajouter le message à la conversation
            const cleanContent = decodeHtmlEntities(
                notif.content_notification.replace(/\[SENDER:\d+\]\[SENDER_DATA:[A-Za-z0-9+/=]+\]/g, '').trim()
            );

            conversations[otherPersonId].messages.push({
                id: notif.id,
                content: cleanContent,
                isRead: notif.is_read,
                createdAt: notif.created_at,
                createdAtFormatted: notif.created_at_formatted,
                senderId: senderId,
                isFromMe: isMessageFromMe,
                isOldFormat: !isNewFormat
            });

            // 📊 Compter les messages non lus (seulement ceux reçus)
            if (!notif.is_read && !isMessageFromMe) {
                conversations[otherPersonId].unreadCount++;
            }

            // 📱 Mettre à jour le dernier message
            if (!conversations[otherPersonId].lastMessageTime ||
                new Date(notif.created_at) > new Date(conversations[otherPersonId].lastMessageTime)) {

                const maxLength = screenSize.isMobile ? 25 : 45;
                const messagePreview = cleanContent.length > maxLength ?
                    cleanContent.substring(0, maxLength) + '...' : cleanContent;

                conversations[otherPersonId].lastMessage = isMessageFromMe ?
                    `Vous: ${messagePreview}` : messagePreview;
                conversations[otherPersonId].lastMessageTime = notif.created_at;
                conversations[otherPersonId].lastMessageFormatted = notif.created_at_formatted;
            }
        });

        const conversationsList = Object.values(conversations);

        // Trier par dernier message
        return conversationsList.sort((a, b) =>
            new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );
    };

    const handleSelectConversation = async (conversation) => {
        onSelectConversation(conversation);

        // Marquer comme lus uniquement les messages reçus non lus
        const unreadReceivedMessages = conversation.messages.filter(msg => !msg.isRead && !msg.isFromMe);
        for (const message of unreadReceivedMessages) {
            try {
                await markAsRead(message.id).unwrap();
            } catch (error) {
                console.error('❌ Erreur marquage lu:', error);
            }
        }

        if (unreadReceivedMessages.length > 0) {
            setTimeout(() => refetch(), 100);
        }
    };

    const conversations = getConversations();
    const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

    return (
        <div style={{
            width: screenSize.isMobile ? '100%' : (screenSize.isTablet ? '320px' : '380px'),
            backgroundColor: 'white',
            borderRight: screenSize.isMobile ? 'none' : '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }}>
            {/* Header nettoyé - couleur verte */}
            <div style={{
                padding: screenSize.isMobile ? '15px' : '20px',
                borderBottom: '1px solid #e5e7eb',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: screenSize.isMobile ? '8px' : '12px'
                }}>
                    <h2 style={{
                        color: 'white',
                        margin: 0,
                        fontSize: screenSize.isMobile ? '18px' : '20px',
                        fontWeight: '600'
                    }}>
                        💬 {screenSize.isMobile ? 'Messages' : 'Conversations'}
                    </h2>
                    <button
                        onClick={onNewConversation}
                        style={{
                            backgroundColor: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: screenSize.isMobile ? '36px' : '40px',
                            height: screenSize.isMobile ? '36px' : '40px',
                            cursor: 'pointer',
                            fontSize: screenSize.isMobile ? '16px' : '20px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#16a34a';
                            e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = '#22c55e';
                            e.target.style.transform = 'scale(1)';
                        }}
                    >
                        ✏️
                    </button>
                </div>

                {/* Statistiques sans mentions de test */}
                <div style={{
                    fontSize: screenSize.isMobile ? '12px' : '13px',
                    color: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: screenSize.isMobile ? '8px' : '12px',
                    flexWrap: 'wrap'
                }}>
                    <span style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        padding: screenSize.isMobile ? '3px 6px' : '4px 8px',
                        borderRadius: '12px',
                        fontSize: screenSize.isMobile ? '11px' : '12px'
                    }}>
                        {conversations.length} contact{conversations.length > 1 ? 's' : ''}
                    </span>

                    {totalUnread > 0 && (
                        <span style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            borderRadius: '12px',
                            padding: screenSize.isMobile ? '3px 6px' : '4px 8px',
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

            {/* Liste des conversations */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: '#10b981 transparent'
            }}>
                {conversations.length === 0 ? (
                    <div style={{
                        padding: screenSize.isMobile ? '30px 15px' : '40px 20px',
                        textAlign: 'center',
                        color: '#6b7280'
                    }}>
                        <div style={{
                            fontSize: screenSize.isMobile ? '48px' : '64px',
                            marginBottom: screenSize.isMobile ? '12px' : '16px',
                            filter: 'grayscale(0.3)'
                        }}>
                            💬
                        </div>
                        <h3 style={{
                            margin: '0 0 8px 0',
                            color: '#374640',
                            fontWeight: '600',
                            fontSize: screenSize.isMobile ? '16px' : '18px'
                        }}>
                            Aucune conversation
                        </h3>
                        <p style={{
                            margin: '0 0 20px 0',
                            fontSize: screenSize.isMobile ? '13px' : '14px',
                            lineHeight: '1.5'
                        }}>
                            {screenSize.isMobile ?
                                'Commencez à échanger avec d\'autres membres' :
                                'Commencez à échanger avec d\'autres membres d\'Atlas'
                            }
                        </p>
                        <button
                            onClick={onNewConversation}
                            style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                padding: screenSize.isMobile ? '10px 16px' : '12px 20px',
                                cursor: 'pointer',
                                fontSize: screenSize.isMobile ? '13px' : '14px',
                                fontWeight: '600',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = '#059669';
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = '#10b981';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            ✨ {screenSize.isMobile ? 'Nouvelle conversation' : 'Démarrer une conversation'}
                        </button>
                    </div>
                ) : (
                    conversations.map(conversation => (
                        <div
                            key={conversation.id}
                            onClick={() => handleSelectConversation(conversation)}
                            style={{
                                padding: screenSize.isMobile ? '12px 15px' : '16px 20px',
                                borderBottom: '1px solid #f3f4f6',
                                cursor: 'pointer',
                                backgroundColor: selectedConversation?.id === conversation.id ?
                                    'linear-gradient(135deg, #ECF3F0 0%, #d1fae5 100%)' : 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: screenSize.isMobile ? '10px' : '12px',
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
                            {/* Avatar vert uniforme */}
                            <div style={{ position: 'relative' }}>
                                {conversation.avatar ? (
                                    <img
                                        src={conversation.avatar}
                                        alt={conversation.name}
                                        style={{
                                            width: screenSize.isMobile ? '44px' : '52px',
                                            height: screenSize.isMobile ? '44px' : '52px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '2px solid #ECF3F0'
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div style={{
                                    width: screenSize.isMobile ? '44px' : '52px',
                                    height: screenSize.isMobile ? '44px' : '52px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    display: conversation.avatar ? 'none' : 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: screenSize.isMobile ? '16px' : '20px',
                                    color: 'white',
                                    fontWeight: '600',
                                    border: '2px solid #ECF3F0'
                                }}>
                                    {conversation.name.charAt(0).toUpperCase()}
                                </div>

                                {/* Indicateur en ligne - vert uniforme */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '2px',
                                    right: '2px',
                                    width: screenSize.isMobile ? '12px' : '14px',
                                    height: screenSize.isMobile ? '12px' : '14px',
                                    backgroundColor: '#22c55e',
                                    borderRadius: '50%',
                                    border: '3px solid white',
                                    boxShadow: '0 0 6px rgba(34, 197, 94, 0.5)'
                                }} />
                            </div>

                            {/* Contenu conversation - sans mentions */}
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
                                        fontSize: screenSize.isMobile ? '14px' : '15px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: screenSize.isMobile ? '120px' : '150px'
                                    }}>
                                        {conversation.name}
                                    </span>

                                    {conversation.lastMessageFormatted && (
                                        <span style={{
                                            fontSize: '10px',
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
                                        fontSize: screenSize.isMobile ? '12px' : '13px',
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
                                            padding: screenSize.isMobile ? '2px 6px' : '3px 8px',
                                            fontSize: '10px',
                                            fontWeight: '700',
                                            minWidth: screenSize.isMobile ? '16px' : '20px',
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
                                    background: 'linear-gradient(180deg, #22c55e 0%, #10b981 100%)',
                                    borderRadius: '0 3px 3px 0'
                                }} />
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* CSS pour l'animation pulse */}
            <style>
                {`
                    @keyframes pulse {
                        0% {
                            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
                        }
                        70% {
                            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
                        }
                        100% {
                            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default NotificationList;