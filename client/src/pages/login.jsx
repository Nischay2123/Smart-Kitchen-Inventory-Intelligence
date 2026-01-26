import { useState } from "react";
import { useAuth } from "@/auth/auth";
import { LoginForm } from "@/components/login/login-form";
import WelcomeHeader from "@/components/login/welcome-card";
import { useLoginMutation } from "@/redux/apis/userApi";

const Login = () => {
  const [loginApi] = useLoginMutation();
  const { setUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    setError("");

    try {
      const res = await loginApi({ email, password }).unwrap();
      const user = res?.data?.user;

      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.error ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center">
      <WelcomeHeader />

      <LoginForm
        className="min-w-[85%] sm:min-w-[60%] lg:min-w-[30%]"
        handleLogin={handleLogin}
        loading={loading}
        error={error}
        clearError={() => setError("")}
      />
    </div>
  );
};

export default Login;
