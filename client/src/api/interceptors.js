import { axiosBase } from "./axios";

export const setupInterceptors = (logoutFn) => {
  axiosBase.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const url = error?.config?.url;

      if (status === 401 && url?.includes("/users/me")) {
        logoutFn();
      }

      return Promise.reject(error);
    }
  );
};

