import { baseApi } from "../baseApi";

export const Analytics = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getAllOutlets: builder.query({
      query: () => ({
        url: "analytics/outlets",
        method: "GET",
      }),
    }),

    getDeploymentData: builder.query({
      query: ({ from, to }) => ({
        url: "analytics/reports/deployment-snapshot",
        method: "GET",
        params: { fromDate: from, toDate: to },
      }),
    }),
    getLiveDeploymentData: builder.query({
      query: ({ from, to, outletIds }) => ({
        url: "analytics/reports/deployment-snapshot",
        method: "GET",
        params: { fromDate: from, toDate: to },
        body: { outletIds }
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
      query: ({ from, to }) => ({
        url: "analytics/menu-matrix",
        method: "GET",
        params: { fromDate: from, toDate: to },
      }),
    }),


  }),
});

export const {
  useGetAllOutletsQuery,
  useGetDeploymentDataQuery,
  useGetMenuMatrixDataQuery,
  useGetMenuItemDataQuery,
  useGetLiveDeploymentDataMutation,
  useGetSnapshotDeploymentDataMutation
} = Analytics;