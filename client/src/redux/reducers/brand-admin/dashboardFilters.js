import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  dateRange: {
    from: null,
    to: null,
  },
  outletId: null,
  isLive: false,
};

const dashboardFiltersSlice = createSlice({
  name: "dashboardFilters",
  initialState,
  reducers: {
    setDateRange(state, action) {
      state.dateRange = action.payload;
    },

    setOutletId(state, action) {
      state.outletId = action.payload;
    },

    setIsLive(state, action) {
      state.isLive = action.payload;
    },

    resetFilters() {
      return initialState;
    },

    hydrateFilters(state, action) {
      return { ...state, ...action.payload };
    },
  },
});

export const {
  setDateRange,
  setOutletId,
  setIsLive,
  resetFilters,
  hydrateFilters,
} = dashboardFiltersSlice.actions;

export default dashboardFiltersSlice.reducer;
