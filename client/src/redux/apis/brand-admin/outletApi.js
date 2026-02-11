import { baseApi } from "../baseApi";

export const outlets = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // -------- OUTLETS --------
    getAllOutlets: builder.query({
      query: () => ({
        url: "outlets",
        method: "GET",
      }),
      providesTags: ["Outlets"],
    }),

    createOutlet: builder.mutation({
      query: ({ outletName, address }) => ({
        url: "outlets",
        method: "POST",
        body: { outletName, address },
      }),
      invalidatesTags: ["Outlets"],
    }),

    deleteOutlet: builder.mutation({
      query: ({ outletId }) => ({
        url: `outlets/${outletId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Outlets"],
    }),

    // -------- OUTLETS MANAGERS --------
    getAllOutletManagers: builder.query({
      query: ({ outletId } = {}) => ({
        url: "users/outlet-managers",
        method: "GET",
        params: outletId ? { outletId } : undefined,
      }),
      providesTags: ["OutletManagers"],
    }),

    createOutletManager: builder.mutation({
      query: ({ userName, email, password }) => ({
        url: "users/outlet-managers",
        method: "POST",
        body: {
          userName,
          email,
          password,
        },
      }),
      invalidatesTags: ["OutletManagers"],
    }),
    sendOtpOutlet: builder.mutation({
      query: ({ email, outletId }) => ({
        url: "users/auth/outlet-managers/otp",
        method: "POST",
        body: {
          email, outletId
        },
      }),
    }),
    verifyOtpOutlet: builder.mutation({
      query: ({ email, otp }) => ({
        url: "users/auth/outlet-managers/verify",
        method: "POST",
        body: {
          email,
          otp
        },
      }),
    }),

    deleteOutletManager: builder.mutation({
      query: ({ managerId }) => ({
        url: `users/outlet-managers/${managerId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["OutletManagers"],
    }),


    updatePermission: builder.mutation({
      query: ({ userId, permissions }) => ({
        url: `users/outlet-managers/${userId}/permissions`,
        method: "PUT",
        body: { permissions }
      }),
      invalidatesTags: ["OutletManagers"]
    })
  }),
});

export const {
  useDeleteOutletMutation,
  useCreateOutletMutation,
  useGetAllOutletsQuery,

  useGetAllOutletManagersQuery,
  useCreateOutletManagerMutation,
  useDeleteOutletManagerMutation,
  useVerifyOtpOutletMutation,
  useSendOtpOutletMutation,
  useUpdatePermissionMutation
} = outlets;
