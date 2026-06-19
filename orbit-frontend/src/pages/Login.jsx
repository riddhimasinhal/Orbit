import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post(
        "http://13.239.47.56:5001/api/auth/login",
        formData,
      );
      console.log("Login Response:", response.data);

      localStorage.setItem("token", response.data.token);
      console.log("Stored Token:", localStorage.getItem("token"));
      toast.success("Login successful");

      const role = response.data.role;
      const onBoardingCompleted = response.data.onBoardingCompleted;
      console.log("Role:", role);

      if (onBoardingCompleted) {
        if (role === "creator") {
          navigate("/creator/dashboard");
        } else {
          navigate("/brand/dashboard");
        }
      } else {
        if (role === "creator") {
          navigate("/creator-onboarding");
        } else {
          console.log("Going to brand onboarding");
          navigate("/brand-onboarding");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      setError(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080c] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/30">
            <Sparkles className="size-4 text-violet-300" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            Orbit
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-zinc-400">Password</label>
                <a
                  href="#"
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                required
                className="bg-white/5 border-white/10 text-white"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-violet-600 text-white hover:bg-violet-500"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-violet-400 hover:text-violet-300"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
