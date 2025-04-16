import { apiSlice } from '../apiSlice';


export const registerApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        register: builder.mutation({
            query: (userData) => {
                // Si le userData contient un fichier (avatar), on utilise FormData
                if (userData.profile_picture instanceof File) {
                    const formData = new FormData();

                    // Ajout des données textuelles
                    Object.keys(userData).forEach(key => {
                        if (key !== 'profile_picture') {
                            formData.append(key, userData[key]);
                        }
                    });

                    // Ajout de l'avatar
                    formData.append('profile_picture', userData.profile_picture);

                    return {
                        url: '/api/register',
                        method: 'POST',
                        body: formData,
                        formData: true, // Important pour que RTK Query ne sérialise pas le FormData
                    };
                }

                // Si pas de fichier, on envoie le body directement
                return {
                    url: '/api/register',
                    method: 'POST',
                    body: userData,
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