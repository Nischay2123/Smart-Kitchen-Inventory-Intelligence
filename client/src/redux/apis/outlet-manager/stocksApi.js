import { baseApi } from "../baseApi";

export const ingredient = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getStockDetails: builder.query({
      query: () => ({
        url: "stocks/get_stock_details",
        method: "GET",
      }),
      providesTags: ["Stocks"],
    }),

  }),
});

export const {
  useGetStockDetailsQuery
} = ingredient;