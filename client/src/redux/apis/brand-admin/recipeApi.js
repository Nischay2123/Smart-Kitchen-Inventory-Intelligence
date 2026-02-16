import { baseApi } from "../baseApi";

export const Recipes = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getRecipe: builder.query({
      query: ({ itemId }) => ({
        url: `recipes/${itemId}`,
        method: "GET",
      }),
      providesTags: ["Ingredient"],
    }),

    createRecipe: builder.mutation({
      query: ({ itemId, recipeItems }) => ({
        url: "recipes",
        method: "POST",
        body: { itemId, recipeItems },
      }),
      invalidatesTags: ["Ingredient"],
    }),

    createBulkRecipes: builder.mutation({
      query: (recipes) => ({
        url: "recipes/bulk",
        method: "POST",
        body: { recipes },
      }),
      invalidatesTags: ["Ingredient"],
    }),

  }),
});

export const {
  useCreateRecipeMutation,
  useGetRecipeQuery,
  useCreateBulkRecipesMutation
} = Recipes;