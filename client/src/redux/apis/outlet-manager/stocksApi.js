import { baseApi } from "../baseApi";

export const ingredient = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getStockDetails: builder.query({
      query: ({page, limit}) => ({
        url: "stocks/get_stock_details",
        method: "GET",
        params:{page,limit}
      }),
      providesTags: ["Stocks"],
    }),

  }),
});

export const {
  useGetStockDetailsQuery
} = ingredient;