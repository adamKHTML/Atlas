import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import { authApi } from '../api/endpoints/auth';
import { registerApi } from '../api/endpoints/register';
import { profileApi } from '../api/endpoints/profile';
import { analyticsApi } from '../api/endpoints/admin/analytics';
import authReducer from './slices/authSlice';

// Configuration du store Redux
export const store = configureStore({
    reducer: {
        // Réducteurs API
        [apiSlice.reducerPath]: apiSlice.reducer,

        // Réducteur Auth
        auth: authReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            apiSlice.middleware,
            // Note: Ces middlewares sont inclus dans apiSlice.middleware
            // car authApi et registerApi utilisent apiSlice.injectEndpoints
            // Il n'est donc pas nécessaire de les ajouter explicitement,
            // mais on les laisse ici pour la clarté
            authApi?.middleware,
            registerApi?.middleware,
            profileApi?.middleware,
            analyticsApi?.middleware
        ),
    devTools: true, // Activé par défaut, vous pourrez le désactiver en production
});

// Hook pour accéder au store depuis n'importe quel composant
export default store;