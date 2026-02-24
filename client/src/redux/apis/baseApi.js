import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "sonner";

const AUTH_ERRORS = [
  "Access token missing",
  "Invalid or expired access token",
];
const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:8000/api/v1/",
  credentials: "include",
})
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: async (args, api, extraOption) => {

    // console.log("args apis", args, api, extraOption)
    const result = await baseQuery(args, api, extraOption)
    if (result.error?.status === 401) {
      const message = result.error?.data?.message;

      if (AUTH_ERRORS.includes(message)) {
        localStorage.removeItem("user");
        api.dispatch(baseApi.util.resetApiState());
        window.location.replace("/");
      }
    }

    if (result.error?.status === 429) {
      const message =
        result.error?.data?.message || "Too many requests. Please slow down.";
      toast.error(message, {
        duration: 5000,
      });
    }

    return result;

  },
  endpoints: () => ({

  }),
});
