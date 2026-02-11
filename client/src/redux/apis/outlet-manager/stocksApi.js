import { baseApi } from "../baseApi";

export const ingredient = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getStockDetails: builder.query({
      query: ({ page, limit, search }) => ({
        url: "stocks",
        method: "GET",
        params: { page, limit, search }
      }),
      providesTags: ["Stocks"],
    }),

  }),
});

export const {
  useGetStockDetailsQuery
} = ingredient;