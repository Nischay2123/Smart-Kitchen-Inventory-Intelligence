import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  list: [],          // array of stock rows
  loading: false,
  error: null,
};

const stocksSlice = createSlice({
  name: "stocks",
  initialState,
  reducers: {
    // 🔹 Set initial stock list (REST)
    setStocks: (state, action) => {
      state.list = action.payload;
      state.loading = false;
      state.error = null;
    },

    // 🔹 Real-time update from socket
    updateStockInStore: (state, action) => {
      const incoming = action.payload;

      const index = state.list.findIndex(
        (s) => s.ingredientId === incoming.ingredientId
      );

      if (index !== -1) {
        state.list[index] = {
          ...state.list[index],
          ...incoming,
        };
      } else {
        // Edge case: stock initialized later
        state.list.unshift(incoming);
      }
    },

    // 🔹 Optional helpers
    setStocksLoading: (state) => {
      state.loading = true;
    },

    setStocksError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    clearStocks: () => initialState,
  },
});

export const {
  setStocks,
  updateStockInStore,
  setStocksLoading,
  setStocksError,
  clearStocks,
} = stocksSlice.actions;

export default stocksSlice.reducer;
