import { baseApi } from "../baseApi";

export const posApiKeys = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getAllApiKeys: builder.query({
      query: ({ outletId } = {}) => ({
        url: "pos-api-keys",
        method: "GET",
        params: outletId ? { outletId } : undefined,
      }),
      providesTags: ["PosApiKeys"],
    }),

    generateApiKey: builder.mutation({
      query: ({ outletId }) => ({
        url: "pos-api-keys/generate",
        method: "POST",
        body: { outletId },
      }),
      invalidatesTags: ["PosApiKeys"],
    }),

    revokeApiKey: builder.mutation({
      query: ({ apiKeyId }) => ({
        url: `pos-api-keys/${apiKeyId}/revoke`,
        method: "POST",
      }),
      invalidatesTags: ["PosApiKeys"],
    }),

  }),
});

export const {
  useGetAllApiKeysQuery,
  useGenerateApiKeyMutation,
  useRevokeApiKeyMutation,
} = posApiKeys;
