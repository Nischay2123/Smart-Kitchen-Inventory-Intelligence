import { baseApi } from "../baseApi";

export const outlets = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // -------- OUTLETS --------
    getAllOutlets: builder.query({
      query: () => ({
        url: "outlets/get_all_outlet",
        method: "GET",
      }),
      providesTags: ["Outlets"],
    }),

    createOutlet: builder.mutation({
      query: ({ outletName, address }) => ({
        url: "outlets/create_outlet",
        method: "POST",
        body: { outletName, address },
      }),
      invalidatesTags: ["Outlets"],
    }),

    deleteOutlet: builder.mutation({
      query: ({ outletId }) => ({
        url: `outlets/delete/${outletId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Outlets"],
    }),

    // -------- OUTLETS MANAGERS --------
    getAllOutletManagers: builder.query({
      query: ({ outletId } = {}) => ({
        url: "users/get_all_oulet_manager",
        method: "GET",
        params: outletId ? { outletId } : undefined,
      }),
      providesTags: ["OutletManagers"],
    }),

    createOutletManager: builder.mutation({
      query: ({ userName, email, password, outletId}) => ({
        url: "users/create_outlet_admin",
        method: "POST",
        body: {
          userName,
          email,
          password,
          outletId,
        },
      }),
      invalidatesTags: ["OutletManagers"],
    }),

    deleteOutletManager: builder.mutation({
      query: ({ managerId }) => ({
        url: `users/delete_outlet_manager/${managerId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["OutletManagers"],
    }),

  }),
});

export const {
  useDeleteOutletMutation,
  useCreateOutletMutation,
  useGetAllOutletsQuery,

  useGetAllOutletManagersQuery,
  useCreateOutletManagerMutation,
  useDeleteOutletManagerMutation,
} = outlets;
