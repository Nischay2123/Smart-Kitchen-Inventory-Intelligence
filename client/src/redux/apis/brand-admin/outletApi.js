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
      query: ({ userName, email, password}) => ({
        url: "users/create_outlet_manager",
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
      query: ({ email,outletId }) => ({
        url: "users/genrate_otp_outlet",
        method: "POST",
        body: {
          email,outletId
        },
      }),
    }),
    verifyOtpOutlet: builder.mutation({
      query: ({email,otp }) => ({
        url: "users/verify_otp_outlet",
        method: "POST",
        body: {
          email,
          otp
        },
      }),
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
  useVerifyOtpOutletMutation,
  useSendOtpOutletMutation
} = outlets;
