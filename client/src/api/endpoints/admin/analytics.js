// src/api/endpoints/admin/analytics.js
import { apiSlice } from '../../apiSlice';

export const analyticsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Récupérer toutes les données analytics pour l'admin
        getAnalytics: builder.query({
            query: () => '/api/analytics',
            providesTags: ['Analytics'],
            // Cache les données pendant 5 minutes (300 secondes)
            keepUnusedDataFor: 300,
        }),

        // Rafraîchir les données analytics
        refreshAnalytics: builder.mutation({
            query: () => ({
                url: '/api/analytics',
                method: 'GET',
            }),
            invalidatesTags: ['Analytics'],
        }),
    }),
});

export const {
    useGetAnalyticsQuery,
    useRefreshAnalyticsMutation,
} = analyticsApi;