import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    token: null,
    user: null,
    isAuthenticated: false
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Action pour définir le token
        setToken(state, action) {
            state.token = action.payload;
            state.isAuthenticated = !!action.payload;
        },

        // Action pour définir les données utilisateur
        setUser(state, action) {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
        },

        // Action pour déconnecter l'utilisateur
        logout(state) {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
        }
    },
});

// Export des actions
export const { setToken, setUser, logout } = authSlice.actions;

export const selectToken = (state) => state.auth.token;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsVerified = (state) => state.auth.user?.isVerified || false;
export const selectIsAdmin = (state) =>
    state.auth.user?.roles?.includes('ROLE_ADMIN') || false;

export default authSlice.reducer;