import { baseApi } from "../baseApi";

export const StockMovement = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getStockMovementDetails: builder.query({
      query: ({ fromDate, toDate, page, limit, search }) => ({
        url: "stock-movements",
        method: "GET",
        params: { fromDate, toDate, page, limit, search },
      }),
      providesTags: ["Stocks"],
    }),
    getSaleStockMovementDetails: builder.query({
      query: ({ fromDate, toDate, page, limit, search }) => ({
        url: "stock-movements/orders",
        method: "GET",
        params: { fromDate, toDate, page, limit, search },
      }),
      providesTags: ["Stocks"],
    }),
    getSaleStockConsumption: builder.query({
      query: ({ fromDate, toDate }) => ({
        url: "stock-movements/consumption",
        method: "GET",
        params: { fromDate, toDate },
      }),
      providesTags: ["Stocks"],
    }),

    createStockMovement: builder.mutation({
      query: ({ ingredientMasterId, quantity, reason, purchasePricePerUnit, unitId }) => ({
        url: "stock-movements",
        method: "POST",
        body: { ingredientMasterId, quantity, reason, purchasePricePerUnit, unitId },
      }),
      invalidatesTags: ["Stocks"],
    }),



  }),
});

export const {
  useGetStockMovementDetailsQuery,
  useCreateStockMovementMutation,
  useGetSaleStockMovementDetailsQuery,
  useGetSaleStockConsumptionQuery
} = StockMovement;