import { apiSlice } from '../apiSlice';

export const notificationsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getNotifications: builder.query({
            query: ({ page = 1, limit = 10, message_type = 'received' } = {}) => ({
                url: `/api/notifications?page=${page}&limit=${limit}&message_type=${message_type}`,
                method: 'GET'
            }),
            providesTags: ['Notification']
        }),

        createNotification: builder.mutation({
            query: (notificationData) => ({
                url: '/api/notifications',
                method: 'POST',
                body: notificationData
            }),
            invalidatesTags: ['Notification']
        }),

        markAsRead: builder.mutation({
            query: (notificationId) => ({
                url: `/api/notifications/${notificationId}/read`,
                method: 'PUT'
            }),
            invalidatesTags: ['Notification']
        }),

        getUsersList: builder.query({
            query: () => ({
                url: '/api/notifications/users/list',
                method: 'GET'
            }),
            providesTags: ['User']
        }),

        getUnreadCount: builder.query({
            query: () => ({
                url: '/api/notifications/unread-count',
                method: 'GET'
            }),
            providesTags: ['Notification']
        }),

        // 🆕 Répondre à un message (créer une notification en réponse)
        replyToMessage: builder.mutation({
            query: ({ originalMessageId, recipientId, content }) => ({
                url: '/api/notifications',
                method: 'POST',
                body: {
                    recipient_id: recipientId,
                    type_notification: 'message',
                    content_notification: `📝 Réponse: ${content}`,
                    reply_to: originalMessageId
                }
            }),
            invalidatesTags: ['Notification']
        }),

        // 🆕 Supprimer une notification
        deleteNotification: builder.mutation({
            query: (notificationId) => ({
                url: `/api/notifications/${notificationId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Notification']
        })
    })
});

export const {
    useGetNotificationsQuery,
    useCreateNotificationMutation,
    useMarkAsReadMutation,
    useGetUsersListQuery,
    useGetUnreadCountQuery,
    useReplyToMessageMutation,
    useDeleteNotificationMutation
} = notificationsApi;