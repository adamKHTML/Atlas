import { apiSlice } from '../../apiSlice';

export const adminNotificationsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Créer notification de bannissement (Admin/Modérateur)
        createBanNotification: builder.mutation({
            query: (banData) => ({
                url: '/notifications',
                method: 'POST',
                body: {
                    recipient_id: banData.recipient_id,
                    type_notification: 'ban',
                    ban_reason: banData.ban_reason
                }
            }),
            invalidatesTags: ['Notification']
        }),

        // Créer message système (Admin uniquement)
        createSystemNotification: builder.mutation({
            query: (systemData) => ({
                url: '/notifications',
                method: 'POST',
                body: {
                    recipient_id: systemData.recipient_id,
                    type_notification: 'system',
                    content_notification: systemData.content_notification
                }
            }),
            invalidatesTags: ['Notification']
        }),

        // Envoyer notification en masse (Admin uniquement)
        createBulkNotification: builder.mutation({
            query: (bulkData) => ({
                url: '/notifications/bulk',
                method: 'POST',
                body: bulkData
            }),
            invalidatesTags: ['Notification']
        }),

        // Obtenir toutes les notifications pour modération
        getAllNotifications: builder.query({
            query: ({ page = 1, limit = 20, type = null } = {}) => ({
                url: `/admin/notifications?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`,
                method: 'GET'
            }),
            providesTags: ['AdminNotification']
        }),

        // Statistiques notifications pour admin
        getNotificationsStats: builder.query({
            query: () => ({
                url: '/admin/notifications/stats',
                method: 'GET'
            }),
            providesTags: ['NotificationStats']
        }),

        // Supprimer notification (Admin uniquement)
        deleteNotification: builder.mutation({
            query: (notificationId) => ({
                url: `/admin/notifications/${notificationId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Notification', 'AdminNotification']
        })
    })
});

export const {
    useCreateBanNotificationMutation,
    useCreateSystemNotificationMutation,
    useCreateBulkNotificationMutation,
    useGetAllNotificationsQuery,
    useGetNotificationsStatsQuery,
    useDeleteNotificationMutation
} = adminNotificationsApi;