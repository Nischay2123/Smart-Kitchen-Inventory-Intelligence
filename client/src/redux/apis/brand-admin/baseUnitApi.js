import { baseApi } from "../baseApi";

export const baseUnit = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getAllUnits: builder.query({
      query: () => ({
        url: "units/get_all_unit",
        method: "GET",
      }),
      providesTags: ["BaseUnit"],
    }),

    createUnit: builder.mutation({
      query: ({ unit, baseUnit, conversionRate }) => ({
        url: "units/create_unit",
        method: "POST",
        body: { unit, baseUnit, conversionRate },
      }),
      invalidatesTags: ["BaseUnit"],
    }),


  }),
});

export const {
  useCreateUnitMutation,
  useGetAllUnitsQuery,
} = baseUnit;