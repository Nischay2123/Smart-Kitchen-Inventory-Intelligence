import { createContext, useEffect, useState } from "react";
import { useMeQuery } from "@/redux/apis/userApi";
import { setupInterceptors } from "@/api/interceptors";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(undefined);

  const { data, isLoading, error } = useMeQuery();
  
  useEffect(() => {
    const userFromLocalStorage = JSON.parse(localStorage.getItem("user"))
    if (userFromLocalStorage) {
      setUser(userFromLocalStorage)
      return
    }
    if (data?.data) {
      setUser(data.data);
    }
  }, [data]);

  useEffect(() => {
    setupInterceptors(() => {
      localStorage.removeItem("user")
      setUser(null);
    });
  }, []);


  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading: isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
