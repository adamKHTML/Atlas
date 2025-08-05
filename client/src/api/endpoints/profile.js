// src/api/endpoints/profile.js - VERSION CORRIGÉE
import { apiSlice } from '../apiSlice';

export const profileApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getProfile: builder.query({
            query: () => ({
                url: '/api/profile',
                credentials: 'include',
            }),
            providesTags: ['Profile'],
        }),

        // Mise à jour des infos texte uniquement
        updateProfileInfo: builder.mutation({
            query: (profileData) => ({
                url: '/api/profile/info',
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
                credentials: 'include',
            }),
            invalidatesTags: ['Profile', 'Auth'],
        }),

        // 🔥 CORRECTION : Mise à jour de la photo uniquement
        updateProfilePicture: builder.mutation({
            query: (formData) => ({
                url: '/api/profile/picture',
                method: 'POST',
                body: formData,
                credentials: 'include',

            }),
            invalidatesTags: ['Profile', 'Auth'],
        }),

        changePassword: builder.mutation({
            query: (passwordData) => ({
                url: '/api/profile/password',
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(passwordData),
                credentials: 'include',
            }),
        }),

        deleteAccount: builder.mutation({
            query: (passwordData) => ({
                url: '/api/profile',
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(passwordData),
                credentials: 'include',
            }),
            invalidatesTags: ['Profile', 'Auth'],
        }),
    }),
});

export const {
    useGetProfileQuery,
    useUpdateProfileInfoMutation,
    useUpdateProfilePictureMutation,
    useChangePasswordMutation,
    useDeleteAccountMutation,
} = profileApi;