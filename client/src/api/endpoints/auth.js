import { apiSlice } from '../apiSlice';

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Connexion utilisateur
        login: builder.mutation({
            query: (credentials) => ({
                url: '/api/login_check',
                method: 'POST',
                body: credentials,
            }),
            transformResponse: (response) => {
                if (response.token) {
                    localStorage.setItem('token', response.token);
                    console.log('Token saved in localStorage');
                }
                return response;
            },
            invalidatesTags: [{ type: 'Auth', id: 'STATUS' }],
        }),

        // Récupération des informations de l'utilisateur connecté
        getCurrentUser: builder.query({
            query: () => '/api/me',
            providesTags: [{ type: 'Auth', id: 'CURRENT_USER' }],
        }),

        // Vérification d'email
        verifyEmail: builder.query({
            query: (token) => `/api/verify-email?token=${token}`,
        }),
    }),
});

export const {
    useLoginMutation,
    useGetCurrentUserQuery,
    useVerifyEmailQuery
} = authApi;