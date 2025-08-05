// src/api/endpoints/admin/countries.js - VERSION ÉQUILIBRÉE COMPLÈTE
import { apiSlice } from '../../apiSlice';

export const adminCountriesApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // ==========================================
        // 🎯 ÉTAPES DE CRÉATION D'UN PAYS
        // ==========================================

        // ÉTAPE 1 : Création du pays de base (CountryForm)
        createCountry: builder.mutation({
            query: (countryData) => {
                // Préparation du FormData pour l'upload d'image
                const formData = new FormData();
                formData.append('name', countryData.name);
                formData.append('code', countryData.code);
                formData.append('flag_url', countryData.flag_url);
                formData.append('description', countryData.description);

                // Ajout de l'image du pays dans le bon dossier (countries)
                if (countryData.country_image) {
                    formData.append('country_image', countryData.country_image);
                }

                return {
                    url: '/api/admin/countries',
                    method: 'POST',
                    body: formData,
                    // Ne pas définir Content-Type, le browser le fera automatiquement avec boundary
                };
            },
            // 🎯 INVALIDATION ÉQUILIBRÉE pour création
            invalidatesTags: [
                'Countries', // Invalide toutes les requêtes génériques
                { type: 'Countries', id: 'LIST' }, // Invalide les listes
                { type: 'Countries', id: 'DASHBOARD' }, // Invalide le dashboard
                { type: 'Countries', id: 'FEATURED' }, // Invalide les pays en vedette
                'CountriesStats' // Invalide les statistiques
            ],
            transformResponse: (response) => {
                console.log('✅ Pays créé avec succès:', response);
                return response;
            },
        }),

        // ÉTAPE 2 : Mise à jour/ajout du contenu (CountryContent)
        updateCountryContent: builder.mutation({
            query: ({ countryId, sections }) => {
                // Transformer les sections pour mettre l'URL d'image dans 'content'
                const transformedSections = sections.map(section => {
                    if (section.type === 'image') {
                        // Pour les images : l'URL va dans 'content'
                        return {
                            title: section.title,
                            content: section.imageUrl || '', // L'URL de l'image va dans 'content'
                            type: section.type
                        };
                    } else {
                        // Pour texte et vidéo : le contenu va normalement dans 'content'
                        return {
                            title: section.title,
                            content: section.content || '',
                            type: section.type
                        };
                    }
                });

                console.log('📤 Sections transformées envoyées à l\'API:', transformedSections);

                return {
                    url: `/api/admin/countries/${countryId}/content`,
                    method: 'PUT',
                    body: { sections: transformedSections },
                    headers: {
                        'Content-Type': 'application/json',
                    },
                };
            },
            // 🎯 INVALIDATION ÉQUILIBRÉE pour le contenu
            invalidatesTags: (result, error, { countryId }) => [
                'Countries', // Invalide les requêtes génériques
                { type: 'Countries', id: 'LIST' }, // Invalide les listes
                { type: 'Countries', id: 'DASHBOARD' }, // Invalide le dashboard
                { type: 'Countries', id: countryId }, // Invalide ce pays spécifique
                { type: 'Content', id: `country-${countryId}` }, // Invalide le contenu de ce pays
                'CountriesStats' // Invalide les statistiques
            ],
        }),

        // Upload d'images pour les sections de contenu (dossier 'sections')
        uploadSectionImage: builder.mutation({
            query: ({ countryId, imageFile }) => {
                const formData = new FormData();
                formData.append('section_image', imageFile);
                formData.append('country_id', countryId);

                return {
                    url: '/api/admin/countries/upload-section-image',
                    method: 'POST',
                    body: formData,
                };
            },
            // Retourne l'URL de l'image uploadée
            transformResponse: (response) => response.image_url,
        }),

        // ==========================================
        // 🔧 GESTION COMPLÈTE (CRUD) - Pour l'interface d'administration
        // ==========================================

        // Liste des pays pour l'admin avec pagination et recherche
        getAllCountriesAdmin: builder.query({
            query: ({ page = 1, limit = 10, search = '' } = {}) => ({
                url: '/api/admin/countries',
                params: { page, limit, search },
            }),
            // 🎯 TAGS SPÉCIFIQUES pour admin
            providesTags: (result) => [
                'Countries',
                { type: 'Countries', id: 'LIST' },
                { type: 'Countries', id: 'ADMIN_LIST' },
                ...(result?.countries || []).map(({ id }) => ({ type: 'Countries', id }))
            ],
            transformResponse: (response) => ({
                countries: response.countries || [],
                pagination: response.pagination || {}
            }),
        }),

        // Récupération d'un pays spécifique pour l'admin
        getCountryByIdAdmin: builder.query({
            query: (id) => `/api/admin/countries/${id}`,
            providesTags: (result, error, id) => [
                { type: 'Countries', id },
                { type: 'Countries', id: 'ADMIN_DETAIL' }
            ],
        }),

        // Modification d'un pays existant
        updateCountry: builder.mutation({
            query: ({ id, ...updates }) => {
                // Si il y a une nouvelle image, utiliser FormData
                if (updates.country_image instanceof File) {
                    const formData = new FormData();
                    Object.keys(updates).forEach(key => {
                        if (updates[key] !== null && updates[key] !== undefined) {
                            formData.append(key, updates[key]);
                        }
                    });

                    return {
                        url: `/api/admin/countries/${id}`,
                        method: 'PUT',
                        body: formData,
                    };
                } else {
                    // Sinon, JSON classique
                    return {
                        url: `/api/admin/countries/${id}`,
                        method: 'PUT',
                        body: updates,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    };
                }
            },
            // 🎯 INVALIDATION ÉQUILIBRÉE pour modification
            invalidatesTags: (result, error, { id }) => [
                'Countries', // Invalide les requêtes génériques
                { type: 'Countries', id: 'LIST' }, // Invalide les listes
                { type: 'Countries', id: 'DASHBOARD' }, // Invalide le dashboard
                { type: 'Countries', id: 'FEATURED' }, // Invalide les pays en vedette
                { type: 'Countries', id }, // Invalide ce pays spécifique
                'CountriesStats' // Invalide les statistiques
            ],
        }),

        // 🗑️ SUPPRESSION D'UN PAYS - VERSION ÉQUILIBRÉE
        deleteCountry: builder.mutation({
            query: (id) => ({
                url: `/api/admin/countries/${id}`,
                method: 'DELETE',
            }),
            // 🎯 INVALIDATION ÉQUILIBRÉE - Ciblée mais complète
            invalidatesTags: (result, error, id) => [
                'Countries', // Invalide toutes les requêtes génériques
                { type: 'Countries', id: 'LIST' }, // Invalide toutes les listes
                { type: 'Countries', id: 'DASHBOARD' }, // Invalide le dashboard
                { type: 'Countries', id: 'FEATURED' }, // Invalide les pays en vedette
                { type: 'Countries', id: 'ADMIN_LIST' }, // Invalide la liste admin
                { type: 'Countries', id }, // Invalide ce pays spécifique
                { type: 'Content', id: `country-${id}` }, // Invalide le contenu de ce pays
                'CountriesStats' // Invalide les statistiques
            ],
            transformResponse: (response) => {
                console.log('✅ Pays supprimé avec succès:', response);
                return response;
            },
        }),

        // Statistiques pour le dashboard admin
        getCountriesStats: builder.query({
            query: () => '/api/admin/countries/stats',
            providesTags: ['CountriesStats'],
        }),
    }),
});

export const {
    // ==========================================
    // 🎯 HOOKS POUR CRÉATION DE PAYS
    // ==========================================
    useCreateCountryMutation,
    useUpdateCountryContentMutation,
    useUploadSectionImageMutation,

    // ==========================================
    // 🔧 HOOKS POUR GESTION COMPLÈTE (CRUD)
    // ==========================================
    useGetAllCountriesAdminQuery,
    useGetCountryByIdAdminQuery,
    useUpdateCountryMutation,
    useDeleteCountryMutation,

    // ==========================================
    // 📊 HOOKS POUR STATISTIQUES
    // ==========================================
    useGetCountriesStatsQuery,
} = adminCountriesApi;