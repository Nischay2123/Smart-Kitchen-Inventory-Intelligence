import { baseApi } from "../baseApi";

export const Analytics = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getAllOutlets: builder.query({
      query: () => ({
        url: "analytics/outlets",
        method: "GET",
      }),
    }),

    getSnapshotDeploymentData: builder.mutation({
      query: ({ outletIds, from, to }) => ({
        url: "analytics/reports/deployment-snapshot",
        method: "POST",
        params: { fromDate: from, toDate: to },
        body: { outletIds },
      }),
    }),

    getLiveDeploymentData: builder.mutation({
      query: ({ outletIds }) => ({
        url: "analytics/reports/deployment-live",
        method: "POST",
        body: { outletIds },
      }),
    }),

    getMenuItemData: builder.query({
      query: ({ from, to, outletId }) => ({
        url: "analytics/profit",
        method: "GET",
        params: { fromDate: from, toDate: to, outletId },
      }),
    }),
    getMenuMatrixData: builder.query({
      query: ({ from, to, outletId }) => ({
        url: "analytics/menu-matrix",
        method: "GET",
        params: { fromDate: from, toDate: to, outletId },
      }),
    }),
    getItemSnapshotData: builder.mutation({
      query: ({ outletId, from, to }) => ({
        url: "analytics/reports/item-snapshot",
        method: "POST",
        params: { fromDate: from, toDate: to },
        body: { outletId },
      }),
    }),

    getItemLiveData: builder.mutation({
      query: ({ outletId }) => ({
        url: "analytics/reports/item-live",
        method: "POST",
        body: { outletId },
      }),
    }),

  }),
});

export const {
  useGetAllOutletsQuery,
  useGetMenuMatrixDataQuery,
  useGetMenuItemDataQuery,
  useGetLiveDeploymentDataMutation,
  useGetSnapshotDeploymentDataMutation,
  useGetItemSnapshotDataMutation,
  useGetItemLiveDataMutation,
} = Analytics;