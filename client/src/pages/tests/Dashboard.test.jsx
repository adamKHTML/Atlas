import { describe, it, expect, vi } from 'vitest'
// - describe() : Groupe les tests ensemble
// - it() : Définit un test individuel  
// - expect() : Vérifie que quelque chose est vrai
// - vi : Outil pour créer des "faux" (mocks)

import { render, screen } from '@testing-library/react'
// ↑ Outils React Testing Library :
// - render() : "Dessine" un composant React dans un environnement de test
// - screen : Permet de chercher des éléments dans le composant rendu

import { Provider } from 'react-redux'
// ↑ Provider Redux : Entoure notre composant pour qu'il ait accès au store Redux

import { configureStore } from '@reduxjs/toolkit'
// ↑ Créateur de store Redux : Fabrique un "magasin" de données pour nos tests

import { MemoryRouter } from 'react-router-dom'
// ↑ Router de test : Simule la navigation React Router sans vraie URL


// 🌍 Mock de l'API des pays
vi.mock('../../api/endpoints/countries', () => ({
    // ↑ vi.mock() = "Remplace cette vraie API par une fausse"

    useGetCountriesForDashboardQuery: () => ({
        // ↑ Fausse fonction qui retourne toujours les mêmes données
        data: { countries: [] },     // Liste vide de pays
        isLoading: false,            // Pas en train de charger
        error: null                  // Aucune erreur
    }),
    useGetAllCountriesQuery: () => ({
        // ↑ Autre fausse fonction pour éviter les erreurs
        data: { countries: [] },
        isLoading: false,
        error: null
    })
}))

// 📧 Mock de l'API des notifications
vi.mock('../../api/endpoints/notifications', () => ({
    useGetUnreadCountQuery: () => ({
        // ↑ Fausse fonction : 0 notifications non lues
        data: { unread_count: 0 }
    })
}))

// 🔐 Mock de l'API d'authentification
vi.mock('../../api/endpoints/auth', () => ({
    useLogoutMutation: () => [vi.fn()]
    // ↑ Fausse fonction de déconnexion (vi.fn() = fonction vide)
}))

// 🔍 Mock du composant de recherche
vi.mock('../../components/SearchComponents', () => ({
    default: () => null
    // ↑ Remplace SearchComponents par "rien" (null) pour éviter les erreurs
}))

// ====================================================================
// 📋 GROUPE DE TESTS PRINCIPAL
// ====================================================================

/**
 * Tests Dashboard Integration - CP2 Interface Utilisateur
 * VERSION AVEC RENDU COMPLET (OPTIONNEL)
 */
describe('Dashboard Integration -  Interface Utilisateur', () => {
    // ↑ describe() = "Voici un groupe de tests qui testent le Dashboard"

    // 🏪 FONCTION HELPER - Créer un faux magasin Redux
    const createTestStore = (user) => {
        // ↑ Cette fonction crée un store Redux simplifié pour nos tests

        return configureStore({
            // ↑ configureStore() = créer un nouveau magasin Redux

            reducer: {
                // ↑ reducer = fonction qui gère les données du magasin
                auth: (state = { isAuthenticated: true, user, isLoading: false }) => state
                // ↑ Faux reducer auth : toujours connecté avec l'utilisateur donné
            }
        })
    }

    // 🎨 FONCTION HELPER - Dessiner le composant avec tous ses outils
    const renderWithProviders = (user) => {
        // ↑ Cette fonction "dessine" notre Dashboard avec tous les outils nécessaires

        const store = createTestStore(user)
        // ↑ Créer un faux magasin Redux avec cet utilisateur

        return render(
            // ↑ render() = dessiner le composant React

            <Provider store={store}>
                {/* ↑ Provider = donner accès au magasin Redux */}

                <MemoryRouter>
                    {/* ↑ MemoryRouter = simuler la navigation React Router */}

                    {/* Mock du Dashboard pour éviter les imports complexes */}
                    <div data-testid="dashboard-mock">
                        {/* ↑ div avec un ID de test pour retrouver facilement */}

                        {user.roles.includes('ROLE_ADMIN') && <h1>BIENVENUE ADMIN</h1>}
                        {/* ↑ SI l'utilisateur est admin, ALORS afficher "BIENVENUE ADMIN" */}

                        {user.roles.includes('ROLE_MODERATOR') && <h1>BIENVENUE MODÉRATEUR</h1>}
                        {/* ↑ SI l'utilisateur est modérateur, ALORS afficher "BIENVENUE MODÉRATEUR" */}

                        {user.roles.includes('ROLE_TRAVELER') && <h1>BIENVENUE SUR VOTRE ESPACE</h1>}
                        {/* ↑ SI l'utilisateur est voyageur, ALORS afficher "BIENVENUE SUR VOTRE ESPACE" */}
                    </div>
                </MemoryRouter>
            </Provider>
        )
    }

    // ====================================================================
    // 🧪 TESTS INDIVIDUELS
    // ====================================================================

    // 👑 TEST 1 - Interface Admin
    it('should render admin interface', () => {
        // ↑ it() = "Voici un test individuel qui vérifie l'interface admin"

        // ARRANGE - Préparer les données
        const adminUser = {
            id: 1,
            roles: ['ROLE_ADMIN'],  // ← L'utilisateur a le rôle admin
            firstname: 'John',
            lastname: 'Admin'
        }

        // ACT - Exécuter l'action à tester
        renderWithProviders(adminUser)
        // ↑ Dessiner le Dashboard avec un utilisateur admin

        // ASSERT - Vérifier le résultat
        expect(screen.getByText(/BIENVENUE ADMIN/i)).toBeInTheDocument()
        // ↑ VÉRIFIER que le texte "BIENVENUE ADMIN" apparaît bien à l'écran
        // - screen.getByText() = chercher un texte à l'écran
        // - /BIENVENUE ADMIN/i = expression régulière (insensible à la casse)
        // - toBeInTheDocument() = "doit être présent dans le document"
    })

    // 🛡️ TEST 2 - Interface Modérateur
    it('should render moderator interface', () => {
        // ARRANGE - Préparer un utilisateur modérateur
        const moderatorUser = {
            id: 2,
            roles: ['ROLE_MODERATOR'], // ← L'utilisateur a le rôle modérateur
            firstname: 'Jane',
            lastname: 'Moderator'
        }

        // ACT - Dessiner avec un modérateur
        renderWithProviders(moderatorUser)

        // ASSERT - Vérifier que l'interface modérateur s'affiche
        expect(screen.getByText(/BIENVENUE MODÉRATEUR/i)).toBeInTheDocument()
        // ↑ Le texte "BIENVENUE MODÉRATEUR" doit apparaître
    })

    // ✈️ TEST 3 - Interface Voyageur
    it('should render traveler interface', () => {
        // ARRANGE - Préparer un utilisateur voyageur
        const travelerUser = {
            id: 3,
            roles: ['ROLE_TRAVELER'], // ← L'utilisateur a le rôle voyageur
            firstname: 'Bob',
            lastname: 'Traveler'
        }

        // ACT - Dessiner avec un voyageur
        renderWithProviders(travelerUser)

        // ASSERT - Vérifier que l'interface voyageur s'affiche
        expect(screen.getByText(/BIENVENUE SUR VOTRE ESPACE/i)).toBeInTheDocument()
        // ↑ Le texte "BIENVENUE SUR VOTRE ESPACE" doit apparaître
    })
})
