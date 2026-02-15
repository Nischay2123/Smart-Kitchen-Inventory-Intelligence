import { baseApi } from "../baseApi";

export const ingredient = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getAllIngredients: builder.query({
      query: ({ page, limit, search }) => ({
        url: "ingredients",
        method: "GET",
        params: { page, limit, search }
      }),
      providesTags: ["Ingredient"],
    }),
    getAllIngredientsInOnce: builder.query({
      query: () => ({
        url: "ingredients/all",
        method: "GET",
      }),
      providesTags: ["Ingredient"],
    }),

    createIngredients: builder.mutation({
      query: ({ name, unitIds, threshold }) => ({
        url: "ingredients",
        method: "POST",
        body: { name, unitIds, threshold },
      }),
      invalidatesTags: ["Ingredient"],
    }),

    createIngredientsBulk: builder.mutation({
      query: (ingredients) => ({
        url: "ingredients/bulk",
        method: "POST",
        body: ingredients,
      }),
      invalidatesTags: ["Ingredient"],
    }),

    deleteIngredient: builder.mutation({
      query: ({ ingredientId }) => ({
        url: `ingredients/${ingredientId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Ingredient"],
    }),

  }),
});

export const {
  useCreateIngredientsMutation,
  useCreateIngredientsBulkMutation,
  useDeleteIngredientMutation,
  useGetAllIngredientsQuery,
  useGetAllIngredientsInOnceQuery
} = ingredient;