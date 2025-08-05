import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { useGetUserStatsQuery, useGetUserDiscussionsQuery, useGetUserMessagesQuery } from '../api/endpoints/userStats';

const MyTopicsPage = () => {
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [selectedTab, setSelectedTab] = useState('overview');
    const [discussionsPage, setDiscussionsPage] = useState(1);
    const [messagesPage, setMessagesPage] = useState(1);

    // RTK Query hooks pour les vraies données
    const { data: statsData, isLoading: statsLoading, error: statsError } = useGetUserStatsQuery();
    const { data: discussionsData, isLoading: discussionsLoading } = useGetUserDiscussionsQuery({
        page: discussionsPage,
        limit: 10
    });
    const { data: messagesData, isLoading: messagesLoading } = useGetUserMessagesQuery({
        page: messagesPage,
        limit: 10
    });

    // Hook pour gérer la responsive
    React.useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Variables responsive
    const isMobile = windowWidth <= 768;

    const MetricCard = ({ title, value, subValue, icon, color, trend }) => (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: windowWidth > 768 ? '24px' : '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: `2px solid ${color}20`,
            position: 'relative',
            overflow: 'hidden'
        }}>
            {trend && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: trend >= 0 ? '#10b981' : '#ef4444',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '4px 8px',
                    fontSize: windowWidth > 768 ? '12px' : '10px',
                    fontWeight: '600'
                }}>
                    {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}%
                </div>
            )}

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: windowWidth > 768 ? '16px' : '12px',
                flexDirection: windowWidth > 480 ? 'row' : 'column',
                textAlign: windowWidth > 480 ? 'left' : 'center'
            }}>
                <div style={{
                    backgroundColor: color,
                    borderRadius: '12px',
                    padding: windowWidth > 768 ? '16px' : '12px',
                    fontSize: windowWidth > 768 ? '32px' : '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: windowWidth > 768 ? '64px' : '48px',
                    minHeight: windowWidth > 768 ? '64px' : '48px'
                }}>
                    {icon}
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{
                        fontSize: windowWidth > 768 ? '14px' : '12px',
                        color: '#6b7280',
                        margin: '0 0 8px 0',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {title}
                    </h3>
                    <div style={{
                        fontSize: windowWidth > 768 ? '32px' : '24px',
                        fontWeight: '700',
                        color: '#374640',
                        margin: '0 0 4px 0'
                    }}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </div>
                    {subValue && (
                        <div style={{
                            fontSize: windowWidth > 768 ? '12px' : '10px',
                            color: '#6b7280'
                        }}>
                            {subValue}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const DataCard = ({ title, children, action }) => (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: windowWidth > 768 ? '24px' : '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            height: 'fit-content'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexDirection: windowWidth > 480 ? 'row' : 'column',
                gap: windowWidth > 480 ? '0' : '10px'
            }}>
                <h3 style={{
                    fontSize: windowWidth > 768 ? '18px' : '16px',
                    fontWeight: '600',
                    color: '#374640',
                    margin: 0,
                    textAlign: windowWidth > 480 ? 'left' : 'center'
                }}>
                    {title}
                </h3>
                {action}
            </div>
            {children}
        </div>
    );

    const TabButton = ({ id, label, icon, isActive, onClick }) => (
        <button
            onClick={() => onClick(id)}
            style={{
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? '#10B981' : 'transparent',
                color: isActive ? 'white' : '#6b7280',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                fontSize: windowWidth > 768 ? '14px' : '12px'
            }}
            onMouseOver={(e) => {
                if (!isActive) {
                    e.target.style.backgroundColor = '#f3f4f6';
                }
            }}
            onMouseOut={(e) => {
                if (!isActive) {
                    e.target.style.backgroundColor = 'transparent';
                }
            }}
        >
            <span>{icon}</span>
            <span>{windowWidth > 480 ? label : ''}</span>
        </button>
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const decodeHtmlEntities = (text) => {
        if (!text) return '';
        const textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    };

    if (statsLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#ECF3F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center', color: '#374640' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                    <p>Chargement de vos statistiques...</p>
                </div>
            </div>
        );
    }

    if (statsError) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#ECF3F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center', color: '#ef4444' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                    <p>Erreur lors du chargement de vos données</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            backgroundColor: '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            marginTop: '10px',
                            cursor: 'pointer'
                        }}
                    >
                        Retour au Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Données réelles de l'API
    const stats = statsData?.overview || {
        total_discussions: 0,
        total_messages: 0,
        total_likes_received: 0,
        avg_messages_per_discussion: 0,
        most_liked_message_likes: 0,
        most_active_discussion_messages: 0
    };

    const topPerformers = statsData?.top_performers || {
        most_liked_message: null,
        most_active_discussion: null
    };

    return (
        <>
            {/* Navbar - RESPONSIVE */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '70px',
                backgroundColor: '#374640',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: windowWidth > 768 ? '0 30px' : '0 15px',
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: windowWidth > 768 ? '20px' : '10px'
                }}>
                    <img
                        src="/image/SunLogo.svg"
                        alt='Atlas Logo'
                        style={{ height: windowWidth > 768 ? '40px' : '32px' }}
                    />
                    <h1 style={{
                        color: 'white',
                        margin: 0,
                        fontSize: windowWidth > 768 ? '20px' : '16px',
                        fontWeight: '600',
                        display: windowWidth > 480 ? 'block' : 'none'
                    }}>
                        Mes Topics & Questions
                    </h1>
                </div>

                <div style={{
                    display: 'flex',
                    gap: windowWidth > 768 ? '15px' : '8px',
                    alignItems: 'center'
                }}>
                    <button
                        onClick={() => navigate('/Dashboard')}
                        style={{
                            color: 'white',
                            background: 'none',
                            border: '1px dashed white',
                            borderRadius: '25px',
                            padding: 'clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px)',
                            fontSize: 'clamp(12px, 2.5vw, 14px)',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#F3CB23';
                            e.target.style.borderColor = '#F3CB23';
                            e.target.style.color = '#374640';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.borderColor = 'white';
                            e.target.style.color = 'white';
                        }}
                    >
                        ✦ Dashboard
                    </button>
                </div>
            </div>

            {/* Contenu principal */}
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#ECF3F0',
                paddingTop: '70px'
            }}>
                {/* Header - RESPONSIVE */}
                <div style={{
                    textAlign: 'center',
                    padding: windowWidth > 768 ? '30px' : '20px 15px',
                    backgroundColor: '#ECF3F0'
                }}>
                    <h1 style={{
                        color: '#374640',
                        margin: '0 0 8px 0',
                        fontSize: windowWidth > 768 ? '32px' : '24px',
                        fontWeight: '600'
                    }}>
                        💬 Mes Topics & Questions
                    </h1>
                    <p style={{
                        color: '#6b7280',
                        margin: '0 0 20px 0',
                        fontSize: windowWidth > 768 ? '16px' : '14px'
                    }}>
                        Gérez vos discussions et suivez vos performances sur Atlas
                    </p>
                    <div style={{
                        fontSize: windowWidth > 768 ? '14px' : '12px',
                        color: '#6b7280'
                    }}>
                        Bienvenue, <strong>{user?.pseudo || 'Voyageur'}</strong> !
                    </div>
                </div>

                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: windowWidth > 768 ? '0 30px 40px 30px' : '0 15px 40px 15px'
                }}>
                    {/* Onglets de navigation */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '8px',
                        marginBottom: '30px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        display: 'flex',
                        gap: '4px',
                        flexDirection: 'row',
                        justifyContent: windowWidth > 768 ? 'flex-start' : 'center'
                    }}>
                        <TabButton
                            id="overview"
                            label="Vue d'ensemble"
                            icon="📊"
                            isActive={selectedTab === 'overview'}
                            onClick={setSelectedTab}
                        />
                        <TabButton
                            id="topics"
                            label="Mes Discussions"
                            icon="💬"
                            isActive={selectedTab === 'topics'}
                            onClick={setSelectedTab}
                        />
                        <TabButton
                            id="messages"
                            label="Mes Messages"
                            icon="📝"
                            isActive={selectedTab === 'messages'}
                            onClick={setSelectedTab}
                        />
                    </div>

                    {/* Contenu selon l'onglet sélectionné */}
                    {selectedTab === 'overview' && (
                        <>
                            {/* Métriques principales */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(auto-fit, minmax(${windowWidth > 768 ? '250px' : '200px'}, 1fr))`,
                                gap: windowWidth > 768 ? '20px' : '15px',
                                marginBottom: '30px'
                            }}>
                                <MetricCard
                                    title="Discussions créées"
                                    value={stats.total_discussions}
                                    subValue="Total de vos sujets"
                                    icon="💬"
                                    color="#10B981"
                                />
                                <MetricCard
                                    title="Messages postés"
                                    value={stats.total_messages}
                                    subValue={`~${stats.avg_messages_per_discussion} par discussion`}
                                    icon="📝"
                                    color="#3B82F6"
                                />
                                <MetricCard
                                    title="Likes reçus"
                                    value={stats.total_likes_received}
                                    subValue="Sur tous vos messages"
                                    icon="❤️"
                                    color="#EF4444"
                                />
                                <MetricCard
                                    title="Moyenne par topic"
                                    value={stats.avg_messages_per_discussion}
                                    subValue="Messages par discussion"
                                    icon="📊"
                                    color="#F59E0B"
                                />
                            </div>

                            {/* Section des top performances */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: windowWidth > 768 ? '1fr 1fr' : '1fr',
                                gap: windowWidth > 768 ? '20px' : '15px'
                            }}>
                                {/* Message le plus liké */}
                                <DataCard title="🏆 Message le plus apprécié">
                                    {topPerformers.most_liked_message ? (
                                        <div style={{
                                            backgroundColor: '#f3f4f6',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            marginTop: '16px'
                                        }}>
                                            <div style={{
                                                fontSize: '14px',
                                                color: '#374640',
                                                marginBottom: '12px',
                                                lineHeight: '1.6'
                                            }}>
                                                "{decodeHtmlEntities(topPerformers.most_liked_message.content)}"
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: '8px'
                                            }}>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    Dans: <strong>{topPerformers.most_liked_message.discussion_title}</strong>
                                                    <br />
                                                    {topPerformers.most_liked_message.country} • {formatDate(topPerformers.most_liked_message.created_at)}
                                                </div>
                                                <div style={{
                                                    backgroundColor: '#EF4444',
                                                    color: 'white',
                                                    padding: '4px 12px',
                                                    borderRadius: '16px',
                                                    fontSize: '14px',
                                                    fontWeight: '600'
                                                }}>
                                                    ❤️ {topPerformers.most_liked_message.likes} likes
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                                            Aucun message liké pour le moment
                                        </p>
                                    )}
                                </DataCard>

                                {/* Discussion la plus active */}
                                <DataCard title="🔥 Discussion la plus active">
                                    {topPerformers.most_active_discussion ? (
                                        <div style={{
                                            backgroundColor: '#f3f4f6',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            marginTop: '16px'
                                        }}>
                                            <h4 style={{
                                                fontSize: '16px',
                                                color: '#374640',
                                                marginBottom: '8px',
                                                fontWeight: '600'
                                            }}>
                                                {topPerformers.most_active_discussion.title}
                                            </h4>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: '8px'
                                            }}>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    📍 {topPerformers.most_active_discussion.country}
                                                </div>
                                                <div style={{
                                                    backgroundColor: '#3B82F6',
                                                    color: 'white',
                                                    padding: '4px 12px',
                                                    borderRadius: '16px',
                                                    fontSize: '14px',
                                                    fontWeight: '600'
                                                }}>
                                                    📝 {topPerformers.most_active_discussion.user_messages} messages
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/topic/${topPerformers.most_active_discussion.id}`)}
                                                style={{
                                                    marginTop: '12px',
                                                    backgroundColor: '#10B981',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '8px 16px',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    width: '100%'
                                                }}
                                            >
                                                Voir la discussion
                                            </button>
                                        </div>
                                    ) : (
                                        <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                                            Aucune discussion active pour le moment
                                        </p>
                                    )}
                                </DataCard>
                            </div>
                        </>
                    )}

                    {selectedTab === 'topics' && (
                        <DataCard
                            title="Mes Discussions"
                            action={
                                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                    {discussionsData?.discussions?.length || 0} discussion(s)
                                </div>
                            }
                        >
                            {discussionsLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                                    Chargement...
                                </div>
                            ) : discussionsData?.discussions?.length > 0 ? (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {discussionsData.discussions.map((discussion) => (
                                            <div
                                                key={discussion.id}
                                                style={{
                                                    backgroundColor: '#f9fafb',
                                                    borderRadius: '8px',
                                                    padding: '16px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    flexWrap: 'wrap',
                                                    gap: '12px'
                                                }}
                                                onClick={() => navigate(`/topic/${discussion.id}`)}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                                                    e.currentTarget.style.transform = 'translateX(4px)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#f9fafb';
                                                    e.currentTarget.style.transform = 'translateX(0)';
                                                }}
                                            >
                                                <div style={{ flex: 1, minWidth: '200px' }}>
                                                    <h4 style={{
                                                        fontSize: '16px',
                                                        fontWeight: '600',
                                                        color: '#374640',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {decodeHtmlEntities(discussion.title)}
                                                    </h4>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: '#6b7280',
                                                        display: 'flex',
                                                        gap: '12px',
                                                        flexWrap: 'wrap'
                                                    }}>
                                                        <span>📍 {discussion.country}</span>
                                                        <span>📅 {formatDate(discussion.created_at)}</span>
                                                        {discussion.last_activity && (
                                                            <span>🕒 Dernière activité: {formatDate(discussion.last_activity)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '8px',
                                                    alignItems: 'center'
                                                }}>
                                                    <div style={{
                                                        backgroundColor: '#e5e7eb',
                                                        padding: '6px 12px',
                                                        borderRadius: '16px',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}>
                                                        📝 {discussion.user_message_count} messages
                                                    </div>
                                                    <div style={{
                                                        backgroundColor: '#fee2e2',
                                                        padding: '6px 12px',
                                                        borderRadius: '16px',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}>
                                                        ❤️ {discussion.likes_received} likes
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {discussionsData?.pagination && (
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            marginTop: '24px'
                                        }}>
                                            <button
                                                onClick={() => setDiscussionsPage(discussionsPage - 1)}
                                                disabled={discussionsPage === 1}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: discussionsPage === 1 ? '#e5e7eb' : '#374640',
                                                    color: discussionsPage === 1 ? '#9ca3af' : 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: discussionsPage === 1 ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                ← Précédent
                                            </button>
                                            <span style={{
                                                padding: '8px 16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: '#6b7280'
                                            }}>
                                                Page {discussionsPage}
                                            </span>
                                            <button
                                                onClick={() => setDiscussionsPage(discussionsPage + 1)}
                                                disabled={discussionsData.discussions.length < 10}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: discussionsData.discussions.length < 10 ? '#e5e7eb' : '#374640',
                                                    color: discussionsData.discussions.length < 10 ? '#9ca3af' : 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: discussionsData.discussions.length < 10 ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                Suivant →
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px',
                                    color: '#6b7280'
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
                                    <p>Vous n'avez pas encore créé de discussion</p>
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        style={{
                                            marginTop: '16px',
                                            backgroundColor: '#10B981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '10px 20px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Explorez les pays
                                    </button>
                                </div>
                            )}
                        </DataCard>
                    )}

                    {selectedTab === 'messages' && (
                        <DataCard
                            title="Mes Messages"
                            action={
                                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                    {messagesData?.messages?.length || 0} message(s)
                                </div>
                            }
                        >
                            {messagesLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                                    Chargement...
                                </div>
                            ) : messagesData?.messages?.length > 0 ? (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {messagesData.messages.map((message) => (
                                            <div
                                                key={message.id}
                                                style={{
                                                    backgroundColor: message.is_original_post ? '#fef3c7' : '#f9fafb',
                                                    borderRadius: '8px',
                                                    padding: '16px',
                                                    border: message.is_original_post ? '2px solid #f59e0b' : 'none'
                                                }}
                                            >
                                                {message.is_original_post && (
                                                    <div style={{
                                                        backgroundColor: '#f59e0b',
                                                        color: 'white',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        display: 'inline-block',
                                                        marginBottom: '8px'
                                                    }}>
                                                        🎯 POST ORIGINAL
                                                    </div>
                                                )}
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: '#374640',
                                                    marginBottom: '8px',
                                                    lineHeight: '1.6'
                                                }}>
                                                    {decodeHtmlEntities(message.content).substring(0, 150)}
                                                    {message.content.length > 150 && '...'}
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    flexWrap: 'wrap',
                                                    gap: '8px'
                                                }}>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: '#6b7280'
                                                    }}>
                                                        <strong>{message.discussion_title}</strong>
                                                        <br />
                                                        📍 {message.country} • 📅 {formatDate(message.created_at)}
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        gap: '8px',
                                                        alignItems: 'center'
                                                    }}>
                                                        <div style={{
                                                            backgroundColor: '#fee2e2',
                                                            padding: '4px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: '500'
                                                        }}>
                                                            ❤️ {message.likes_received}
                                                        </div>
                                                        <button
                                                            onClick={() => navigate(`/topic/${message.discussion_id}`)}
                                                            style={{
                                                                backgroundColor: '#374640',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                padding: '4px 12px',
                                                                fontSize: '12px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Voir →
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {messagesData?.pagination && (
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            marginTop: '24px'
                                        }}>
                                            <button
                                                onClick={() => setMessagesPage(messagesPage - 1)}
                                                disabled={messagesPage === 1}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: messagesPage === 1 ? '#e5e7eb' : '#374640',
                                                    color: messagesPage === 1 ? '#9ca3af' : 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: messagesPage === 1 ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                ← Précédent
                                            </button>
                                            <span style={{
                                                padding: '8px 16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: '#6b7280'
                                            }}>
                                                Page {messagesPage}
                                            </span>
                                            <button
                                                onClick={() => setMessagesPage(messagesPage + 1)}
                                                disabled={messagesData.messages.length < 10}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: messagesData.messages.length < 10 ? '#e5e7eb' : '#374640',
                                                    color: messagesData.messages.length < 10 ? '#9ca3af' : 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: messagesData.messages.length < 10 ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                Suivant →
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px',
                                    color: '#6b7280'
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💭</div>
                                    <p>Vous n'avez pas encore posté de message</p>
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        style={{
                                            marginTop: '16px',
                                            backgroundColor: '#10B981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '10px 20px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Rejoignez une discussion
                                    </button>
                                </div>
                            )}
                        </DataCard>
                    )}
                </div>
            </div>
        </>
    );
};

export default MyTopicsPage;