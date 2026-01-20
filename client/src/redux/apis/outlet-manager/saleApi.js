import { baseApi } from "../baseApi";

export const Sale = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getSaleDetails: builder.query({
      query: () => ({
        url: "sales/get_sales",
        method: "GET",
      }),
      providesTags: ["Sale"],
    }),

  }),
});

export const {
  useGetSaleDetailsQuery
} = Sale;