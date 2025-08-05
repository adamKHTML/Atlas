// src/api/endpoints/userStats.js
import { apiSlice } from '../apiSlice';

export const userStatsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Récupérer les statistiques de l'utilisateur connecté
        getUserStats: builder.query({
            query: () => ({
                url: '/api/user/stats',
                method: 'GET'
            }),
            providesTags: ['UserStats'],
        }),

        // Récupérer les discussions créées par l'utilisateur
        getUserDiscussions: builder.query({
            query: ({ page = 1, limit = 10 }) => ({
                url: '/api/user/discussions',
                method: 'GET',
                params: { page, limit }
            }),
            providesTags: ['UserDiscussions'],
        }),

        // Récupérer les messages de l'utilisateur
        getUserMessages: builder.query({
            query: ({ page = 1, limit = 20 }) => ({
                url: '/api/user/messages',
                method: 'GET',
                params: { page, limit }
            }),
            providesTags: ['UserMessages'],
        }),

        // Récupérer les top performances de l'utilisateur
        getUserTopPerformers: builder.query({
            query: () => ({
                url: '/api/user/top-performers',
                method: 'GET'
            }),
            providesTags: ['UserTopPerformers'],
        }),
    }),
});

export const {
    useGetUserStatsQuery,
    useGetUserDiscussionsQuery,
    useGetUserMessagesQuery,
    useGetUserTopPerformersQuery,
} = userStatsApi;