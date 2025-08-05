import { apiSlice } from '../apiSlice';
import { setUser, clearUser } from '../../store/slices/authSlice';

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // 🔒 Login avec JSON (compatible json_login Symfony)
        login: builder.mutation({
            query: (credentials) => ({
                url: '/api/login',
                method: 'POST',
                // 🔥 CORRECTION : Ne pas utiliser JSON.stringify() !
                // RTK Query sérialise automatiquement l'objet
                body: {
                    email: credentials.email,
                    password: credentials.password
                },
                headers: {
                    'Content-Type': 'application/json',  // ← Garder ceci
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }),
            onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    if (data.success && data.user) {
                        dispatch(setUser(data.user));
                    }
                } catch (err) {
                    console.error('Erreur login:', err);
                }
            },
            invalidatesTags: [{ type: 'Auth', id: 'STATUS' }],
        }),

        // 🔒 Déconnexion avec cookies
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
                    // ✅ Nettoyer Redux
                    dispatch(clearUser());
                    dispatch(apiSlice.util.resetApiState());
                }
            },
        }),

        // 🔒 Vérification auth au démarrage
        checkAuth: builder.query({
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
    }),
});

export const {
    useLoginMutation,
    useLogoutMutation,
    useCheckAuthQuery,
    useVerifyEmailQuery,
    useResendVerificationEmailMutation,
} = authApi;