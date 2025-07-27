// src/pages/Dashboard.jsx - Version avec statistiques améliorées
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAdmin, selectIsAuthenticated } from '../store/slices/authSlice';
import { useLogoutMutation } from '../api/endpoints/auth';
import { useGetCountriesForDashboardQuery } from '../api/endpoints/countries';
import { useGetUnreadCountQuery } from '../api/endpoints/notifications';
// Plus besoin de l'import pour l'instant
import SearchComponent from '../components/SearchComponents';

const Dashboard = () => {
    const user = useSelector(selectUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const isAdmin = useSelector(selectIsAdmin);
    const navigate = useNavigate();
    const [logout] = useLogoutMutation();

    // 🌍 Récupérer la liste des pays avec images
    const {
        data: countriesData,
        isLoading: countriesLoading,
        error: countriesError
    } = useGetCountriesForDashboardQuery();

    // 📧 Récupérer le nombre de notifications non lues
    const { data: unreadData } = useGetUnreadCountQuery();
    const unreadCount = unreadData?.unread_count || 0;

    // 📊 Récupérer les statistiques depuis Redux (rapide) + optionnel Analytics (complet)
    const userStats = user?.stats || {
        topics_created: 0,
        discussions_created: 0,
        messages_sent: 0,
        countries_visited: 0
    };

    // 📈 Pour les admins : récupérer les analytics complètes (optionnel - désactivé temporairement)
    // const { data: analyticsData } = isAdmin ? useGetGlobalStatsQuery() : { data: null };
    const analyticsData = null; // Temporaire

    // Vérifier si l'utilisateur est modérateur
    const isModerator = user?.roles?.includes('ROLE_MODERATOR');

    // Actions selon le rôle (même structure que précédemment)
    const adminActions = [
        {
            title: "Créer un pays",
            description: "Ajouter un nouveau pays à l'atlas",
            link: "/country-form",
            icon: "🌍",
            color: "#10B981"
        },
        {
            title: "Mes Notifications",
            description: "Gérer mes messages privés et notifications",
            link: "/notifications",
            icon: "📧",
            color: "#3B82F6",
            badge: unreadCount > 0 ? unreadCount : null
        },
        {
            title: "Gestion Utilisateurs",
            description: "Administrer comptes, modération et bannissements",
            link: "/user-management",
            icon: "👥",
            color: "#8B5CF6"
        },
        {
            title: "Analytics",
            description: "Analyser les données et statistiques",
            link: "/analytics",
            icon: "📊",
            color: "#F59E0B"
        }
    ];

    const moderatorActions = [
        {
            title: "Mes Notifications",
            description: "Gérer mes messages privés et notifications",
            link: "/notifications",
            icon: "📧",
            color: "#3B82F6",
            badge: unreadCount > 0 ? unreadCount : null
        },
        {
            title: "Mon profil",
            description: "Gérer mes informations personnelles",
            link: "/profile",
            icon: "👤",
            color: "#8B5CF6"
        },
        {
            title: "Gestion Utilisateurs",
            description: "Modération des comptes utilisateurs",
            link: "/admin/user-management",
            icon: "👥",
            color: "#10B981"
        },
        {
            title: "Pays à découvrir",
            description: "Explorer les destinations disponibles",
            link: "/countries",
            icon: "🌍",
            color: "#F59E0B"
        }
    ];

    const travelerActions = [
        {
            title: "Mes Notifications",
            description: "Voir mes messages privés et notifications",
            link: "/notifications",
            icon: "📧",
            color: "#3B82F6",
            badge: unreadCount > 0 ? unreadCount : null
        },
        {
            title: "Mes Topics/Questions",
            description: "Voir et gérer mes discussions",
            link: "/my-topics",
            icon: "💬",
            color: "#10B981"
        },
        {
            title: "Pays à découvrir",
            description: "Explorer les destinations disponibles",
            link: "/countries",
            icon: "🌍",
            color: "#F59E0B"
        },
        {
            title: "Mon profil",
            description: "Gérer mes informations personnelles",
            link: "/profile",
            icon: "👤",
            color: "#8B5CF6"
        }
    ];

    // Vérification de l'authentification
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const handleLogout = async () => {
        try {
            await logout().unwrap();
            navigate('/login');
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    };

    const handleActionClick = (link) => {
        navigate(link);
    };

    const handleCountryClick = (countryId) => {
        navigate(`/country/${countryId}`);
    };

    // Composant CountryCard (même que précédemment)
    const CountryCard = ({ country }) => {
        const getCountryImage = () => {
            if (country.country_image) {
                return `http://localhost:8000${country.country_image}`;
            }
            return country.flag_url;
        };

        return (
            <div
                onClick={() => handleCountryClick(country.id)}
                style={{
                    position: 'relative',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#4a5c52',
                    height: '280px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.25)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                }}
            >
                {/* Nom du pays en haut avec étoile */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{
                        color: '#F3CB23',
                        fontSize: '16px'
                    }}>✦</span>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '400',
                        color: 'white',
                        margin: 0,
                        lineHeight: '1.2',
                        fontFamily: 'serif',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                        {country.name}
                    </h3>
                </div>

                {/* Image principale */}
                <div style={{
                    position: 'absolute',
                    top: '55px',
                    left: '20px',
                    right: '20px',
                    bottom: '20px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                    <img
                        src={getCountryImage()}
                        alt={country.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                        onError={(e) => {
                            console.log('❌ Erreur image pour', country.name);
                            e.target.src = country.flag_url;
                        }}
                    />
                </div>

                {/* Badge drapeau */}
                <div style={{
                    position: 'absolute',
                    top: '70px',
                    right: '35px',
                    width: '28px',
                    height: '20px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    zIndex: 10
                }}>
                    <img
                        src={country.flag_url}
                        alt={`Drapeau ${country.name}`}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                </div>

                {/* Badge de contenu */}
                {country.content_count > 0 && (
                    <div style={{
                        position: 'absolute',
                        bottom: '35px',
                        right: '35px',
                        backgroundColor: '#F3CB23',
                        color: '#374640',
                        borderRadius: '12px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        zIndex: 10
                    }}>
                        {country.content_count}
                    </div>
                )}
            </div>
        );
    };

    // Fonction pour les boutons d'action
    const renderActionButton = (action, index) => (
        <button
            key={index}
            onClick={() => handleActionClick(action.link)}
            style={{
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                position: 'relative'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
        >
            {action.badge && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: '#EF4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                }}>
                    {action.badge > 9 ? '9+' : action.badge}
                </div>
            )}

            <div style={{
                width: '44px',
                height: '44px',
                backgroundColor: action.color,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                marginBottom: '14px'
            }}>
                {action.icon}
            </div>
            <h4 style={{
                fontSize: '15px',
                fontWeight: 'bold',
                color: '#2E3830',
                margin: '0 0 6px 0'
            }}>
                {action.title}
            </h4>
            <p style={{
                fontSize: '13px',
                color: '#666',
                margin: '0'
            }}>
                {action.description}
            </p>
        </button>
    );

    if (!user) {
        return <div>Chargement...</div>;
    }

    // Déterminer les actions selon le rôle
    const getActionsForRole = () => {
        if (isAdmin) return adminActions;
        if (isModerator) return moderatorActions;
        return travelerActions;
    };

    const actions = getActionsForRole();

    return (
        <>
            {/* Navbar */}
            <div className="dashboard-navbar">
                <img
                    src="/image/SunLogo.svg"
                    alt='Solar Atlas Logo'
                    className="logo"
                />
                <div style={{ display: 'flex', gap: '20px' }}>
                    <button
                        onClick={handleLogout}
                        className="nav-button"
                        style={{
                            color: 'white',
                            borderColor: 'white',
                            background: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        DECONNEXION
                    </button>
                </div>
            </div>

            {/* Header avec titre de bienvenue */}
            <section className="dashboard-header">
                <div className="header-rounded">
                    <div className="dashboard-background">
                        <img
                            src="/image/DashboardBack.svg"
                            alt='Mountain landscape'
                            className="dashboard-img"
                        />
                    </div>
                    <div className="text-welcome">
                        <h1 style={{ fontStyle: 'Italic', fontSize: '58px', marginBottom: '20px', color: '#F3CB23' }}>
                            {isAdmin ? 'BIENVENUE ADMIN' : isModerator ? 'BIENVENUE MODÉRATEUR' : 'BIENVENUE SUR VOTRE ESPACE'}
                        </h1>
                        <h2 style={{ fontFamily: 'Goblin One, sans-serif', fontSize: '12px', fontWeight: '400', color: '#F3CB23' }}>
                            {user.firstname} {user.lastname}
                        </h2>
                    </div>
                </div>
            </section>

            {/* Contenu principal */}
            <div className="content">
                <div className="featured-container" style={{ backgroundColor: 'white', padding: '30px' }}>

                    <div className="title-section" style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h2 className="main-title">
                            {isAdmin ? 'PANNEAU D\'ADMINISTRATION' :
                                isModerator ? 'TABLEAU DE BORD MODÉRATEUR' :
                                    'TABLEAU DE BORD'}
                        </h2>
                        <div className="title-divider" style={{ width: '60px', margin: '20px auto' }}></div>
                    </div>

                    {/* Statistiques améliorées */}
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '50px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F3CB23' }}>
                                {countriesData?.countries?.length || 0}
                            </div>
                            <div>Pays {isAdmin ? 'créés' : 'disponibles'}</div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                {isAdmin ? 'Pays disponibles' : 'À découvrir'}
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F3CB23' }}>
                                {isAdmin ?
                                    (analyticsData?.general?.total_content_sections ||
                                        countriesData?.countries?.reduce((total, country) =>
                                            total + (country.content_count || 0), 0) || 0) :
                                    unreadCount
                                }
                            </div>
                            <div>{isAdmin ? 'Contenus publiés' : 'Notifications'}</div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                {isAdmin ? 'Sections de contenu' : 'Messages non lus'}
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F3CB23' }}>
                                {isAdmin ?
                                    unreadCount :
                                    isModerator ?
                                        (userStats.discussions_created || 0) :
                                        (userStats.topics_created || 0)
                                }
                            </div>
                            <div>
                                {isAdmin ?
                                    'Notifications' :
                                    isModerator ?
                                        'Discussions créées' :
                                        'Topics créés'
                                }
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                {isAdmin ?
                                    'Messages non lus' :
                                    isModerator ?
                                        'Total discussions' :
                                        'Mes contributions'
                                }
                            </div>
                        </div>
                    </div>

                    {/* Actions selon le rôle */}
                    <div className="title-section" style={{ marginBottom: '30px' }}>
                        <h2 className="main-title">
                            {isAdmin ? 'ACTIONS ADMINISTRATEUR' :
                                isModerator ? 'MES ACTIONS MODÉRATEUR' :
                                    'MES ACTIONS'}
                        </h2>
                        <div className="title-divider"></div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '16px',
                        marginBottom: '50px'
                    }}>
                        {actions.map((action, index) => renderActionButton(action, index))}
                    </div>

                    {/* Section Pays */}
                    <div className="title-section">
                        <h2 className="main-title">
                            {isAdmin ? 'PAYS DISPONIBLES' :
                                isModerator ? 'PAYS À MODÉRER' :
                                    'PAYS À DÉCOUVRIR'}
                        </h2>
                        <div className="title-divider"></div>
                    </div>

                    {/* Section recherche rapide juste avant les pays */}
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '30px',
                        border: '1px solid #e9ecef'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{ flex: 1, minWidth: '300px' }}>
                                <h3 style={{
                                    margin: '0 0 8px 0',
                                    color: '#374640',
                                    fontSize: '18px',
                                    fontWeight: '600'
                                }}>
                                    🔍 Recherche rapide
                                </h3>
                                <p style={{
                                    margin: '0 0 12px 0',
                                    color: '#6b7280',
                                    fontSize: '14px'
                                }}>
                                    Trouvez rapidement un pays ou explorez toutes nos destinations
                                </p>
                                <SearchComponent
                                    placeholder="Rechercher un pays..."
                                    variant="compact"
                                    maxResults={8}
                                />
                            </div>
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                flexWrap: 'wrap'
                            }}>
                                <button
                                    onClick={() => navigate('/countries')}
                                    style={{
                                        padding: '10px 16px',
                                        backgroundColor: '#374640',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#2d3a33';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#374640';
                                        e.target.style.transform = 'translateY(0)';
                                    }}
                                >
                                    Voir tous les pays
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => navigate('/country-form')}
                                        style={{
                                            padding: '10px 16px',
                                            backgroundColor: '#F3CB23',
                                            color: '#374640',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#e6b71a';
                                            e.target.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#F3CB23';
                                            e.target.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        + Créer un pays
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Affichage des pays */}
                    {countriesLoading ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#666'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                            <p>Chargement des pays...</p>
                        </div>
                    ) : countriesError ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#666',
                            backgroundColor: '#fee2e2',
                            borderRadius: '8px',
                            border: '2px dashed #ef4444'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                            <p style={{ color: '#ef4444' }}>
                                Erreur lors du chargement des pays
                            </p>
                        </div>
                    ) : countriesData?.countries?.length > 0 ? (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: '24px',
                                marginBottom: '40px'
                            }}>
                                {countriesData.countries
                                    .slice(0, isModerator ? 4 : isAdmin ? undefined : 6)
                                    .map((country) => (
                                        <CountryCard key={country.id} country={country} />
                                    ))
                                }
                            </div>

                            {/* Bouton voir plus pour voyageurs */}
                            {!isAdmin && !isModerator && countriesData.countries.length > 6 && (
                                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                    <button
                                        onClick={() => navigate('/countries')}
                                        style={{
                                            backgroundColor: 'transparent',
                                            color: '#2E3830',
                                            border: '1px dashed #2E3830',
                                            borderRadius: '25px',
                                            padding: '12px 24px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = '#F3CB23';
                                            e.currentTarget.style.borderColor = '#F3CB23';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.borderColor = '#2E3830';
                                        }}
                                    >
                                        ✦ Voir tous les pays ({countriesData.countries.length})
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#666',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '2px dashed #ddd'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌍</div>
                            <p style={{ marginBottom: '20px' }}>
                                {isAdmin ? 'Aucun pays créé pour le moment' : 'Aucun pays disponible pour le moment'}
                            </p>
                            {isAdmin && (
                                <button
                                    onClick={() => navigate('/country-form')}
                                    style={{
                                        backgroundColor: '#F3CB23',
                                        color: '#2E3830',
                                        border: 'none',
                                        borderRadius: '25px',
                                        padding: '12px 24px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ✦ Créer le premier pays
                                </button>
                            )}
                            {!isAdmin && (
                                <p style={{ fontSize: '14px', color: '#999' }}>
                                    Revenez bientôt pour découvrir de nouveaux contenus !
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Footer */}
            <div className="contact-footer" style={{
                backgroundColor: '#374640',
                color: 'white',
                padding: '40px',
                textAlign: 'center'
            }}>

                {/* Emails sous Contact */}
                <div style={{
                    marginBottom: '30px',
                    fontSize: '14px'
                }}>

                    <h2 className="footer-heading" style={{
                        fontSize: '24px',
                        marginBottom: '15px',
                        color: 'white'
                    }}>Contact</h2>

                    <div style={{ marginBottom: '5px' }}>
                        <a href="mailto:Argentikk@gmail.com" style={{
                            color: 'white',
                            textDecoration: 'none'
                        }}>
                            Argentikk@gmail.com
                        </a>
                    </div>
                    <div>
                        <a href="mailto:konateadam265@gmail.com" style={{
                            color: 'white',
                            textDecoration: 'none'
                        }}>
                            konateadam265@gmail.com
                        </a>
                    </div>
                </div>

                {/* Section Réseaux avec liens en dessous */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{
                        fontSize: '18px',
                        marginBottom: '15px',
                        color: 'white'
                    }}>Réseaux</h3>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '15px',
                        flexWrap: 'wrap'
                    }}>
                        <a
                            href="https://www.instagram.com/akon_47b/"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: 'white',
                                textDecoration: 'none',
                                padding: '8px 16px',
                                border: '1px solid #F3CB23',
                                borderRadius: '20px',
                                transition: 'all 0.3s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = '#F3CB23';
                                e.target.style.color = '#374640';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = 'white';
                            }}
                        >
                            📸 Instagram
                        </a>
                        <a
                            href="https://www.youtube.com/@AdamKonate-tl4fg"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: 'white',
                                textDecoration: 'none',
                                padding: '8px 16px',
                                border: '1px solid #F3CB23',
                                borderRadius: '20px',
                                transition: 'all 0.3s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = '#F3CB23';
                                e.target.style.color = '#374640';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = 'white';
                            }}
                        >
                            🎥 YouTube
                        </a>
                    </div>
                </div>

                {/* Copyright */}
                <div style={{
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    fontSize: '14px',
                    opacity: 0.8,
                    color: 'white'
                }}>
                    © 2025 Atlas - Créé par Adam Konaté
                </div>
            </div>

        </>
    );
};

export default Dashboard;