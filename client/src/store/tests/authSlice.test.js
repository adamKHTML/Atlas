import { describe, it, expect } from 'vitest'
import authReducer, { setUser, clearUser } from '../slices/authSlice'

/**
 * Tests AuthSlice -  Composants Métier Frontend  
 * 
 */
describe('AuthSlice -  Composants Métier', () => {

    /**
     * ✅ : Test state initial sécurisé
     */
    it('should have secure initial state', () => {
        const initialState = authReducer(undefined, { type: '@@INIT' })

        expect(initialState.isAuthenticated).toBe(false)
        expect(initialState.user).toBe(null)
        expect(initialState.isLoading).toBe(false)
    })

    /**
     * ✅  Test setUser sécurisé
     */
    it('should handle secure setUser', () => {
        const userData = {
            id: 1,
            email: 'test@test.com',
            roles: ['ROLE_USER']
        }
        const action = setUser(userData)

        const state = authReducer(undefined, action)

        expect(state.isAuthenticated).toBe(true)
        expect(state.user).toEqual(userData)
        expect(state.isLoading).toBe(false)
    })

    /**
     * ✅  Test clearUser sécurisé  
     */
    it('should handle secure clearUser', () => {
        const loggedInState = {
            isAuthenticated: true,
            user: { id: 1, email: 'test@test.com' },
            isLoading: false
        }

        const state = authReducer(loggedInState, clearUser())

        expect(state.isAuthenticated).toBe(false)
        expect(state.user).toBe(null)
        expect(state.isLoading).toBe(false)
    })
})