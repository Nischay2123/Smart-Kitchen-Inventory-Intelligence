import { baseApi } from "../baseApi";

export const ingredient = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getAllIngredients: builder.query({
      query: () => ({
        url: "ingredient/get_all_ingredient",
        method: "GET",
      }),
      providesTags: ["Ingredient"],
    }),

    createIngredients: builder.mutation({
      query: ({ name, unitIds ,threshold}) => ({
        url: "ingredient/create_ingredient",
        method: "POST",
        body: { name, unitIds, threshold },
      }),
      invalidatesTags: ["Ingredient"],
    }),

    deleteIngredient: builder.mutation({
      query: ({ ingredientId }) => ({
        url: `ingredient/delete/${ingredientId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Ingredient"],
    }),

  }),
});

export const {
  useCreateIngredientsMutation,
  useDeleteIngredientMutation,
  useGetAllIngredientsQuery
} = ingredient;