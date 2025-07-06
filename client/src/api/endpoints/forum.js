// src/api/endpoints/forum.js - VERSION SIMPLIFIÉE
import { apiSlice } from '../apiSlice';

export const forumApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // =============== DISCUSSIONS ===============

        // Get discussions for a country
        getCountryDiscussions: builder.query({
            query: ({ countryId, page = 1, limit = 15 }) => ({
                url: `/api/country/${countryId}/discussions`, // ✅ Route simplifiée
                method: 'GET',
                params: { page, limit }
            }),
            providesTags: (result, error, { countryId }) =>
                result
                    ? [
                        ...result.discussions.map(({ id }) => ({ type: 'Discussion', id })),
                        { type: 'Discussion', id: `COUNTRY_${countryId}` }
                    ]
                    : [{ type: 'Discussion', id: `COUNTRY_${countryId}` }],
        }),

        // Create new discussion
        createDiscussion: builder.mutation({
            query: ({ countryId, title, content }) => ({
                url: `/api/country/${countryId}/discussions`, // ✅ Route simplifiée
                method: 'POST',
                body: { title, content }
            }),
            invalidatesTags: (result, error, { countryId }) => [
                { type: 'Discussion', id: `COUNTRY_${countryId}` }
            ],
        }),

        // Get single discussion with messages
        getDiscussion: builder.query({
            query: ({ discussionId, page = 1, limit = 20 }) => ({
                url: `/api/discussions/${discussionId}`, // ✅ Route simplifiée
                method: 'GET',
                params: { page, limit }
            }),
            providesTags: (result, error, { discussionId }) =>
                result
                    ? [
                        { type: 'Discussion', id: discussionId },
                        ...result.messages.map(({ id }) => ({ type: 'Message', id })),
                        { type: 'Message', id: `DISCUSSION_${discussionId}` }
                    ]
                    : [{ type: 'Discussion', id: discussionId }],
        }),

        // =============== MESSAGES ===============

        // Add message to discussion
        addMessage: builder.mutation({
            query: ({ discussionId, content }) => ({
                url: `/api/discussions/${discussionId}/messages`, // ✅ Route simplifiée
                method: 'POST',
                body: { content }
            }),
            invalidatesTags: (result, error, { discussionId }) => [
                { type: 'Message', id: `DISCUSSION_${discussionId}` }
            ],
        }),

        // =============== REACTIONS ===============

        // React to message (like/dislike)
        reactToMessage: builder.mutation({
            query: ({ messageId, type }) => ({
                url: `/api/messages/${messageId}/react`, // ✅ Route simplifiée
                method: 'POST',
                body: { type }
            }),
        }),

        // Remove reaction from message
        unreactToMessage: builder.mutation({
            query: ({ messageId }) => ({
                url: `/api/messages/${messageId}/unreact`, // ✅ Route simplifiée
                method: 'DELETE'
            }),
        }),

        // Upload image for message
        uploadMessageImage: builder.mutation({
            query: (formData) => ({
                url: '/api/messages/upload-image',
                method: 'POST',
                body: formData,
            }),
        }),
    }),
});

export const {
    useGetCountryDiscussionsQuery,
    useCreateDiscussionMutation,
    useGetDiscussionQuery,
    useAddMessageMutation,
    useReactToMessageMutation,
    useUnreactToMessageMutation,
    useUploadMessageImageMutation,
} = forumApi;