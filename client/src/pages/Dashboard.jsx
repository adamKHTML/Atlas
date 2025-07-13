import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAdmin, selectIsAuthenticated } from '../store/slices/authSlice';
import { useLogoutMutation } from '../api/endpoints/auth';
import { useGetCountriesForDashboardQuery } from '../api/endpoints/countries';
import { useGetUnreadCountQuery } from '../api/endpoints/notifications';

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

    // Vérifier si l'utilisateur est modérateur
    const isModerator = user?.roles?.includes('ROLE_MODERATOR');

    // Actions admin
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

    // Actions modérateur
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

    // Actions voyageur/user
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

    // Vérifier l'authentification
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    // Fonction pour déconnecter l'utilisateur
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

    // 🆕 COMPOSANT CARTE STYLE COMPACT ET CORRIGÉ
    const CountryCard = ({ country }) => {
        // 🔧 CORRECTION FINALE : URL complète avec serveur backend
        const getCountryImage = () => {
            if (country.country_image) {
                // ✅ Ajouter l'URL du backend Symfony (port 8000)
                return `http://localhost:8000${country.country_image}`;
            }
            return country.flag_url;
        };

        return (
            <div
                onClick={() => handleCountryClick(country.id)}
                style={{
                    position: 'relative',
                    width: '40%',
                    height: '200px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
                    background: 'linear-gradient(135deg, #4a5c52 0%, #2d3d32 100%)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,0.08)';
                }}
            >
                {/* Titre en haut */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    padding: '12px 16px',
                    zIndex: 2
                }}>
                    <h3 style={{
                        fontSize: '22px',
                        fontWeight: '300',
                        margin: 0,
                        color: 'white',
                        fontFamily: 'Georgia, serif',
                        textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}>
                        {country.name}
                    </h3>
                </div>

                {/* Image dans la partie inférieure */}
                <div style={{
                    position: 'absolute',
                    bottom: '14px',
                    left: '14px',
                    right: '14px',
                    height: '110px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
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

                    {/* Overlay subtil */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.08), transparent)'
                    }} />
                </div>

                {/* Badge petit drapeau */}
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    width: '22px',
                    height: '16px',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    border: '1.5px solid white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    zIndex: 3
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
            </div>
        );
    };

    // Fonction pour rendre les boutons d'action avec badge
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
            {/* Badge pour notifications non lues */}
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

    // Si l'utilisateur n'est pas chargé, afficher un chargement
    if (!user) {
        return <div>Chargement...</div>;
    }

    return (
        <>
            <div className="dashboard-navbar">
                <img
                    src="/image/SunLogo.svg"
                    alt='Solar Atlas Logo'
                    className="logo" />
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
                        LOGOUT
                    </button>
                </div>
            </div>

            <section className="dashboard-header">
                <div className="header-rounded">
                    <div className="dashboard-background">
                        <img
                            src="/image/DashboardBack.svg"
                            alt='Mountain landscape'
                            className="dashboard-img" />
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

            {/* Afficher un contenu différent selon le rôle */}
            <div className="content">
                {isAdmin ? (
                    // Contenu admin
                    <div className="featured-container" style={{ backgroundColor: 'white', padding: '30px' }}>
                        <div className="title-section" style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <h2 className="main-title">PANNEAU D'ADMINISTRATION</h2>
                            <div className="title-divider" style={{ width: '60px', margin: '20px auto' }}></div>
                        </div>

                        {/* Stats Admin */}
                        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '50px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F3CB23' }}>
                                    {countriesData?.countries?.length || 0}
                                </div>
                                <div>Pays créés</div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    Pays disponibles
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F3CB23' }}>
                                    {countriesData?.countries?.reduce((total, country) =>
                                        total + (country.content_count || 0), 0) || 0}
                                </div>
                                <div>Contenus publiés</div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    Sections de contenu
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F3CB23' }}>
                                    {unreadCount}
                                </div>
                                <div>Notifications</div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    Messages non lus
                                </div>
                            </div>
                        </div>

                        {/* Actions Admin */}
                        <div className="title-section" style={{ marginBottom: '30px' }}>
                            <h2 className="main-title">ACTIONS ADMINISTRATEUR</h2>
                            <div className="title-divider"></div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '16px',
                            marginBottom: '50px'
                        }}>
                            {adminActions.map((action, index) => renderActionButton(action, index))}
                        </div>

                        {/* Section Pays */}
                        <div className="title-section">
                            <h2 className="main-title">PAYS DISPONIBLES</h2>
                            <div className="title-divider"></div>
                        </div>

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
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                gap: '16px',
                                marginBottom: '40px'
                            }}>
                                {countriesData.countries.map((country) => (
                                    <CountryCard key={country.id} country={country} />
                                ))}
                            </div>
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
                                    Aucun pays créé pour le moment
                                </p>
                                <button
                                    onClick={() => handleActionClick('/country-form')}
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
                            </div>
                        )}
                    </div>
                ) : isModerator ? (
                    // Contenu modérateur
                    <div className="featured-container" style={{ backgroundColor: 'white', padding: '30px' }}>
                        <div className="title-section" style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <h2 className="main-title">TABLEAU DE BORD MODÉRATEUR</h2>
                            <div className="title-divider" style={{ width: '60px', margin: '20px auto' }}></div>
                        </div>

                        {/* Stats Modérateur */}
                        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '50px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F3CB23' }}>
                                    {unreadCount}
                                </div>
                                <div>Notifications</div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    Messages non lus
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F3CB23' }}>-</div>
                                <div>Signalements</div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    À implémenter
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F3CB23' }}>
                                    {countriesData?.countries?.length || 0}
                                </div>
                                <div>Pays disponibles</div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    À modérer
                                </div>
                            </div>
                        </div>

                        {/* Actions Modérateur */}
                        <div className="title-section" style={{ marginBottom: '30px' }}>
                            <h2 className="main-title">MES ACTIONS MODÉRATEUR</h2>
                            <div className="title-divider"></div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '16px',
                            marginBottom: '50px'
                        }}>
                            {moderatorActions.map((action, index) => renderActionButton(action, index))}
                        </div>

                        {/* Section Pays pour Modérateurs */}
                        <div className="title-section">
                            <h2 className="main-title">PAYS À MODÉRER</h2>
                            <div className="title-divider"></div>
                        </div>

                        {countriesLoading ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#666'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                                <p>Chargement des pays...</p>
                            </div>
                        ) : countriesData?.countries?.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                gap: '16px',
                                marginBottom: '40px'
                            }}>
                                {countriesData.countries.slice(0, 4).map((country) => (
                                    <CountryCard key={country.id} country={country} />
                                ))}
                            </div>
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
                                <p>Aucun pays disponible pour le moment</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // Contenu voyageur/user
                    <div className="featured-container" style={{ backgroundColor: 'white', padding: '30px' }}>
                        <div className="title-section" style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <h2 className="main-title">TABLEAU DE BORD</h2>
                            <div className="title-divider" style={{ width: '60px', margin: '20px auto' }}></div>
                        </div>

                        {/* Stats Voyageur */}
                        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '50px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F3CB23' }}>
                                    {unreadCount}
                                </div>
                                <div>Notifications</div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    Messages non lus
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F3CB23' }}>-</div>
                                <div>Topics</div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    À implémenter
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F3CB23' }}>
                                    {countriesData?.countries?.length || 0}
                                </div>
                                <div>Pays disponibles</div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    À découvrir
                                </div>
                            </div>
                        </div>

                        {/* Actions Voyageur */}
                        <div className="title-section" style={{ marginBottom: '30px' }}>
                            <h2 className="main-title">MES ACTIONS</h2>
                            <div className="title-divider"></div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '16px',
                            marginBottom: '50px'
                        }}>
                            {travelerActions.map((action, index) => renderActionButton(action, index))}
                        </div>

                        {/* Section Pays pour Voyageurs */}
                        <div className="title-section">
                            <h2 className="main-title">PAYS À DÉCOUVRIR</h2>
                            <div className="title-divider"></div>
                        </div>

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
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                    gap: '16px',
                                    marginBottom: '40px'
                                }}>
                                    {countriesData.countries.slice(0, 6).map((country) => (
                                        <CountryCard key={country.id} country={country} />
                                    ))}
                                </div>

                                {/* Bouton voir plus */}
                                {countriesData.countries.length > 6 && (
                                    <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                        <button
                                            onClick={() => handleActionClick('/countries')}
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
                                    Aucun pays disponible pour le moment
                                </p>
                                <p style={{ fontSize: '14px', color: '#999' }}>
                                    Revenez bientôt pour découvrir de nouveaux contenus !
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Contact Footer */}
            <div className="contact-footer">
                <h2 className="footer-heading">Contact</h2>
                <div className="footer-mail">Réseaux</div>
            </div>
        </>
    );
};

export default Dashboard;