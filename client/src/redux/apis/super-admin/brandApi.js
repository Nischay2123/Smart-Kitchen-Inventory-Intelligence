import { baseApi } from "../baseApi";

export const brands = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // -------- TENANTS --------
    getAllTenants: builder.query({
      query: () => ({
        url: "tenants",
        method: "GET",
      }),
      providesTags: ["Tenants"],
    }),

    createBrand: builder.mutation({
      query: ({ name }) => ({
        url: "tenants",
        method: "POST",
        body: { name },
      }),
      invalidatesTags: ["Tenants"],
    }),

    deleteBrand: builder.mutation({
      query: ({ tenantId }) => ({
        url: `tenants/${tenantId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tenants"],
    }),

    // -------- BRAND MANAGERS --------
    getAllBrandManagers: builder.query({
      query: ({ tenantId } = {}) => ({
        url: "users/brand-managers",
        method: "GET",
        params: tenantId ? { tenantId } : undefined,
      }),
      providesTags: ["BrandManagers"],
    }),

    createBrandManager: builder.mutation({
      query: ({ userName, email, password, tenantId, tenantName }) => ({
        url: "users/brand-managers",
        method: "POST",
        body: {
          userName,
          email,
          password,
          tenantId,
        },
      }),
      invalidatesTags: ["BrandManagers"],
    }),
    sendOtp: builder.mutation({
      query: ({ email }) => ({
        url: "users/auth/signup/otp",
        method: "POST",
        body: {
          email,
        },
      }),
    }),
    verifyOtp: builder.mutation({
      query: ({ email, otp }) => ({
        url: "users/auth/signup/verify",
        method: "POST",
        body: {
          email,
          otp
        },
      }),
    }),

    deleteBrandManager: builder.mutation({
      query: ({ managerId }) => ({
        url: `users/brand-managers/${managerId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BrandManagers"],
    }),

  }),
});

export const {
  useGetAllTenantsQuery,
  useCreateBrandMutation,
  useDeleteBrandMutation,

  useGetAllBrandManagersQuery,
  useCreateBrandManagerMutation,
  useDeleteBrandManagerMutation,
  useSendOtpMutation,
  useVerifyOtpMutation
} = brands;
