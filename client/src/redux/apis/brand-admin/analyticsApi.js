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
        params:{fromDate:from,toDate:to},
      }),
    }),

    getMenuMatrixData: builder.query({
      query: ({ from, to }) => ({
        url: "analytics/get_menu_matrix",
        method: "GET",
        params:{fromDate:from,toDate:to},
      }),
    }),
    getMenuItemData: builder.query({
      query: ({ from, to ,outletId}) => ({
        url: "analytics/get_profit_data",
        method: "GET",
        params:{fromDate:from,toDate:to,outletId},
      }),
    }),


  }),
});

export const {
  useGetAllOutletsQuery,
  useGetDeploymentDataQuery,
  useGetMenuMatrixDataQuery,
  useGetMenuItemDataQuery
} = Analytics;