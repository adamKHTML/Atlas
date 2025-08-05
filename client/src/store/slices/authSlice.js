import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: false
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {

        setUser(state, action) {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
            state.isLoading = false;
        },

        // Action pour déconnecter l'utilisateur
        clearUser(state) {
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
        },

        // Action pour gérer le loading
        setLoading(state, action) {
            state.isLoading = action.payload;
        }
    },
});

// Export des actions
export const { setUser, clearUser, setLoading } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectIsVerified = (state) => state.auth.user?.isVerified || false;
export const selectIsAdmin = (state) => state.auth.user?.roles?.includes('ROLE_ADMIN') || false;

export default authSlice.reducer;