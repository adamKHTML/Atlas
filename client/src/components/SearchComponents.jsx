// src/components/SearchComponent.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetAllCountriesQuery } from '../api/endpoints/countries';

const SearchComponent = ({
    placeholder = "Rechercher un pays...",
    showResults = true,
    onSelect = null,
    variant = "default", // "default", "compact", "hero"
    maxResults = 5,
    className = ""
}) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredCountries, setFilteredCountries] = useState([]);

    // Récupérer TOUS les pays pour la recherche locale
    const { data: countriesData, isLoading } = useGetAllCountriesQuery({
        page: 1,
        limit: 100, // Récupérer plus de pays pour la recherche
        withImages: true
    });

    const countries = countriesData?.countries || [];

    // Filtrer les pays localement (plus rapide que des appels API)
    useEffect(() => {
        if (searchTerm.trim().length > 0 && countries.length > 0) {
            const filtered = countries
                .filter(country =>
                    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (country.description && country.description.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .slice(0, maxResults);
            setFilteredCountries(filtered);
            setShowDropdown(true);
        } else {
            setFilteredCountries([]);
            setShowDropdown(false);
        }
    }, [searchTerm, countries, maxResults]);

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleCountrySelect = (country) => {
        if (onSelect) {
            onSelect(country);
        } else {
            navigate(`/country/${country.id}`);
        }
        setSearchTerm('');
        setShowDropdown(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (filteredCountries.length > 0) {
            handleCountrySelect(filteredCountries[0]);
        } else if (searchTerm.trim()) {
            // Rediriger vers la page de recherche avec le terme
            navigate(`/countries?search=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm('');
            setShowDropdown(false);
        }
    };

    // Fermer le dropdown quand on clique ailleurs
    useEffect(() => {
        const handleClickOutside = () => setShowDropdown(false);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Styles selon la variante
    const getInputStyles = () => {
        const baseStyles = {
            border: 'none',
            outline: 'none',
            fontSize: '16px',
            fontFamily: 'inherit',
            backgroundColor: 'transparent',
            color: 'inherit',
            width: '100%'
        };

        switch (variant) {
            case "compact":
                return {
                    ...baseStyles,
                    padding: '8px 12px',
                    fontSize: '14px'
                };
            case "hero":
                return {
                    ...baseStyles,
                    padding: '16px 20px',
                    fontSize: '18px',
                    fontWeight: '400'
                };
            default:
                return {
                    ...baseStyles,
                    padding: '12px 16px'
                };
        }
    };

    const getContainerStyles = () => {
        const baseStyles = {
            position: 'relative',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: variant === 'hero' ? '25px' : '12px',
            border: '1px solid #e5e7eb',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        };

        switch (variant) {
            case "compact":
                return {
                    ...baseStyles,
                    borderRadius: '8px',
                    border: '1px solid #d1d5db'
                };
            case "hero":
                return {
                    ...baseStyles,
                    borderRadius: '25px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '2px solid transparent'
                };
            default:
                return baseStyles;
        }
    };

    return (
        <div className={className} style={{ position: 'relative', width: '100%' }}>
            <form onSubmit={handleSubmit}>
                <div
                    style={getContainerStyles()}
                    onMouseEnter={(e) => {
                        if (variant !== 'compact') {
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                            e.currentTarget.style.borderColor = '#F3CB23';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (variant !== 'compact') {
                            e.currentTarget.style.boxShadow = variant === 'hero' ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)';
                            e.currentTarget.style.borderColor = variant === 'hero' ? 'transparent' : '#e5e7eb';
                        }
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder={placeholder}
                            value={searchTerm}
                            onChange={handleInputChange}
                            style={getInputStyles()}
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            style={{
                                padding: variant === 'hero' ? '12px 20px' : '8px 16px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: variant === 'hero' ? '20px' : '16px',
                                color: '#6b7280',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#374640'}
                            onMouseLeave={(e) => e.target.style.color = '#6b7280'}
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
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderTop: 'none',
                            borderRadius: '0 0 12px 12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
                                        borderBottom: '1px solid #f3f4f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    {/* Image du pays */}
                                    <div style={{
                                        width: '40px',
                                        height: '30px',
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        border: '1px solid #e5e7eb'
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

                                    {/* Informations du pays */}
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

                                    {/* Badge drapeau */}
                                    <div style={{
                                        width: '24px',
                                        height: '18px',
                                        borderRadius: '2px',
                                        overflow: 'hidden',
                                        flexShrink: 0,
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
                                </div>
                            ))}

                            {/* Footer du dropdown */}
                            <div style={{
                                padding: '8px 16px',
                                backgroundColor: '#f8f9fa',
                                fontSize: '12px',
                                color: '#6b7280',
                                textAlign: 'center',
                                borderTop: '1px solid #e5e7eb'
                            }}>
                                {filteredCountries.length === maxResults ?
                                    `Affichage des ${maxResults} premiers résultats` :
                                    `${filteredCountries.length} résultat${filteredCountries.length > 1 ? 's' : ''} trouvé${filteredCountries.length > 1 ? 's' : ''}`
                                }
                            </div>
                        </div>
                    )}

                    {/* Message de chargement */}
                    {isLoading && searchTerm && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderTop: 'none',
                            borderRadius: '0 0 12px 12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 1000,
                            padding: '20px',
                            textAlign: 'center',
                            color: '#6b7280',
                            fontSize: '14px'
                        }}>
                            <div style={{ marginBottom: '8px' }}>🔄</div>
                            Recherche en cours...
                        </div>
                    )}

                    {/* Message aucun résultat */}
                    {showResults && showDropdown && filteredCountries.length === 0 && searchTerm && !isLoading && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderTop: 'none',
                            borderRadius: '0 0 12px 12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 1000,
                            padding: '20px',
                            textAlign: 'center',
                            color: '#6b7280',
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

export default SearchComponent;