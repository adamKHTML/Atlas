// src/pages/CountriesListPage.jsx - Version finale avec style CountryPage
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetAllCountriesQuery } from '../api/endpoints/countries';
import { useSelector } from 'react-redux';
import DOMPurify from 'dompurify';

const CountriesListPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCountries, setFilteredCountries] = useState([]);

    const itemsPerPage = 12;

    // 🔒 Gestion de l'authentification comme dans CountryPage
    const user = useSelector(state => state.auth?.user);
    const isAuthenticated = useSelector(state => state.auth?.isAuthenticated || false);

    // Hook pour gérer la responsive
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Variables responsive
    const isMobile = windowWidth <= 768;
    const isSmallMobile = windowWidth <= 480;

    // RTK Query pour récupérer tous les pays
    const {
        data: countriesData,
        isLoading,
        error,
        refetch
    } = useGetAllCountriesQuery({
        page: currentPage,
        limit: itemsPerPage,
        withImages: true
    });

    const allCountries = countriesData?.countries || [];
    const pagination = countriesData?.pagination || {};

    // 🔍 Filtrage corrigé - plus strict pour éviter les faux positifs
    useEffect(() => {
        if (searchTerm.trim()) {
            const filtered = allCountries.filter(country => {
                const searchLower = searchTerm.toLowerCase();
                const countryName = country.name.toLowerCase();

                // Fonction pour supprimer les accents
                const removeAccents = (str) => {
                    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                };

                const searchWithoutAccents = removeAccents(searchLower);
                const countryNameWithoutAccents = removeAccents(countryName);

                // Filtrage strict : seulement au début du nom ou début des mots
                return countryName.startsWith(searchLower) ||
                    countryNameWithoutAccents.startsWith(searchWithoutAccents) ||
                    countryName.split(' ').some(word => word.startsWith(searchLower)) ||
                    countryNameWithoutAccents.split(' ').some(word => word.startsWith(searchWithoutAccents));
            });
            setFilteredCountries(filtered);
        } else {
            setFilteredCountries(allCountries);
        }
    }, [allCountries, searchTerm]);

    // 🔒 Fonction pour la navigation adaptative (comme CountryPage)
    const handleMainNavigation = () => {
        if (isAuthenticated) {
            navigate('/dashboard');
        } else {
            navigate('/');
        }
    };

    // Fonction pour décoder les entités HTML
    const decodeHtmlEntities = (text) => {
        if (!text || typeof text !== 'string') return text;

        const textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    };

    // Gestionnaires d'événements
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(1);

        // Mettre à jour l'URL
        if (value.trim()) {
            setSearchParams({ search: value });
        } else {
            setSearchParams({});
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCountryClick = (countryId) => {
        navigate(`/country/${countryId}`);
    };

    const clearSearch = () => {
        setSearchTerm('');
        setSearchParams({});
        setCurrentPage(1);
    };

    // Déterminer les pays à afficher (filtrés ou tous)
    const isSearching = searchTerm.trim().length > 0;
    const displayedCountries = isSearching ? filteredCountries : allCountries;

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
                            alt={decodeHtmlEntities(DOMPurify.sanitize(country.name))}
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
                            {decodeHtmlEntities(DOMPurify.sanitize(country.name))}
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
                            {decodeHtmlEntities(DOMPurify.sanitize(country.description))}
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
                                alt={`Drapeau ${decodeHtmlEntities(DOMPurify.sanitize(country.name))}`}
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
                        alt={decodeHtmlEntities(DOMPurify.sanitize(country.name))}
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
                            alt={`Drapeau ${decodeHtmlEntities(DOMPurify.sanitize(country.name))}`}
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
                        {decodeHtmlEntities(DOMPurify.sanitize(country.name))}
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
                        {decodeHtmlEntities(DOMPurify.sanitize(country.description))}
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
        if (!pagination.pages || pagination.pages <= 1 || isSearching) return null;

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

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#4a5c52',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                    <p className="text-white">Chargement des pays...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#4a5c52',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', color: '#ef4444' }}>❌</div>
                    <p style={{ color: 'white', marginBottom: '16px' }}>Erreur lors du chargement des pays</p>
                    <button
                        onClick={() => refetch()}
                        className="px-6 py-2 border border-dashed border-yellow-400 text-yellow-400 rounded-full hover:bg-yellow-400 hover:text-gray-800 transition-all duration-300"
                    >
                        ✦ Réessayer ✦
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#4a5c52' }}>
            {/* 🎯 Navigation supérieure - Logo seul */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <img
                            src="/image/SunLogo2.svg"
                            alt='Atlas Logo'
                            style={{ height: isMobile ? '32px' : '80px' }}
                        />
                    </div>

                    <div className="flex items-center space-x-6">
                        <button
                            onClick={handleMainNavigation}
                            className="px-6 py-2 border border-dashed border-yellow-400 text-yellow-400 rounded-full hover:bg-yellow-400 hover:text-gray-800 transition-all duration-300"
                        >
                            ✦ {isAuthenticated ? 'DASHBOARD' : 'PAGE D\'ACCUEIL'} ✦
                        </button>
                    </div>
                </div>
            </nav>

            {/* 🎯 Section Hero - Style unifié */}
            <div className="relative overflow-hidden" style={{ minHeight: '50vh' }}>
                {/* Header avec recherche - couleur unie */}
                <div style={{
                    backgroundColor: '#4a5c52', // Couleur plus sombre unifiée
                    padding: isMobile ? '100px 15px 30px' : '120px 30px 40px',
                    color: 'white'
                }}>
                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto'
                    }}>
                        <h1 style={{
                            fontSize: isMobile ? '28px' : '40px',
                            fontWeight: '600',
                            margin: '0 0 16px 0',
                            textAlign: 'center',
                            fontFamily: 'Vollkorn, Georgia, serif'
                        }}>
                            🌍 Découvrez nos Destinations
                        </h1>
                        <p style={{
                            fontSize: isMobile ? '14px' : '18px',
                            margin: '0 0 30px 0',
                            textAlign: 'center',
                            opacity: 0.9,
                            fontFamily: 'Vollkorn, Georgia, serif'
                        }}>
                            Explorez {pagination.total || allCountries.length} pays et leurs merveilles
                        </p>

                        {/* 🔍 Barre de recherche avec filtrage amélioré */}
                        <div style={{
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}>
                            <div
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: '25px',
                                    padding: '4px',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder="Rechercher un pays..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        style={{
                                            flex: 1,
                                            padding: '16px 24px',
                                            border: 'none',
                                            outline: 'none',
                                            fontSize: '16px',
                                            backgroundColor: 'transparent',
                                            color: '#374640',
                                            borderRadius: '25px'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        style={{
                                            padding: '12px 20px',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '18px',
                                            color: '#374640',
                                            borderRadius: '25px'
                                        }}
                                    >
                                        🔍
                                    </button>
                                </div>
                            </div>

                            {/* Indicateur de filtrage */}
                            {isSearching && (
                                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                    <p style={{
                                        color: 'white',
                                        fontSize: '14px',
                                        opacity: 0.8,
                                        margin: '0 0 8px 0'
                                    }}>
                                        {displayedCountries.length} pays trouvé{displayedCountries.length > 1 ? 's' : ''} pour "{searchTerm}"
                                    </p>
                                    {displayedCountries.length === 0 && (
                                        <button
                                            onClick={clearSearch}
                                            style={{
                                                padding: '8px 16px',
                                                border: '1px solid rgba(255,255,255,0.5)',
                                                color: 'white',
                                                backgroundColor: 'transparent',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            Effacer la recherche
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 🎯 Container de contenu - réduit les espaces */}
            <div style={{
                minHeight: '60vh',
                backgroundColor: '#ECF3F0',
                marginTop: '-20px', // Réduit l'espace
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: isMobile ? '40px 15px 30px' : '60px 30px 40px' // Réduit les paddings
                }}>
                    {/* Barre d'outils */}
                    <div style={{
                        padding: isMobile ? '15px' : '20px 30px',
                        backgroundColor: 'white',
                        borderBottom: '1px solid #e5e7eb',
                        borderRadius: '12px 12px 0 0'
                    }}>
                        <div style={{
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
                                {isSearching ? (
                                    <>Filtré: "{searchTerm}" ({displayedCountries.length} trouvé{displayedCountries.length > 1 ? 's' : ''})</>
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
                        padding: isMobile ? '20px' : '30px',
                        backgroundColor: 'white',
                        borderRadius: '0 0 12px 12px'
                    }}>
                        {displayedCountries.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: '#6b7280'
                            }}>
                                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
                                <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#374640' }}>
                                    {isSearching ? 'Aucun pays trouvé' : 'Aucun pays disponible'}
                                </h3>
                                <p style={{ fontSize: '14px' }}>
                                    {isSearching
                                        ? `Aucun résultat pour "${searchTerm}". Essayez avec d'autres mots-clés.`
                                        : 'Les pays seront bientôt ajoutés à la plateforme.'
                                    }
                                </p>
                                {isSearching && (
                                    <button
                                        onClick={clearSearch}
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
                                    {displayedCountries.map((country) => (
                                        <CountryCard
                                            key={country.id}
                                            country={country}
                                            viewMode={isMobile ? 'grid' : viewMode}
                                        />
                                    ))}
                                </div>

                                {/* Pagination - seulement si pas de recherche */}
                                <Pagination />
                            </>
                        )}
                    </div>
                </div>

                {/* Bouton BACK */}
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <button
                        onClick={handleMainNavigation}
                        style={{
                            padding: '12px 32px',
                            border: '2px solid #374640',
                            color: '#374640',
                            backgroundColor: 'transparent',
                            borderRadius: '25px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            letterSpacing: '0.5px'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#374640';
                            e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#374640';
                        }}
                    >
                        RETOUR
                    </button>
                </div>
            </div>

            {/* Footer simple */}
            <footer className="bg-white border-t border-gray-200 py-12 relative z-30">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-4">
                            <h3
                                className="text-xl font-serif italic text-gray-800"
                                style={{ fontFamily: 'Vollkorn, Georgia, serif' }}
                            >
                                ATLAS
                            </h3>
                            <span className="text-gray-400">|</span>
                            <span className="text-sm text-gray-600 font-light">
                                Découverte culturelle et voyage
                            </span>
                        </div>

                        <div className="flex items-center space-x-8 text-sm text-gray-600">
                            <span className="font-light">
                                {displayedCountries.length} pays disponible{displayedCountries.length > 1 ? 's' : ''}
                            </span>
                            <button
                                onClick={handleMainNavigation}
                                className="hover:text-yellow-400 transition-colors font-light"
                            >
                                {isAuthenticated ? 'Retour au Dashboard' : 'Retour à l\'accueil'}
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default CountriesListPage;