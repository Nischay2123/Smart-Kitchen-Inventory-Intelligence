import { useAuth } from "@/auth/auth";
import { LoginForm } from "@/components/login/login-form";
import WelcomeHeader from "@/components/login/welcome-card";
import { useLoginMutation } from "@/redux/apis/userApi";

const Login = () => {
  const [loginApi] = useLoginMutation();
  const { setUser } = useAuth();

  const handleLogin = async ({ email, password }) => {
    try {
      const res = await loginApi({ email, password }).unwrap();
      // //console.log(res?.data?.user);
      const user = JSON.stringify(res?.data?.user)
      window.localStorage.setItem("user",user)
      setUser(res?.data?.user);

    } catch (err) {
      console.error("Login failed", err);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center">
      
      <WelcomeHeader />

      <LoginForm className="min-w-[85%] sm:min-w-[60%] lg:min-w-[30%]" handleLogin={handleLogin}/>

    </div>
  );
};

export default Login;
