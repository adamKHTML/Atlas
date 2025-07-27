import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetAllCountriesQuery } from '../api/endpoints/countries';

function Home() {
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);

    // Récupérer les pays (limité à 6 pour la page d'accueil)
    const {
        data: countriesData,
        isLoading: countriesLoading,
        error: countriesError
    } = useGetAllCountriesQuery({
        page: 1,
        limit: 6,
        withImages: true
    });

    // Gérer le scroll pour les animations - FIX: Ajouter throttling
    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    setScrollY(window.scrollY);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleCountryClick = (countryId) => {
        navigate(`/country/${countryId}`);
    };

    const handleViewAllCountries = () => {
        navigate('/countries');
    };

    // ✅ COMPOSANT SEARCH CORRIGÉ POUR ÉVITER LES BOUCLES INFINIES
    const CustomSearchComponent = ({
        placeholder = "Rechercher un pays...",
        showResults = true,
        onSelect = null,
        maxResults = 8
    }) => {
        const navigate = useNavigate();
        const [searchTerm, setSearchTerm] = useState('');
        const [showDropdown, setShowDropdown] = useState(false);
        const [filteredCountries, setFilteredCountries] = useState([]);

        // ✅ SOLUTION 1: Requête séparée pour la recherche (pas d'authentification requise)
        const {
            data: searchCountriesData,
            isLoading: isSearchLoading
        } = useGetAllCountriesQuery({
            page: 1,
            limit: 100,
            withImages: true
        }, {
            // ✅ Utiliser des options RTK Query pour éviter les erreurs d'auth
            skip: false, // Ne pas skip, mais gérer l'erreur gracieusement
        });

        // ✅ SOLUTION 2: Mémoriser la liste des pays pour éviter les re-renders
        const countries = useMemo(() => {
            return searchCountriesData?.countries || [];
        }, [searchCountriesData?.countries]);

        // ✅ SOLUTION 3: useCallback pour stabiliser la fonction de filtrage
        const filterCountries = useCallback((term, countriesList) => {
            if (!term.trim() || !countriesList.length) {
                return [];
            }

            return countriesList
                .filter(country =>
                    country.name.toLowerCase().includes(term.toLowerCase()) ||
                    (country.description && country.description.toLowerCase().includes(term.toLowerCase()))
                )
                .slice(0, maxResults);
        }, [maxResults]);

        // ✅ SOLUTION 4: useEffect avec dépendances stables
        useEffect(() => {
            const filtered = filterCountries(searchTerm, countries);

            setFilteredCountries(filtered);
            setShowDropdown(filtered.length > 0 && searchTerm.trim().length > 0);
        }, [searchTerm, countries, filterCountries]); // ✅ Dépendances stables

        const handleInputChange = useCallback((e) => {
            setSearchTerm(e.target.value);
        }, []);

        const handleCountrySelect = useCallback((country) => {
            if (onSelect) {
                onSelect(country);
            } else {
                navigate(`/country/${country.id}`);
            }
            setSearchTerm('');
            setShowDropdown(false);
        }, [onSelect, navigate]);

        const handleSubmit = useCallback((e) => {
            e.preventDefault();
            if (filteredCountries.length > 0) {
                handleCountrySelect(filteredCountries[0]);
            } else if (searchTerm.trim()) {
                navigate(`/countries?search=${encodeURIComponent(searchTerm.trim())}`);
                setSearchTerm('');
                setShowDropdown(false);
            }
        }, [filteredCountries, searchTerm, handleCountrySelect, navigate]);

        // ✅ SOLUTION 5: useEffect avec cleanup proper et dépendances stables
        useEffect(() => {
            const handleClickOutside = () => setShowDropdown(false);
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }, []); // ✅ Pas de dépendances car la fonction ne change jamais

        // ✅ SOLUTION 6: Gérer gracieusement les erreurs d'authentification
        if (searchCountriesData === undefined && !isSearchLoading) {
            // Si pas de données et pas de loading, c'est probablement une erreur d'auth
            // Dans ce cas, on propose quand même un champ de recherche fonctionnel
            return (
                <div style={{ position: 'relative', width: '100%' }}>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (searchTerm.trim()) {
                            navigate(`/countries?search=${encodeURIComponent(searchTerm.trim())}`);
                            setSearchTerm('');
                        }
                    }}>
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            backgroundColor: '#ECF3F0',
                            border: '2px solid #374640',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(55, 70, 64, 0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    placeholder={placeholder}
                                    value={searchTerm}
                                    onChange={handleInputChange}
                                    style={{
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: '16px',
                                        fontFamily: 'inherit',
                                        backgroundColor: 'transparent',
                                        color: '#374640',
                                        width: '100%',
                                        padding: '14px 16px',
                                        fontWeight: '500'
                                    }}
                                    autoComplete="off"
                                />
                                <button
                                    type="submit"
                                    style={{
                                        padding: '10px 16px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '18px',
                                        color: '#374640',
                                        transition: 'color 0.2s'
                                    }}
                                >
                                    🔍
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            );
        }

        return (
            <div style={{ position: 'relative', width: '100%' }}>
                <form onSubmit={handleSubmit}>
                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            backgroundColor: '#ECF3F0',
                            border: '2px solid #374640',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(55, 70, 64, 0.1)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder={placeholder}
                                value={searchTerm}
                                onChange={handleInputChange}
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: '16px',
                                    fontFamily: 'inherit',
                                    backgroundColor: 'transparent',
                                    color: '#374640',
                                    width: '100%',
                                    padding: '14px 16px',
                                    fontWeight: '500'
                                }}
                                autoComplete="off"
                            />
                            <button
                                type="submit"
                                style={{
                                    padding: '10px 16px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    color: '#374640',
                                    transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.color = '#F3CB23'}
                                onMouseLeave={(e) => e.target.style.color = '#374640'}
                            >
                                🔍
                            </button>
                        </div>

                        {/* Dropdown des résultats */}
                        {showResults && showDropdown && filteredCountries.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: '#ECF3F0',
                                border: '2px solid #374640',
                                borderTop: 'none',
                                borderRadius: '0 0 12px 12px',
                                boxShadow: '0 4px 12px rgba(55, 70, 64, 0.15)',
                                zIndex: 1000,
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                {filteredCountries.map((country) => (
                                    <div
                                        key={country.id}
                                        onClick={() => handleCountrySelect(country)}
                                        style={{
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #e9ecef',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                        <div style={{
                                            width: '40px',
                                            height: '30px',
                                            borderRadius: '4px',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                            border: '1px solid #374640'
                                        }}>
                                            <img
                                                src={country.country_image ?
                                                    `http://localhost:8000${country.country_image}` :
                                                    country.flag_url
                                                }
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
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: '600',
                                                color: '#374640',
                                                fontSize: '14px',
                                                marginBottom: '2px'
                                            }}>
                                                {country.name}
                                            </div>
                                            {country.description && (
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#6b7280',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {country.description}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{
                                            width: '24px',
                                            height: '18px',
                                            borderRadius: '2px',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                            border: '1px solid #374640'
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
                                ))}
                            </div>
                        )}

                        {/* Message de chargement */}
                        {isSearchLoading && searchTerm && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: '#ECF3F0',
                                border: '2px solid #374640',
                                borderTop: 'none',
                                borderRadius: '0 0 12px 12px',
                                boxShadow: '0 4px 12px rgba(55, 70, 64, 0.15)',
                                zIndex: 1000,
                                padding: '20px',
                                textAlign: 'center',
                                color: '#374640',
                                fontSize: '14px'
                            }}>
                                <div style={{ marginBottom: '8px' }}>🔄</div>
                                Recherche en cours...
                            </div>
                        )}

                        {/* Message aucun résultat */}
                        {showResults && showDropdown && filteredCountries.length === 0 && searchTerm && !isSearchLoading && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: '#f8f9fa',
                                border: '2px solid #374640',
                                borderTop: 'none',
                                borderRadius: '0 0 12px 12px',
                                boxShadow: '0 4px 12px rgba(55, 70, 64, 0.15)',
                                zIndex: 1000,
                                padding: '20px',
                                textAlign: 'center',
                                color: '#374640',
                                fontSize: '14px'
                            }}>
                                <div style={{ marginBottom: '8px' }}>🔍</div>
                                Aucun pays trouvé pour "{searchTerm}"
                            </div>
                        )}
                    </div>
                </form>
            </div>
        );
    };

    // Composant pour les cartes de pays
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
                    height: '320px',
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
                {/* Nom du pays en haut avec étoile jaune */}
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
                        fontSize: '20px',
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
                    top: '60px',
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
                    top: '75px',
                    right: '35px',
                    width: '32px',
                    height: '24px',
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
                        padding: '6px 12px',
                        fontSize: '12px',
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

    return (
        <div className="home-container">
            {/* Header/Hero Section */}
            <div className="hero-section">
                <div className="header-nav">
                    <img
                        src="/image/SunLogo.svg"
                        alt='Solar Atlas Logo'
                        className="logo" />
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/login"
                            className="border border-dashed border-white rounded-full px-5 py-2 inline-flex items-center text-white hover:bg-white/20 transition-colors"
                        >
                            <span className="text-yellow-400 mr-2">✦</span>
                            Connexion
                        </Link>
                        <Link
                            to="/register"
                            className="border border-dashed border-white rounded-full px-5 py-2 inline-flex items-center text-white hover:bg-white/20 transition-colors"
                        >
                            <span className="text-yellow-400 mr-2">✦</span>
                            Inscription
                        </Link>
                    </div>
                </div>
                <img
                    src="/image/Atlashome2.svg"
                    alt="Vue panoramique de montagnes côtières"
                    className="hero-image"
                />

                {/* Section de présentation inspirée de "THE WAY" */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: 'white',
                    zIndex: 10,
                    width: '100%',
                    maxWidth: '1200px',
                    padding: '0 20px'
                }}>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        letterSpacing: '3px',
                        marginBottom: '20px',
                        color: '#F3CB23',
                        textTransform: 'uppercase'
                    }}>
                        TROUVEZ
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(48px, 8vw, 120px)',
                        fontWeight: '300',
                        fontStyle: 'italic',
                        margin: '0 0 20px 0',
                        lineHeight: '0.9',
                        color: '#F3CB23',
                        textShadow: '0 4px 8px rgba(0,0,0,0.3)'
                    }}>
                        VOTRE DESTINATION
                    </h1>

                    <div style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        letterSpacing: '2px',
                        marginBottom: '40px',
                        color: '#F3CB23',
                        textTransform: 'uppercase'
                    }}>
                        QUI VOUS INSPIRE
                    </div>

                    {/* Section avec texte de bienvenue et soleil tournant */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '20px',
                        marginBottom: '40px',
                        flexWrap: 'wrap'
                    }}>
                        {/* Soleil tournant */}
                        <img
                            src="/image/Vector.svg"
                            alt="Soleil"
                            style={{
                                width: '40px',
                                height: '40px',
                                animation: 'spin 10s linear infinite'
                            }}
                        />

                        <p style={{
                            fontSize: '16px',
                            color: '#F3CB23',
                            margin: 0,
                            maxWidth: '500px',
                            lineHeight: '1.6',
                            textAlign: 'center',
                            fontWeight: '500'
                        }}>
                            Bienvenue dans l'Atlas, où chaque destination raconte une histoire unique.
                            Découvrez des cultures fascinantes, des paysages époustouflants et créez
                            des souvenirs inoubliables à travers le monde.
                        </p>

                        {/* Deuxième soleil tournant */}
                        <img
                            src="/image/Vector.svg"
                            alt="Soleil"
                            style={{
                                width: '40px',
                                height: '40px',
                                animation: 'spin 8s linear infinite reverse'
                            }}
                        />
                    </div>

                    {/* Bouton CTA */}
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            backgroundColor: 'transparent',
                            color: '#F3CB23',
                            border: '2px dashed #F3CB23',
                            borderRadius: '25px',
                            padding: '12px 30px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#F3CB23';
                            e.currentTarget.style.color = '#374640';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(243, 203, 35, 0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#F3CB23';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        ✦ Explorer Maintenant ✦
                    </button>
                </div>
            </div>

            {/* ✅ Section avec images animées au hover - CORRIGÉE */}
            <div className="content" style={{ overflow: 'hidden' }}>
                <div className="featured-container">
                    <div
                        className="featured-grid"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            height: '400px',
                            gap: '0',
                            position: 'relative'
                        }}
                    >
                        {/* ✅ PREMIÈRE IMAGE - Inspirehome.svg */}
                        <div
                            className="featured-item"
                            style={{
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.4s ease'
                            }}
                            onMouseEnter={(e) => {
                                // Élargir l'image de GAUCHE et comprimer les autres
                                const grid = e.currentTarget.parentElement;
                                grid.style.gridTemplateColumns = '1.5fr 0.75fr 0.75fr';
                            }}
                            onMouseLeave={(e) => {
                                // Remettre toutes les images à la même taille
                                const grid = e.currentTarget.parentElement;
                                grid.style.gridTemplateColumns = '1fr 1fr 1fr';
                            }}
                        >
                            <img
                                src="/image/Inspirehome.svg"
                                alt="Terrasses agricoles avec parapluie rouge"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.4s ease'
                                }}
                            />
                            {/* Overlay avec texte français */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center',
                                color: '#F3CB23',
                                zIndex: 10
                            }}>
                                <h2 style={{
                                    fontSize: '36px',
                                    fontWeight: '300',
                                    fontStyle: 'italic',
                                    margin: '0',
                                    lineHeight: '1',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                }}>
                                    Découvrir
                                </h2>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    letterSpacing: '1px',
                                    marginTop: '8px',
                                    textTransform: 'uppercase',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                }}>
                                    L'essence du voyage
                                </div>
                            </div>
                        </div>

                        {/* ✅ DEUXIÈME IMAGE - Ricefieldhome.svg */}
                        <div
                            className="featured-item"
                            style={{
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.4s ease'
                            }}
                            onMouseEnter={(e) => {
                                // Élargir l'image du CENTRE et comprimer les autres
                                const grid = e.currentTarget.parentElement;
                                grid.style.gridTemplateColumns = '0.75fr 1.5fr 0.75fr';
                            }}
                            onMouseLeave={(e) => {
                                const grid = e.currentTarget.parentElement;
                                grid.style.gridTemplateColumns = '1fr 1fr 1fr';
                            }}
                        >
                            <img
                                src="/image/Ricefieldhome.svg"
                                alt="Deux personnes se tenant la main devant un paysage côtier"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.4s ease'
                                }}
                            />
                            {/* Overlay avec texte français */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center',
                                color: '#F3CB23',
                                zIndex: 10
                            }}>
                                <h2 style={{
                                    fontSize: '36px',
                                    fontWeight: '300',
                                    fontStyle: 'italic',
                                    margin: '0',
                                    lineHeight: '1',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                }}>
                                    Partager
                                </h2>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    letterSpacing: '1px',
                                    marginTop: '8px',
                                    textTransform: 'uppercase',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                }}>
                                    Vos expériences
                                </div>
                            </div>
                        </div>

                        {/* ✅ TROISIÈME IMAGE - Toscanahome2.svg */}
                        <div
                            className="featured-item"
                            style={{
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.4s ease'
                            }}
                            onMouseEnter={(e) => {
                                // Élargir l'image de DROITE et comprimer les autres
                                const grid = e.currentTarget.parentElement;
                                grid.style.gridTemplateColumns = '0.75fr 0.75fr 1.5fr';
                            }}
                            onMouseLeave={(e) => {
                                const grid = e.currentTarget.parentElement;
                                grid.style.gridTemplateColumns = '1fr 1fr 1fr';
                            }}
                        >
                            <img
                                src="/image/Toscanahome2.svg"
                                alt="Collines toscanes au coucher du soleil"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.4s ease'
                                }}
                            />
                            {/* Overlay avec texte français */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center',
                                color: '#F3CB23',
                                zIndex: 10
                            }}>
                                <h2 style={{
                                    fontSize: '36px',
                                    fontWeight: '300',
                                    fontStyle: 'italic',
                                    margin: '0',
                                    lineHeight: '1',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                }}>
                                    Explorer
                                </h2>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    letterSpacing: '1px',
                                    marginTop: '8px',
                                    textTransform: 'uppercase',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                }}>
                                    Le monde en communauté
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Countries Section */}
            <div className="featured-section">
                {/* Title Section */}
                <div className="title-section">
                    <div className="title-label">Destinations</div>
                    <h1 className="main-title">Découvrez nos Pays</h1>
                    <div className="title-divider"></div>
                </div>

                {/* Section recherche rapide avec style personnalisé */}
                <div style={{
                    padding: '0 40px',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    marginBottom: '40px'
                }}>
                    <div style={{
                        backgroundColor: '#ECF3F0',
                        border: '2px solid #374640',
                        borderRadius: '12px',
                        padding: '20px'
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
                                    fontWeight: '600',
                                    fontStyle: 'italic'
                                }}>
                                    Trouvez votre prochaine aventure
                                </h3>
                                <p style={{
                                    margin: '0 0 12px 0',
                                    color: '#6b7280',
                                    fontSize: '14px'
                                }}>
                                    Explorez nos destinations et laissez-vous inspirer par la beauté du monde
                                </p>
                                <CustomSearchComponent
                                    placeholder="Rechercher un pays..."
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
                                <button
                                    onClick={() => navigate('/register')}
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
                                    ✦ Rejoindre Atlas
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Countries Grid */}
                <div style={{
                    padding: '0 40px',
                    maxWidth: '1400px',
                    margin: '0 auto'
                }}>
                    {countriesLoading ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '24px',
                            marginBottom: '60px'
                        }}>
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    style={{
                                        height: '320px',
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#6b7280'
                                    }}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                                        <div style={{ fontSize: '12px' }}>Chargement...</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : countriesError ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: '#6b7280'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#374640' }}>
                                Erreur de chargement
                            </h3>
                            <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                                Impossible de charger les pays pour le moment.
                            </p>
                        </div>
                    ) : countriesData?.countries?.length > 0 ? (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: '24px',
                                marginBottom: '60px'
                            }}>
                                {countriesData.countries.map((country) => (
                                    <CountryCard key={country.id} country={country} />
                                ))}
                            </div>

                            {/* Bouton "Voir tous les pays" */}
                            <div style={{
                                textAlign: 'center',
                                marginBottom: '40px'
                            }}>
                                <button
                                    onClick={handleViewAllCountries}
                                    style={{
                                        backgroundColor: 'transparent',
                                        color: '#374640',
                                        border: '2px dashed #374640',
                                        borderRadius: '25px',
                                        padding: '16px 32px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = '#F3CB23';
                                        e.currentTarget.style.borderColor = '#F3CB23';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(243, 203, 35, 0.3)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.borderColor = '#374640';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <span>✦</span>
                                    Découvrir tous nos pays
                                    <span style={{ fontSize: '14px' }}>→</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: '#6b7280'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌍</div>
                            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#374640' }}>
                                Aucun pays disponible
                            </h3>
                            <p style={{ fontSize: '14px' }}>
                                Les destinations seront bientôt ajoutées à la plateforme.
                            </p>
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

            {/* CSS pour l'animation de rotation */}
            <style>{`
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                
                .hero-section {
                    position: relative;
                    overflow: hidden;
                }
                
                .featured-grid {
                    will-change: transform;
                }
                
                .featured-item {
                    will-change: transform;
                }
            `}</style>
        </div>
    );
}

export default Home;