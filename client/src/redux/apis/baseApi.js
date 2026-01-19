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
    return result

  },
  endpoints: () => ({

  }),
});
