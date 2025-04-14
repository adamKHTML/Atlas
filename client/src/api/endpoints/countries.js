import { apiSlice } from '../apiSlice';

export const countriesApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAllCountries: builder.query({
            query: () => ({
                url: '/countries',
                method: 'GET',
            }),
            providesTags: ['Countries'],
        }),

        getCountryById: builder.query({
            query: (id) => `/countries/${id}`,
            providesTags: (result, error, id) => [{ type: 'Countries', id }],
        }),
    }),
});

export const {
    useGetAllCountriesQuery,
    useGetCountryByIdQuery,
} = countriesApi;
