import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetAnalyticsQuery, useRefreshAnalyticsMutation } from '../api/endpoints/admin/analytics';

const AnalyticsPage = () => {
    const navigate = useNavigate();
    const [selectedPeriod, setSelectedPeriod] = useState('30days');
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    // RTK Query hooks
    const { data: analyticsData, isLoading, error, refetch } = useGetAnalyticsQuery();
    const [refreshAnalytics, { isLoading: isRefreshing }] = useRefreshAnalyticsMutation();

    // Hook pour gérer la responsive
    React.useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Gestionnaire de rafraîchissement
    const handleRefresh = async () => {
        try {
            await refreshAnalytics().unwrap();
            refetch();
        } catch (error) {
            console.error('Erreur lors du rafraîchissement:', error);
        }
    };

    // Variables responsive
    const isMobile = windowWidth <= 768;
    const isSmallMobile = windowWidth <= 480;
    const MetricCard = ({ title, value, subValue, icon, color, growth }) => (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: window.innerWidth > 768 ? '24px' : '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: `2px solid ${color}20`,
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Indicateur de croissance */}
            {growth && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: growth.growth >= 0 ? '#10b981' : '#ef4444',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '4px 8px',
                    fontSize: window.innerWidth > 768 ? '12px' : '10px',
                    fontWeight: '600'
                }}>
                    {growth.growth >= 0 ? '↗' : '↘'} {Math.abs(growth.growth_percentage)}%
                </div>
            )}

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: window.innerWidth > 768 ? '16px' : '12px',
                flexDirection: window.innerWidth > 480 ? 'row' : 'column',
                textAlign: window.innerWidth > 480 ? 'left' : 'center'
            }}>
                <div style={{
                    backgroundColor: color,
                    borderRadius: '12px',
                    padding: window.innerWidth > 768 ? '16px' : '12px',
                    fontSize: window.innerWidth > 768 ? '32px' : '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: window.innerWidth > 768 ? '64px' : '48px',
                    minHeight: window.innerWidth > 768 ? '64px' : '48px'
                }}>
                    {icon}
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{
                        fontSize: window.innerWidth > 768 ? '14px' : '12px',
                        color: '#6b7280',
                        margin: '0 0 8px 0',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {title}
                    </h3>
                    <div style={{
                        fontSize: window.innerWidth > 768 ? '32px' : '24px',
                        fontWeight: '700',
                        color: '#374640',
                        margin: '0 0 4px 0'
                    }}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </div>
                    {subValue && (
                        <div style={{
                            fontSize: window.innerWidth > 768 ? '12px' : '10px',
                            color: '#6b7280'
                        }}>
                            {subValue}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Composant pour les graphiques/listes - RESPONSIVE
    const DataCard = ({ title, children, action }) => (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: window.innerWidth > 768 ? '24px' : '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            height: 'fit-content'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexDirection: window.innerWidth > 480 ? 'row' : 'column',
                gap: window.innerWidth > 480 ? '0' : '10px'
            }}>
                <h3 style={{
                    fontSize: window.innerWidth > 768 ? '18px' : '16px',
                    fontWeight: '600',
                    color: '#374640',
                    margin: 0,
                    textAlign: window.innerWidth > 480 ? 'left' : 'center'
                }}>
                    {title}
                </h3>
                {action}
            </div>
            {children}
        </div>
    );

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#ECF3F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center', color: '#374640' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                    <p>Chargement des analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
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
                    <p>Erreur lors du chargement des analytics</p>
                    <button
                        onClick={handleRefresh}
                        style={{
                            backgroundColor: '#F3CB23',
                            color: '#374640',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            marginTop: '10px',
                            cursor: 'pointer'
                        }}
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    const { general, countries, discussions, users, growth, top_performers, detailed_analytics } = analyticsData?.data || {};

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
                padding: window.innerWidth > 768 ? '0 30px' : '0 15px',
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: window.innerWidth > 768 ? '20px' : '10px'
                }}>
                    <img
                        src="/image/SunLogo.svg"
                        alt='Atlas Logo'
                        style={{ height: window.innerWidth > 768 ? '40px' : '32px' }}
                    />
                    <h1 style={{
                        color: 'white',
                        margin: 0,
                        fontSize: window.innerWidth > 768 ? '20px' : '16px',
                        fontWeight: '600',
                        display: window.innerWidth > 480 ? 'block' : 'none'
                    }}>
                        Atlas - Analytics
                    </h1>
                </div>

                <div style={{
                    display: 'flex',
                    gap: window.innerWidth > 768 ? '15px' : '8px',
                    flexDirection: window.innerWidth > 480 ? 'row' : 'column',
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
                    padding: window.innerWidth > 768 ? '30px' : '20px 15px',
                    backgroundColor: '#ECF3F0'
                }}>
                    <h1 style={{
                        color: '#374640',
                        margin: '0 0 8px 0',
                        fontSize: window.innerWidth > 768 ? '32px' : '24px',
                        fontWeight: '600'
                    }}>
                        📊 Analytics & Performance
                    </h1>
                    <p style={{
                        color: '#6b7280',
                        margin: '0 0 20px 0',
                        fontSize: window.innerWidth > 768 ? '16px' : '14px'
                    }}>
                        Vue d'ensemble des performances et statistiques de la plateforme Atlas
                    </p>
                    <div style={{
                        fontSize: window.innerWidth > 768 ? '14px' : '12px',
                        color: '#6b7280'
                    }}>
                        Dernière mise à jour : {analyticsData?.data?.last_updated || 'N/A'}
                    </div>
                </div>

                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: window.innerWidth > 768 ? '0 30px 40px 30px' : '0 15px 40px 15px'
                }}>
                    {/* Métriques principales - RESPONSIVE */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        <MetricCard
                            title="Utilisateurs Totaux"
                            value={general?.total_users || 0}
                            subValue={`${general?.verification_rate || 0}% vérifiés`}
                            icon="👥"
                            color="#3b82f6"
                            growth={growth?.users}
                        />
                        <MetricCard
                            title="Pays Disponibles"
                            value={general?.total_countries || 0}
                            subValue={`${countries?.average_discussions_per_country || 0} disc./pays`}
                            icon="🌍"
                            color="#10b981"
                            growth={growth?.countries}
                        />
                        <MetricCard
                            title="Discussions"
                            value={general?.total_discussions || 0}
                            subValue={`${discussions?.average_messages_per_discussion || 0} msg/disc`}
                            icon="💬"
                            color="#8b5cf6"
                            growth={growth?.discussions}
                        />
                        <MetricCard
                            title="Messages"
                            value={general?.total_messages || 0}
                            subValue={`Engagement: ${general?.engagement_rate || 0}`}
                            icon="📝"
                            color="#f59e0b"
                            growth={growth?.messages}
                        />
                    </div>

                    {/* Métriques secondaires - RESPONSIVE */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '15px',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            padding: '16px',
                            textAlign: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>👁️</div>
                            <div style={{ fontSize: '20px', fontWeight: '600', color: '#374640' }}>
                                {(general?.total_views || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Vues Totales</div>
                        </div>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            padding: '16px',
                            textAlign: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>❤️</div>
                            <div style={{ fontSize: '20px', fontWeight: '600', color: '#374640' }}>
                                {(general?.total_likes || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Likes Totaux</div>
                        </div>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            padding: '16px',
                            textAlign: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
                            <div style={{ fontSize: '20px', fontWeight: '600', color: '#374640' }}>
                                {(general?.total_content_sections || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Sections de Contenu</div>
                        </div>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            padding: '16px',
                            textAlign: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚫</div>
                            <div style={{ fontSize: '20px', fontWeight: '600', color: '#ef4444' }}>
                                {(general?.active_bans || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Bannissements Actifs</div>
                        </div>
                    </div>

                    {/* Grille principale - RESPONSIVE */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        {/* Top Pays */}
                        <DataCard title="🏆 Top Pays par Engagement">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {countries?.countries?.slice(0, 5).map((country, index) => (
                                    <div key={country.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        border: index === 0 ? '2px solid #F3CB23' : '1px solid #e5e7eb'
                                    }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            backgroundColor: '#e5e7eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {country.image ? (
                                                <img src={country.image} alt={country.name} style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }} />
                                            ) : (
                                                <span style={{ fontSize: '20px' }}>🌍</span>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', color: '#374640' }}>
                                                {country.name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                {country.discussions} discussions • {country.engagement_score} engagement
                                            </div>
                                        </div>
                                        {index === 0 && (
                                            <div style={{
                                                backgroundColor: '#F3CB23',
                                                color: '#374640',
                                                borderRadius: '12px',
                                                padding: '4px 8px',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                #1
                                            </div>
                                        )}
                                    </div>
                                )) || []}
                            </div>
                        </DataCard>

                        {/* Utilisateurs les plus actifs */}
                        <DataCard title="🔥 Utilisateurs les Plus Actifs">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {users?.most_active_users?.slice(0, 5).map((user, index) => (
                                    <div key={user.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        border: index === 0 ? '2px solid #F3CB23' : '1px solid #e5e7eb'
                                    }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            overflow: 'hidden',
                                            backgroundColor: '#e5e7eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {user.profile_picture ? (
                                                <img src={user.profile_picture} alt={user.pseudo} style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }} />
                                            ) : (
                                                <span style={{ fontSize: '20px' }}>👤</span>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', color: '#374640' }}>
                                                {user.pseudo}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                {user.message_count} messages
                                            </div>
                                        </div>
                                        {index === 0 && (
                                            <div style={{
                                                backgroundColor: '#F3CB23',
                                                color: '#374640',
                                                borderRadius: '12px',
                                                padding: '4px 8px',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                MVP
                                            </div>
                                        )}
                                    </div>
                                )) || []}
                            </div>
                        </DataCard>
                    </div>

                    {/* Discussions et Répartition des rôles - RESPONSIVE */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        {/* Discussions les plus actives */}
                        <DataCard title="💬 Discussions les Plus Actives">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {discussions?.most_active_discussions?.slice(0, 6).map((discussion, index) => (
                                    <div key={discussion.id} style={{
                                        padding: '12px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        borderLeft: `4px solid ${index === 0 ? '#F3CB23' : '#e5e7eb'}`
                                    }}>
                                        <div style={{ fontWeight: '600', color: '#374640', marginBottom: '4px' }}>
                                            {discussion.title}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                            {discussion.country}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#8b5cf6' }}>
                                            {discussion.messages} messages • {discussion.views} vues
                                        </div>
                                    </div>
                                )) || []}
                            </div>
                        </DataCard>

                        {/* Répartition des rôles */}
                        <DataCard title="👑 Répartition des Rôles">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {Object.entries(users?.role_distribution || {}).map(([role, count]) => {
                                    const roleInfo = {
                                        'ROLE_ADMIN': { label: 'Administrateurs', icon: '👑', color: '#ef4444' },
                                        'ROLE_MODERATOR': { label: 'Modérateurs', icon: '🛡️', color: '#8b5cf6' },
                                        'ROLE_TRAVELER': { label: 'Voyageurs', icon: '✈️', color: '#10b981' },
                                        'ROLE_USER': { label: 'Utilisateurs', icon: '👤', color: '#6b7280' }
                                    };
                                    const info = roleInfo[role] || { label: role, icon: '❓', color: '#6b7280' };
                                    const percentage = general?.total_users > 0 ? ((count / general.total_users) * 100).toFixed(1) : 0;

                                    return (
                                        <div key={role} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{
                                                fontSize: '24px',
                                                width: '32px',
                                                textAlign: 'center'
                                            }}>
                                                {info.icon}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', color: '#374640' }}>
                                                    {info.label}
                                                </div>
                                                <div style={{
                                                    height: '4px',
                                                    backgroundColor: '#e5e7eb',
                                                    borderRadius: '2px',
                                                    overflow: 'hidden',
                                                    marginTop: '4px'
                                                }}>
                                                    <div style={{
                                                        height: '100%',
                                                        backgroundColor: info.color,
                                                        width: `${percentage}%`,
                                                        transition: 'width 0.3s ease'
                                                    }} />
                                                </div>
                                            </div>
                                            <div style={{
                                                textAlign: 'right',
                                                minWidth: '60px'
                                            }}>
                                                <div style={{ fontWeight: '600', color: '#374640' }}>
                                                    {count}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    {percentage}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </DataCard>
                    </div>

                    {/* Insights et recommandations - RESPONSIVE */}
                    <DataCard title="💡 Insights & Recommandations">
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '16px'
                        }}>
                            {/* Insight 1: Taux de vérification */}
                            <div style={{
                                padding: '16px',
                                backgroundColor: general?.verification_rate < 80 ? '#fef3c7' : '#d1fae5',
                                borderRadius: '8px',
                                borderLeft: `4px solid ${general?.verification_rate < 80 ? '#f59e0b' : '#10b981'}`
                            }}>
                                <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                                    📧 Taux de Vérification: {general?.verification_rate || 0}%
                                </div>
                                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                    {general?.verification_rate < 80
                                        ? "⚠️ Améliorer le processus de vérification email pour augmenter l'engagement"
                                        : "✅ Excellent taux de vérification, continuez ainsi!"
                                    }
                                </div>
                            </div>

                            {/* Insight 2: Engagement */}
                            <div style={{
                                padding: '16px',
                                backgroundColor: general?.engagement_rate < 2 ? '#fef3c7' : '#d1fae5',
                                borderRadius: '8px',
                                borderLeft: `4px solid ${general?.engagement_rate < 2 ? '#f59e0b' : '#10b981'}`
                            }}>
                                <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                                    🔥 Engagement: {general?.engagement_rate || 0}
                                </div>
                                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                    {general?.engagement_rate < 2
                                        ? "📈 Encourager plus d'interactions avec des événements ou défis"
                                        : "🎉 Excellent niveau d'engagement utilisateur!"
                                    }
                                </div>
                            </div>

                            {/* Insight 3: Contenu */}
                            <div style={{
                                padding: '16px',
                                backgroundColor: countries?.average_content_per_country < 5 ? '#fef3c7' : '#d1fae5',
                                borderRadius: '8px',
                                borderLeft: `4px solid ${countries?.average_content_per_country < 5 ? '#f59e0b' : '#10b981'}`
                            }}>
                                <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                                    📄 Contenu: {countries?.average_content_per_country || 0} sect./pays
                                </div>
                                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                    {countries?.average_content_per_country < 5
                                        ? "📝 Ajouter plus de contenu pour enrichir l'expérience utilisateur"
                                        : "📚 Bonne quantité de contenu par pays!"
                                    }
                                </div>
                            </div>
                        </div>
                    </DataCard>
                </div>
            </div>
        </>
    );
};

export default AnalyticsPage;