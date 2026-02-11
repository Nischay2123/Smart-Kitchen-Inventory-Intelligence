import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    login: builder.mutation({
      query: ({ email, password }) => ({
        url: "users/auth/login",
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
        url: "users/auth/logout",
        method: "POST",
      }),
    }),

    requestPasswordResetOTP: builder.mutation({
      query: (body) => ({
        url: "users/auth/forgot-password/request-otp",
        method: "POST",
        body,
      }),
    }),
    verifyPasswordResetOTP: builder.mutation({
      query: (body) => ({
        url: "users/auth/forgot-password/verify-otp",
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({
        url: "users/auth/forgot-password/reset",
        method: "POST",
        body,
      }),
    }),

  }),
});

export const {
  useLoginMutation,
  useMeQuery,
  useLogoutMutation,
  useRequestPasswordResetOTPMutation,
  useVerifyPasswordResetOTPMutation,
  useResetPasswordMutation
} = authApi;
