import { createContext, useEffect, useState } from "react";
import { useMeQuery } from "@/redux/apis/userApi";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);

  const storedUser = localStorage.getItem("user");

  const { data, isLoading } = useMeQuery(undefined, {
    skip: !storedUser,
  });

  useEffect(() => {
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      return;
    }

    if (data?.data) {
      setUser(data.data);
      localStorage.setItem("user", JSON.stringify(data.data));
    }
  }, [data, storedUser]);

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
