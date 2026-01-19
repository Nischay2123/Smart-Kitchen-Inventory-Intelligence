import { baseApi } from "../baseApi";

export const StockMovement = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getStockMovementDetails: builder.query({
      query: () => ({
        url: "stockMovements/get_stock_movements",
        method: "GET",
      }),
      providesTags: ["Stocks"],
    }),

    createStockMovement: builder.mutation({
      query: ({ ingredientMasterId, quantity,reason,purchasePrice }) => ({
        url: "stockMovements/create_stock_movement",
        method: "POST",
        body: { ingredientMasterId, quantity, reason, purchasePrice },
      }),
      invalidatesTags: ["Stocks"],
    }),

  }),
});

export const {
  useGetStockMovementDetailsQuery,
  useCreateStockMovementMutation
} = StockMovement;