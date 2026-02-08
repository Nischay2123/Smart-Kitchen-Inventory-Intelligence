import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";


const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:8000/api/v1/",
  credentials: "include",
})
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: async (args, api, extraOption) => {

    // console.log("args apis", args, api, extraOption)
    const result = await baseQuery(args, api, extraOption)
    
    if (result.error?.status === 401 && (result.error?.data?.message=="Access token missing" || result.error?.data?.message=="Invalid or expired access token")) {
      localStorage.removeItem("user");

      api.dispatch(baseApi.util.resetApiState());

      window.location.href = "/";
    }
    return result

  },
  endpoints: () => ({

  }),
});
