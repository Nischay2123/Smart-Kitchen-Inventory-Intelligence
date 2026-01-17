import { baseApi } from "../baseApi";

export const Recipes = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getRecipe: builder.query({
      query: ({itemId}) => ({
        url: `recipes/get_recipe/${itemId}`,
        method: "GET",
      }),
      providesTags: ["Ingredient"],
    }),

    createRecipe: builder.mutation({
      query: ({ itemId, recipeItems }) => ({
        url: "recipes/recipe",
        method: "POST",
        body: { itemId, recipeItems },
      }),
      invalidatesTags: ["Ingredient"],
    }),

  }),
});

export const {
  useCreateRecipeMutation,
  useGetRecipeQuery
} = Recipes;