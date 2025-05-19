import { apiSlice } from '../apiSlice';

export const registerApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        register: builder.mutation({
            query: (userData) => {
                // Si userData est déjà un FormData, l'utiliser directement
                if (userData instanceof FormData) {
                    return {
                        url: '/api/register',
                        method: 'POST',
                        body: userData,
                        // Ne pas définir Content-Type, le navigateur le fera automatiquement
                    };
                }

                // Sinon, créer un nouveau FormData
                const formData = new FormData();

                // Ajouter chaque champ
                Object.keys(userData).forEach(key => {
                    if (userData[key] !== null && userData[key] !== undefined) {
                        formData.append(key, userData[key]);
                    }
                });

                // Log pour débogage (à supprimer en production)
                console.log('Envoi du FormData avec les champs:', [...formData.entries()].map(e => e[0]));

                return {
                    url: '/api/register',
                    method: 'POST',
                    body: formData,
                    // Ne pas définir Content-Type, le navigateur le fera automatiquement
                    // Ne pas utiliser formData: true (option non standard qui cause des problèmes)
                };
            },
            invalidatesTags: [{ type: 'Auth', id: 'STATUS' }],
        }),

        // Renvoi de l'email de vérification
        resendVerificationEmail: builder.mutation({
            query: () => ({
                url: '/api/resend-verification-email',
                method: 'POST',
            }),
        }),
    }),
});

export const {
    useRegisterMutation,
    useResendVerificationEmailMutation
} = registerApi;