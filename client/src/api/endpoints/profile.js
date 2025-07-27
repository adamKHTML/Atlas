// src/api/endpoints/profile.js
import { apiSlice } from '../apiSlice';

export const profileApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Récupérer les informations du profil
        getProfile: builder.query({
            query: () => '/api/profile',
            providesTags: ['Profile'],
        }),

        // Mettre à jour le profil
        updateProfile: builder.mutation({
            query: (formData) => ({
                url: '/api/profile',
                method: 'POST', // FormData nécessite POST
                body: formData,
            }),
            invalidatesTags: ['Profile', 'Auth'],
        }),

        // Changer le mot de passe
        changePassword: builder.mutation({
            query: (passwordData) => ({
                url: '/api/profile/password',
                method: 'POST', // ✅ Changé de PUT à POST
                body: passwordData,
            }),
        }),

        // Supprimer le compte - SEUL ENDPOINT POUR LA SUPPRESSION
        deleteAccount: builder.mutation({
            query: (passwordData) => ({
                url: '/api/profile', // ✅ URL correcte
                method: 'DELETE',
                body: passwordData,
            }),
            invalidatesTags: ['Profile', 'Auth'],
        }),
    }),
});

export const {
    useGetProfileQuery,
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useDeleteAccountMutation,
} = profileApi;