import { baseApi } from "../baseApi";

export const Analytics = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getAllOutlets: builder.query({
      query: () => ({
        url: "analytics/get_outlets",
        method: "GET",
      }),
    }),

    getDeploymentData: builder.query({
      query: ({ from, to }) => ({
        url: "analytics/get_deployment_data",
        method: "GET",
        params: { fromDate: from, toDate: to },
      }),
    }),
    getLiveDeploymentData: builder.query({
      query: ({ from, to, outletIds }) => ({
        url: "analytics/get_deployment_data",
        method: "GET",
        params: { fromDate: from, toDate: to },
        body: { outletIds }
      }),
    }),
    getSnapshotDeploymentData: builder.mutation({
      query: ({ outletIds, from, to }) => ({
        url: "analytics/get_deployment_data",
        method: "POST",
        params: { fromDate: from, toDate: to },
        body: { outletIds },
      }),
    }),

    getLiveDeploymentData: builder.mutation({
      query: ({ outletIds }) => ({
        url: "analytics/get_deployment_data_live",
        method: "POST",
        body: { outletIds },
      }),
    }),

    getMenuItemData: builder.query({
      query: ({ from, to, outletId }) => ({
        url: "analytics/get_profit_data",
        method: "GET",
        params: { fromDate: from, toDate: to, outletId },
      }),
    }),
    getMenuMatrixData: builder.query({
      query: ({ from, to }) => ({
        url: "analytics/get_menu_matrix",
        method: "GET",
        params:{fromDate:from,toDate:to},
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