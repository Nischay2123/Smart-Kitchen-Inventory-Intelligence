import { createContext, useEffect, useState } from "react";
import { useMeQuery } from "@/redux/apis/userApi";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const { data, isLoading } = useMeQuery(undefined, {
    skip: !user,
  });

  useEffect(() => {
    if (data?.data) {
      setUser(data.data);
      localStorage.setItem("user", JSON.stringify(data.data));
    }
  }, [data]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

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
