import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./apis/baseApi";
import stockSReducer from "./reducers/outlet-manager/stockSlice"
import dashboardFiltersReducer from "./reducers/brand-admin/dashboardFilters"

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    dashboardFilters: dashboardFiltersReducer,
    Stock:stockSReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      baseApi.middleware,
    ),
});

