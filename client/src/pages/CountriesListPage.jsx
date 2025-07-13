import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetAllCountriesQuery, useSearchCountriesQuery } from '../api/endpoints/countries';

const CountriesListPage = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const itemsPerPage = 12;

    // Hook pour gérer la responsive
    React.useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Variables responsive
    const isMobile = windowWidth <= 768;
    const isSmallMobile = windowWidth <= 480;

    // RTK Query hooks - utiliser la recherche si terme présent, sinon liste normale
    const shouldSearch = searchTerm.trim().length > 0;

    const {
        data: countriesData,
        isLoading,
        error,
        refetch
    } = useGetAllCountriesQuery(
        {
            page: currentPage,
            limit: itemsPerPage,
            withImages: true
        },
        { skip: shouldSearch }
    );

    const {
        data: searchData,
        isLoading: isSearching,
        error: searchError
    } = useSearchCountriesQuery(searchTerm, {
        skip: !shouldSearch
    });

    // Déterminer les données à afficher
    const displayData = shouldSearch ? searchData : countriesData;
    const countries = displayData?.countries || [];
    const pagination = displayData?.pagination || {};
    const loading = shouldSearch ? isSearching : isLoading;
    const dataError = shouldSearch ? searchError : error;

    // Gestionnaires d'événements
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset à la page 1 lors d'une recherche
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCountryClick = (countryId) => {
        navigate(`/country/${countryId}`);
    };

    // Composant pour une carte de pays
    const CountryCard = ({ country, viewMode }) => {
        const getCountryImage = () => {
            if (country.country_image) {
                return `http://localhost:8000${country.country_image}`;
            }
            return country.flag_url;
        };

        if (viewMode === 'list') {
            return (
                <div
                    onClick={() => handleCountryClick(country.id)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '12px' : '20px',
                        padding: isMobile ? '15px' : '20px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: '1px solid #e5e7eb'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                >
                    <div style={{
                        width: isMobile ? '60px' : '80px',
                        height: isMobile ? '45px' : '60px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0
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
                                e.target.src = country.flag_url;
                            }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{
                            fontSize: isMobile ? '16px' : '18px',
                            fontWeight: '600',
                            color: '#374640',
                            margin: '0 0 8px 0'
                        }}>
                            {country.name}
                        </h3>
                        <p style={{
                            fontSize: isMobile ? '13px' : '14px',
                            color: '#6b7280',
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            {country.description}
                        </p>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexShrink: 0
                    }}>
                        <div style={{
                            width: isMobile ? '24px' : '32px',
                            height: isMobile ? '18px' : '24px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: '1px solid #e5e7eb'
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
                        <span style={{
                            fontSize: '24px',
                            color: '#374640'
                        }}>
                            →
                        </span>
                    </div>
                </div>
            );
        }

        // Mode grille (par défaut)
        return (
            <div
                onClick={() => handleCountryClick(country.id)}
                style={{
                    position: 'relative',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb',
                    height: isMobile ? '280px' : '320px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
            >
                {/* Image principale */}
                <div style={{
                    height: isMobile ? '160px' : '200px',
                    overflow: 'hidden',
                    position: 'relative'
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
                            e.target.src = country.flag_url;
                        }}
                    />

                    {/* Badge drapeau */}
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '32px',
                        height: '24px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: '2px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
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

                {/* Contenu */}
                <div style={{
                    padding: isMobile ? '16px' : '20px'
                }}>
                    <h3 style={{
                        fontSize: isMobile ? '18px' : '20px',
                        fontWeight: '600',
                        color: '#374640',
                        margin: '0 0 12px 0'
                    }}>
                        {country.name}
                    </h3>
                    <p style={{
                        fontSize: isMobile ? '13px' : '14px',
                        color: '#6b7280',
                        margin: 0,
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {country.description}
                    </p>
                </div>

                {/* Badge de contenu */}
                {country.content_count > 0 && (
                    <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        backgroundColor: '#F3CB23',
                        color: '#374640',
                        borderRadius: '12px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: '600'
                    }}>
                        {country.content_count} section{country.content_count > 1 ? 's' : ''}
                    </div>
                )}
            </div>
        );
    };

    // Composant de pagination
    const Pagination = () => {
        if (!pagination.pages || pagination.pages <= 1) return null;

        const maxVisiblePages = isMobile ? 3 : 5;
        const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(pagination.pages, startPage + maxVisiblePages - 1);

        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: isMobile ? '8px' : '12px',
                marginTop: '40px',
                flexWrap: 'wrap'
            }}>
                {/* Bouton précédent */}
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                        padding: isMobile ? '8px 12px' : '10px 16px',
                        backgroundColor: currentPage === 1 ? '#f3f4f6' : '#374640',
                        color: currentPage === 1 ? '#9ca3af' : 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: isMobile ? '12px' : '14px',
                        fontWeight: '600',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    ← Préc.
                </button>

                {/* Numéros de pages */}
                {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        style={{
                            padding: isMobile ? '8px 12px' : '10px 16px',
                            backgroundColor: page === currentPage ? '#F3CB23' : 'white',
                            color: page === currentPage ? '#374640' : '#6b7280',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: isMobile ? '12px' : '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            minWidth: isMobile ? '32px' : '40px'
                        }}
                        onMouseOver={(e) => {
                            if (page !== currentPage) {
                                e.target.style.backgroundColor = '#f8f9fa';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (page !== currentPage) {
                                e.target.style.backgroundColor = 'white';
                            }
                        }}
                    >
                        {page}
                    </button>
                ))}

                {/* Bouton suivant */}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.pages}
                    style={{
                        padding: isMobile ? '8px 12px' : '10px 16px',
                        backgroundColor: currentPage === pagination.pages ? '#f3f4f6' : '#374640',
                        color: currentPage === pagination.pages ? '#9ca3af' : 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: isMobile ? '12px' : '14px',
                        fontWeight: '600',
                        cursor: currentPage === pagination.pages ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Suiv. →
                </button>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#ECF3F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center', color: '#374640' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌍</div>
                    <p>Chargement des pays...</p>
                </div>
            </div>
        );
    }

    if (dataError) {
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
                    <p>Erreur lors du chargement des pays</p>
                    <button
                        onClick={() => refetch()}
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

    return (
        <>
            {/* Navbar */}
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
                padding: isMobile ? '0 15px' : '0 30px',
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '10px' : '20px'
                }}>
                    <img
                        src="/image/SunLogo.svg"
                        alt='Atlas Logo'
                        style={{ height: isMobile ? '32px' : '40px' }}
                    />
                    <h1 style={{
                        color: 'white',
                        margin: 0,
                        fontSize: isMobile ? '16px' : '20px',
                        fontWeight: '600',
                        display: isSmallMobile ? 'none' : 'block'
                    }}>
                        Atlas - Pays
                    </h1>
                </div>

                <button
                    onClick={() => navigate('/Dashboard')}
                    style={{
                        color: 'white',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        padding: isMobile ? '6px 12px' : '8px 16px',
                        fontSize: isMobile ? '12px' : '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    }}
                >
                    🏠 Dashboard
                </button>
            </div>

            {/* Contenu principal */}
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#ECF3F0',
                paddingTop: '70px'
            }}>
                {/* Header avec recherche */}
                <div style={{
                    backgroundColor: '#374640',
                    padding: isMobile ? '20px 15px' : '30px',
                    color: 'white'
                }}>
                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto'
                    }}>
                        <h1 style={{
                            fontSize: isMobile ? '24px' : '32px',
                            fontWeight: '600',
                            margin: '0 0 16px 0',
                            textAlign: 'center'
                        }}>
                            🌍 Découvrez nos Destinations
                        </h1>
                        <p style={{
                            fontSize: isMobile ? '14px' : '16px',
                            margin: '0 0 24px 0',
                            textAlign: 'center',
                            opacity: 0.9
                        }}>
                            Explorez {pagination.total || countries.length} pays et leurs merveilles
                        </p>

                        {/* Barre de recherche */}
                        <div style={{
                            maxWidth: '500px',
                            margin: '0 auto',
                            position: 'relative'
                        }}>
                            <input
                                type="text"
                                placeholder="Rechercher un pays..."
                                value={searchTerm}
                                onChange={handleSearch}
                                style={{
                                    width: '100%',
                                    padding: isMobile ? '12px 40px 12px 12px' : '16px 50px 16px 16px',
                                    fontSize: isMobile ? '14px' : '16px',
                                    border: 'none',
                                    borderRadius: '25px',
                                    outline: 'none',
                                    backgroundColor: 'white',
                                    color: '#374640'
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                right: isMobile ? '12px' : '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: isMobile ? '16px' : '20px',
                                color: '#6b7280'
                            }}>
                                🔍
                            </div>
                        </div>
                    </div>
                </div>

                {/* Barre d'outils */}
                <div style={{
                    padding: isMobile ? '15px' : '20px 30px',
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '15px'
                    }}>
                        {/* Informations */}
                        <div style={{
                            fontSize: isMobile ? '13px' : '14px',
                            color: '#6b7280'
                        }}>
                            {shouldSearch ? (
                                <>Résultats pour "{searchTerm}" ({countries.length} trouvé{countries.length > 1 ? 's' : ''})</>
                            ) : (
                                <>Page {currentPage} sur {pagination.pages || 1} • {pagination.total || 0} pays au total</>
                            )}
                        </div>

                        {/* Sélecteur de vue */}
                        {!isMobile && (
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '8px',
                                padding: '4px'
                            }}>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: viewMode === 'grid' ? '#374640' : 'transparent',
                                        color: viewMode === 'grid' ? 'white' : '#6b7280',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    ⊞ Grille
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: viewMode === 'list' ? '#374640' : 'transparent',
                                        color: viewMode === 'list' ? 'white' : '#6b7280',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    ☰ Liste
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Liste des pays */}
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: isMobile ? '20px 15px' : '30px'
                }}>
                    {countries.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: '#6b7280'
                        }}>
                            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
                            <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#374640' }}>
                                {shouldSearch ? 'Aucun pays trouvé' : 'Aucun pays disponible'}
                            </h3>
                            <p style={{ fontSize: '14px' }}>
                                {shouldSearch
                                    ? `Aucun résultat pour "${searchTerm}". Essayez avec d'autres mots-clés.`
                                    : 'Les pays seront bientôt ajoutés à la plateforme.'
                                }
                            </p>
                            {shouldSearch && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    style={{
                                        marginTop: '20px',
                                        padding: '10px 20px',
                                        backgroundColor: '#F3CB23',
                                        color: '#374640',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Voir tous les pays
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: viewMode === 'list'
                                    ? '1fr'
                                    : `repeat(auto-fill, minmax(${isMobile ? '280px' : '300px'}, 1fr))`,
                                gap: '20px'
                            }}>
                                {countries.map((country) => (
                                    <CountryCard
                                        key={country.id}
                                        country={country}
                                        viewMode={isMobile ? 'grid' : viewMode}
                                    />
                                ))}
                            </div>

                            {/* Pagination - seulement si pas en mode recherche */}
                            {!shouldSearch && <Pagination />}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default CountriesListPage;