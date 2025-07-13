import { apiSlice } from '../../apiSlice';

export const adminGestionUserApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Obtenir tous les utilisateurs pour la gestion (Admin/Modérateur)
        getAllUsers: builder.query({
            query: ({ page = 1, limit = 20, role = null, status = null, search = null } = {}) => ({
                url: `/api/admin/users?page=${page}&limit=${limit}${role ? `&role=${role}` : ''}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`,
                method: 'GET'
            }),
            providesTags: ['AdminUser']
        }),

        // Statistiques utilisateurs pour admin
        getUsersStats: builder.query({
            query: () => ({
                url: '/api/admin/users/stats',
                method: 'GET'
            }),
            providesTags: ['UserStats']
        }),

        // Bannir un utilisateur (Admin/Modérateur)
        banUser: builder.mutation({
            query: (banData) => ({
                url: `/api/admin/users/${banData.userId}/ban`,
                method: 'POST',
                body: {
                    duration: banData.duration,
                    reason: banData.reason,
                    notify: banData.notify || true
                }
            }),
            invalidatesTags: ['AdminUser', 'Notification']
        }),

        // Débannir un utilisateur (Admin/Modérateur)
        unbanUser: builder.mutation({
            query: (userId) => ({
                url: `/api/admin/users/${userId}/unban`,
                method: 'DELETE'
            }),
            invalidatesTags: ['AdminUser', 'Notification']
        }),

        // Changer le rôle d'un utilisateur (Admin uniquement)
        changeUserRole: builder.mutation({
            query: (roleData) => ({
                url: `/api/admin/users/${roleData.userId}/role`,
                method: 'PUT',
                body: {
                    new_role: roleData.newRole,
                    notify: roleData.notify || true
                }
            }),
            invalidatesTags: ['AdminUser', 'Notification']
        }),

        // Obtenir l'historique des bans d'un utilisateur
        getUserBanHistory: builder.query({
            query: (userId) => ({
                url: `/api/admin/users/${userId}/ban-history`,
                method: 'GET'
            }),
            providesTags: ['UserBanHistory']
        }),

        // Obtenir les détails d'un utilisateur pour admin
        getUserDetails: builder.query({
            query: (userId) => ({
                url: `/api/admin/users/${userId}`,
                method: 'GET'
            }),
            providesTags: ['UserDetails']
        }),

        // Créer notification système pour un utilisateur spécifique
        createSystemNotification: builder.mutation({
            query: (systemData) => ({
                url: '/api/admin/notifications/system',
                method: 'POST',
                body: {
                    recipient_id: systemData.recipient_id,
                    content_notification: systemData.content_notification
                }
            }),
            invalidatesTags: ['Notification']
        }),

        // Envoyer notification en masse (Admin uniquement)
        createBulkNotification: builder.mutation({
            query: (bulkData) => ({
                url: '/api/admin/notifications/bulk',
                method: 'POST',
                body: {
                    content_notification: bulkData.content_notification,
                    target_roles: bulkData.target_roles || ['ROLE_USER']
                }
            }),
            invalidatesTags: ['Notification']
        }),

        // Supprimer un utilisateur (Admin uniquement)
        deleteUser: builder.mutation({
            query: (userId) => ({
                url: `/api/admin/users/${userId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['AdminUser']
        }),

        // Rechercher des utilisateurs
        searchUsers: builder.query({
            query: (searchTerm) => ({
                url: `/api/admin/users/search?q=${encodeURIComponent(searchTerm)}`,
                method: 'GET'
            }),
            providesTags: ['UserSearch']
        }),

        // Liste simple des utilisateurs (similaire à getUsersList)
        getUsersList: builder.query({
            query: () => ({
                url: '/api/admin/users/list',
                method: 'GET'
            }),
            providesTags: ['AdminUsersList']
        })
    })
});

export const {
    useGetAllUsersQuery,
    useGetUsersStatsQuery,
    useBanUserMutation,
    useUnbanUserMutation,
    useChangeUserRoleMutation,
    useGetUserBanHistoryQuery,
    useGetUserDetailsQuery,
    useCreateSystemNotificationMutation,
    useCreateBulkNotificationMutation,
    useDeleteUserMutation,
    useSearchUsersQuery,
    useGetUsersListQuery
} = adminGestionUserApi;