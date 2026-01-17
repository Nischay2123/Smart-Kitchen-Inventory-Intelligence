import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    login: builder.mutation({
      query: ({ email, password }) => ({
        url: "users/login",
        method: "POST",
        body: {
          email,
          password,
        },
      }),
    }),
    me: builder.query({
      query: () => ({
        url: "users/me",
        method: "GET",
      }),
    }),

    logout: builder.mutation({
      query: () => ({
        url: "users/logout",
        method: "POST",
      }),
    }),
    
  }),
});

export const {
  useLoginMutation,
  useMeQuery,
  useLogoutMutation
} = authApi;
