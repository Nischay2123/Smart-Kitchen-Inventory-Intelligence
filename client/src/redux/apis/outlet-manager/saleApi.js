import { baseApi } from "../baseApi";

export const Sale = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getSaleDetails: builder.query({
      query: ({fromDate,toDate}) => ({
        url: "sales/get_sales",
        method: "GET",
        params: { fromDate, toDate },
      }),
      providesTags: ["Sale"],
    }),

  }),
});

export const {
  useGetSaleDetailsQuery
} = Sale;