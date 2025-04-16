import { createSlice } from '@reduxjs/toolkit';


const initialState = {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('token')
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Action pour définir le token
        setToken(state, action) {
            state.token = action.payload;
            state.isAuthenticated = !!action.payload;

            if (action.payload) {
                localStorage.setItem('token', action.payload);
            } else {
                localStorage.removeItem('token');
            }
        },

        // Action pour définir les données utilisateur
        setUser(state, action) {
            state.user = action.payload;

            if (action.payload) {
                localStorage.setItem('user', JSON.stringify(action.payload));
            } else {
                localStorage.removeItem('user');
            }
        },

        // Action pour déconnecter l'utilisateur
        logout(state) {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },
});

// Export des actions
export const { setToken, setUser, logout } = authSlice.actions;


export const selectToken = (state) => state.auth.token;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsVerified = (state) => state.auth.user?.isVerified || false;

export default authSlice.reducer;