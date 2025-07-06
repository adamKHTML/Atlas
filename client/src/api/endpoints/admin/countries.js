// src/api/endpoints/admin/countries.js - CORRIGÉ
import { apiSlice } from '../../apiSlice';

export const adminCountriesApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // ÉTAPE 1 : Création du pays de base (CountryForm) - CORRIGÉ
        createCountry: builder.mutation({
            query: (countryData) => {
                // Préparation du FormData pour l'upload d'image
                const formData = new FormData();
                formData.append('name', countryData.name);
                formData.append('code', countryData.code);
                formData.append('flag_url', countryData.flag_url);
                formData.append('description', countryData.description);

                // 🆕 Ajout de l'image du pays dans le bon dossier (countries)
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
            invalidatesTags: ['Countries'],
            // Transformation de la réponse pour récupérer l'ID du pays créé
            transformResponse: (response) => response,
        }),

        // 🔧 ÉTAPE 2 : Mise à jour/ajout du contenu (CountryContent) - CORRIGÉ
        updateCountryContent: builder.mutation({
            query: ({ countryId, sections }) => {
                // 🔧 CORRECTION : Transformer les sections pour mettre l'URL d'image dans 'content'
                const transformedSections = sections.map(section => {
                    if (section.type === 'image') {
                        // Pour les images : l'URL va dans 'content'
                        return {
                            title: section.title,
                            content: section.imageUrl || '', // ✅ L'URL de l'image va dans 'content'
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
            invalidatesTags: (result, error, { countryId }) => [
                { type: 'Countries', id: countryId },
                { type: 'Content', id: `country-${countryId}` },
                'Countries'
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

        // GESTION COMPLÈTE (CRUD) - Pour l'interface d'administration
        getAllCountriesAdmin: builder.query({
            query: ({ page = 1, limit = 10, search = '' } = {}) => ({
                url: '/api/admin/countries',
                params: { page, limit, search },
            }),
            providesTags: ['Countries'],
            transformResponse: (response) => ({
                countries: response.countries || [],
                pagination: response.pagination || {}
            }),
        }),

        getCountryByIdAdmin: builder.query({
            query: (id) => `/api/admin/countries/${id}`,
            providesTags: (result, error, id) => [{ type: 'Countries', id }],
        }),

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
            invalidatesTags: (result, error, { id }) => [
                { type: 'Countries', id },
                'Countries'
            ],
        }),

        deleteCountry: builder.mutation({
            query: (id) => ({
                url: `/api/admin/countries/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Countries'],
        }),

        // Statistiques pour le dashboard admin
        getCountriesStats: builder.query({
            query: () => '/api/admin/countries/stats',
            providesTags: ['CountriesStats'],
        }),
    }),
});

export const {
    // Étapes de création
    useCreateCountryMutation,
    useUpdateCountryContentMutation,
    useUploadSectionImageMutation,

    // CRUD complet
    useGetAllCountriesAdminQuery,
    useGetCountryByIdAdminQuery,
    useUpdateCountryMutation,
    useDeleteCountryMutation,

    // Actions supplémentaires
    useGetCountriesStatsQuery,
} = adminCountriesApi;