import { apiSlice } from '../apiSlice';
import { setUser } from '../../store/slices/authSlice';

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // ✅ Connexion SIMPLE sans remember me
        login: builder.mutation({
            query: (credentials) => ({
                url: '/api/login',
                method: 'POST',
                body: {
                    email: credentials.email,
                    password: credentials.password
                },
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }),
            invalidatesTags: [{ type: 'Auth', id: 'STATUS' }],
        }),

        // ✅ Déconnexion SIMPLE
        logout: builder.mutation({
            query: () => ({
                url: '/api/logout',
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }),
            onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;
                } catch (err) {
                    console.error('Erreur déconnexion:', err);
                } finally {
                    // ✅ Nettoyer Redux uniquement (pas de localStorage)
                    dispatch(setUser(null));
                    dispatch(apiSlice.util.resetApiState());
                }
            },
        }),

        // ✅ getCurrentUser SIMPLE - Le cookie de session est géré automatiquement
        getCurrentUser: builder.query({
            query: () => ({
                url: '/api/me',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }),
            providesTags: [{ type: 'Auth', id: 'CURRENT_USER' }],
            transformResponse: (response) => {
                if (response && response.id) {
                    return {
                        id: response.id,
                        email: response.email,
                        pseudo: response.pseudo,
                        firstname: response.firstname,
                        lastname: response.lastname,
                        roles: response.roles,
                        isVerified: response.isVerified,
                        profilePicture: response.profilePicture
                    };
                }
                return null;
            }
        }),

        // ✅ Vérification email
        verifyEmail: builder.query({
            query: (token) => {
                if (!token || typeof token !== 'string' || token.length < 10) {
                    throw new Error('Token invalide');
                }

                return {
                    url: `/api/verify-email?token=${encodeURIComponent(token)}`,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                };
            },
        }),

        // ✅ Renvoi email vérification
        resendVerificationEmail: builder.mutation({
            query: () => ({
                url: '/api/resend-verification-email',
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }),
        }),

        // ❌ SUPPRIMÉ : deleteAccount - Maintenant géré par profile.js uniquement
    }),
});

export const {
    useLoginMutation,
    useLogoutMutation,
    useGetCurrentUserQuery,
    useVerifyEmailQuery,
    useResendVerificationEmailMutation,

} = authApi;