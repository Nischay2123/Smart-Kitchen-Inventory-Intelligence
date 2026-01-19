import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./apis/baseApi";
import stockSReducer from "./reducers/outlet-manager/stockSlice"

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    Stock:stockSReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      baseApi.middleware,
    ),
});

