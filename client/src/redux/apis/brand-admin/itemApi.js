import { baseApi } from "../baseApi";

export const items = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // -------- Items --------
    getAllItems: builder.query({
      query: ({ page, limit, search }) => ({
        url: "menu-items",
        method: "GET",
        params: { page, limit, search }
      }),
      providesTags: ["Items"],
    }),

    createItem: builder.mutation({
      query: (items) => ({
        url: "menu-items",
        method: "POST",
        body: items,
      }),
      invalidatesTags: ["Items"],
    }),

    deleteItems: builder.mutation({
      query: ({ itemId }) => ({
        url: `menu-items/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Items"],
    }),

  }),
});

export const {
  useCreateItemMutation,
  useDeleteItemsMutation,
  useGetAllItemsQuery
} = items;