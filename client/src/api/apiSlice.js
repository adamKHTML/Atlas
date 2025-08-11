// src/api/apiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = "http://localhost:8000";

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        credentials: 'include',
        // Dans apiSlice.js, modifiez prepareHeaders comme ça :
        prepareHeaders: (headers, { getState, endpoint, type, extra }) => {
            headers.set('X-Requested-With', 'XMLHttpRequest');

            if (endpoint === 'createCountry' || endpoint === 'register') {
                headers.delete('Content-Type'); // Laisser le navigateur gérer
                console.log(`🔧 Content-Type supprimé pour ${endpoint}`);
                return headers;
            }


            // Pour tous les autres endpoints
            const isUploadEndpoint = /upload|picture|file|image/i.test(endpoint || '');
            if (!isUploadEndpoint) {
                headers.set('Content-Type', 'application/json');
            }

            return headers;
        }
    }),
    tagTypes: ['Register', 'Auth', 'Country', 'Ban', 'Discussion', 'Message', 'Notification', 'User', 'UserManagement', 'Profile'],
    endpoints: () => ({}),
});