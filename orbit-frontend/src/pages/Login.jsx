import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export function LoginForm({ className, ...props }) {
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData,
      );
      console.log("Login Response:", response.data);

      localStorage.setItem("token", response.data.token);
      console.log("Stored Token:", localStorage.getItem("token"));

      const role = response.data.role; //  comes from backend
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
      setError(error.response?.data?.message || "Something went wrong");
    }
  };
  return (
    <div
      className={cn(
        "min-h-screen flex flex-col items-center justify-center gap-6",
        className,
      )}
      {...props}
    >
      <div className=" dark w-full  max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        password: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <Button type="submit" onClick={handleLogin}>
                    Login
                  </Button>
                  <Button variant="outline" type="button">
                    Login with Google
                  </Button>
                  <FieldDescription className="text-center">
                    Don&apos;t have an account?{" "}
                    <Link
                      to="/signup"
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      Sign up
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LoginForm;
