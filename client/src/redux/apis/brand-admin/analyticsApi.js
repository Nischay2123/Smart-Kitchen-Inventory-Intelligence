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

    // ── Data queries (range ≤ 30 days) ──────────────────────────────
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

    // ── Export mutations (range > 30 days) — dedicated POST endpoints
    requestMenuItemExport: builder.mutation({
      query: ({ from, to, outletId, email }) => ({
        url: "analytics/profit/export",
        method: "POST",
        body: { fromDate: from, toDate: to, outletId, email },
      }),
    }),

    requestMenuMatrixExport: builder.mutation({
      query: ({ from, to, email }) => ({
        url: "analytics/menu-matrix/export",
        method: "POST",
        body: { fromDate: from, toDate: to, email },
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
  useGetSnapshotDeploymentDataMutation,
  useRequestMenuItemExportMutation,
  useRequestMenuMatrixExportMutation,
} = Analytics;