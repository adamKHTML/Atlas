import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = "http://localhost:8000";

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        credentials: 'include',
        prepareHeaders: (headers) => {

            headers.set('X-Requested-With', 'XMLHttpRequest');
            headers.set('Content-Type', 'application/json');
            return headers;
        },
    }),
    tagTypes: ['Register', 'Auth', 'Country', 'Ban', 'Discussion', 'Message', 'Notification', 'User', 'UserManagement'],
    endpoints: () => ({}),
});