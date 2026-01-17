import { baseApi } from "../baseApi";

export const brands = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // -------- TENANTS --------
    getAllTenants: builder.query({
      query: () => ({
        url: "tenants/get_all_tenant",
        method: "GET",
      }),
      providesTags: ["Tenants"],
    }),

    createBrand: builder.mutation({
      query: ({ name }) => ({
        url: "tenants/create_tenant",
        method: "POST",
        body: { name },
      }),
      invalidatesTags: ["Tenants"],
    }),

    deleteBrand: builder.mutation({
      query: ({ tenantId }) => ({
        url: `tenants/delete/${tenantId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tenants"],
    }),

    // -------- BRAND MANAGERS --------
    getAllBrandManagers: builder.query({
      query: ({ tenantId } = {}) => ({
        url: "users/get_all_brand_manager",
        method: "GET",
        params: tenantId ? { tenantId } : undefined,
      }),
      providesTags: ["BrandManagers"],
    }),

    createBrandManager: builder.mutation({
      query: ({ userName, email, password, tenantId, tenantName }) => ({
        url: "users/create_brand_admin",
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

    deleteBrandManager: builder.mutation({
      query: ({ managerId }) => ({
        url: `users/delete_brand_manager/${managerId}`,
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
} = brands;
