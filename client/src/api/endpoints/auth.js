import { apiSlice } from '../apiSlice';
import { setUser } from '../../store/slices/authSlice'; // Importez setUser depuis votre slice

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Connexion utilisateur par identifiants
        login: builder.mutation({
            query: (credentials) => ({
                url: '/api/login',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: [{ type: 'Auth', id: 'STATUS' }],
        }),

        // Déconnexion
        logout: builder.mutation({
            query: () => ({
                url: '/api/logout',
                method: 'POST',
            }),
            onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    // Réinitialiser l'état d'authentification dans Redux
                    dispatch(setUser(null));
                    dispatch(apiSlice.util.resetApiState());
                } catch (error) {
                    console.error('Erreur lors de la déconnexion:', error);
                }
            },
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

        // Renvoyer l'email de vérification
        resendVerificationEmail: builder.mutation({
            query: () => ({
                url: '/api/resend-verification-email',
                method: 'POST',
            }),
        }),
    }),
});

export const {
    useLoginMutation,
    useLogoutMutation,
    useGetCurrentUserQuery,
    useVerifyEmailQuery,
    useResendVerificationEmailMutation
} = authApi;