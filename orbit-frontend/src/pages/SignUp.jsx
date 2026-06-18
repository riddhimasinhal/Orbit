import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export default function SignupForm() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPass: "",
    });
    const [role, setRole] = useState(() =>
        searchParams.get("role") === "brand" ? "brand" : "creator"
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPass) {
            setError("Passwords do not match");
            return;
        }
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true)
        try {
            await axios.post("http://localhost:5001/api/auth/signup", {
                ...formData,
                role,
            });
            toast.success("Account created successfully");
            navigate("/login");
        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong")
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false)
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
                    <span className="text-lg font-semibold tracking-tight text-white">Orbit</span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-semibold text-white">Join Orbit</h1>
                        <p className="mt-1 text-sm text-zinc-500">Connect with brands and creators effortlessly</p>
                    </div>

                    {/* role tabs */}
                    <div className="flex mb-6 rounded-lg border border-white/10 bg-white/5 p-1">
                        <button
                            type="button"
                            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${role === "creator" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"}`}
                            onClick={() => setRole("creator")}
                        >
                            As a Creator
                        </button>
                        <button
                            type="button"
                            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${role === "brand" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"}`}
                            onClick={() => setRole("brand")}
                        >
                            As a Brand
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm text-zinc-400 mb-1.5 block">
                                {role === "brand" ? "Company Name" : "Username"}
                            </label>
                            <Input
                                type="text"
                                placeholder={role === "brand" ? "Your company" : "Your name"}
                                required
                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-sm text-zinc-400 mb-1.5 block">Email</label>
                            <Input
                                type="email"
                                placeholder="you@example.com"
                                required
                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm text-zinc-400 mb-1.5 block">Password</label>
                                <Input
                                    type="password"
                                    required
                                    className="bg-white/5 border-white/10 text-white"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-zinc-400 mb-1.5 block">Confirm</label>
                                <Input
                                    type="password"
                                    required
                                    className="bg-white/5 border-white/10 text-white"
                                    value={formData.confirmPass}
                                    onChange={(e) => setFormData({ ...formData, confirmPass: e.target.value })}
                                />
                            </div>
                        </div>

                        <p className="text-xs text-zinc-600">Must be at least 8 characters long.</p>

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <Button type="submit" className="w-full bg-violet-600 text-white hover:bg-violet-500" disabled={loading}>
                            {loading ? "Creating Account..." : "Create Account"}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-zinc-500">
                        Already have an account?{" "}
                        <Link to="/login" className="text-violet-400 hover:text-violet-300">Log in</Link>
                    </p>
                </div>

                <p className="mt-4 text-center text-xs text-zinc-600">
                    By signing up, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
