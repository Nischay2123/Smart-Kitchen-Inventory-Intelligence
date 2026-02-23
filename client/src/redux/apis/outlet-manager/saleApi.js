import { baseApi } from "../baseApi";

export const Sale = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getSaleDetails: builder.query({
      query: ({ fromDate, toDate, page, limit, state }) => ({
        url: "sales",
        method: "GET",
        params: { fromDate, toDate, page, limit, ...(state && { state }) },
      }),
      providesTags: ["Sale"],
    }),

  }),
});

export const {
  useGetSaleDetailsQuery
} = Sale;