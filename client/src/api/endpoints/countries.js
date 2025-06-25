// src/api/endpoints/countries.js - VERSION OPTIMISÉE
import { apiSlice } from '../apiSlice';

export const countriesApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // 🎯 ENDPOINT UNIQUE ET FLEXIBLE
        getAllCountries: builder.query({
            query: ({ page = 1, limit = 12, withImages = false } = {}) => ({
                url: '/api/countries',
                params: {
                    page,
                    limit,
                    with_images: withImages ? 'true' : 'false'
                },
            }),
            providesTags: ['Countries'],
            transformResponse: (response) => ({
                countries: response.countries || [],
                pagination: response.pagination || {}
            }),
        }),

        // 🌍 HOOK SPÉCIALISÉ POUR DASHBOARD (utilise getAllCountries avec images)
        getCountriesForDashboard: builder.query({
            query: (limit = 50) => ({
                url: '/api/countries',
                params: {
                    limit,
                    with_images: 'true'
                },
            }),
            providesTags: ['Countries'],
            transformResponse: (response) => ({
                countries: response.countries || []
            }),
        }),

        // 📖 HOOK POUR LISTE SIMPLE (utilise getAllCountries sans images)
        getCountriesBasic: builder.query({
            query: ({ page = 1, limit = 12 } = {}) => ({
                url: '/api/countries',
                params: { page, limit },
            }),
            providesTags: ['Countries'],
            transformResponse: (response) => ({
                countries: response.countries || [],
                pagination: response.pagination || {}
            }),
        }),

        getCountryById: builder.query({
            query: (id) => `/api/countries/${id}`,
            providesTags: (result, error, id) => [{ type: 'Countries', id }],
        }),

        // Endpoint pour CountryPage - récupère pays + contenu complet
        getCountryWithContent: builder.query({
            query: (id) => `/api/countries/${id}/full`,
            providesTags: (result, error, id) => [
                { type: 'Countries', id },
                { type: 'Content', id: `country-${id}` }
            ],
            transformResponse: (response) => ({
                ...response,
                sections: response.sections || []
            }),
        }),

        // Recherche de pays par nom
        searchCountries: builder.query({
            query: (searchTerm) => ({
                url: '/api/countries/search',
                params: { q: searchTerm },
            }),
            providesTags: ['Countries'],
            transformResponse: (response) => ({
                countries: response.countries || [],
                search_term: response.search_term || '',
                count: response.count || 0
            }),
        }),

        // Pays populaires/recommandés pour la page d'accueil
        getFeaturedCountries: builder.query({
            query: (limit = 6) => ({
                url: '/api/countries/featured',
                params: { limit },
            }),
            providesTags: ['Countries'],
            transformResponse: (response) => ({
                countries: response.countries || []
            }),
        }),
    }),
});

export const {
    useGetAllCountriesQuery,
    useGetCountriesForDashboardQuery, // 🆕 Pour Dashboard
    useGetCountriesBasicQuery,         // 🆕 Pour listes simples
    useGetCountryByIdQuery,
    useGetCountryWithContentQuery,
    useSearchCountriesQuery,
    useGetFeaturedCountriesQuery,
} = countriesApi;