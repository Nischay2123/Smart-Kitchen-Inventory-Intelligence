import { baseApi } from "../baseApi";

export const ingredient = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getStockDetails: builder.query({
      query: ({ page, limit, search, alertState }) => ({
        url: "stocks",
        method: "GET",
        params: { page, limit, search, ...(alertState && { alertState }) }
      }),
      providesTags: ["Stocks"],
    }),

  }),
});

export const {
  useGetStockDetailsQuery
} = ingredient;