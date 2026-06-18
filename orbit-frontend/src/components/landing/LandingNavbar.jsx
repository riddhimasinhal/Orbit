import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";

export function LandingNavbar() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "border-b border-white/10 bg-[#08080c]/80 backdrop-blur-xl" : "bg-transparent"}`}>
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">

                <Link to="/" className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/30">
                        <Sparkles className="size-4 text-violet-300" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-white">Orbit</span>
                </Link>

                <nav className="hidden items-center gap-8 md:flex">
                    <a href="#features" className="text-sm text-zinc-400 hover:text-white">Features</a>
                    <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-white">How It Works</a>
                    <a href="#for-creators" className="text-sm text-zinc-400 hover:text-white">For Creators</a>
                    <a href="#for-brands" className="text-sm text-zinc-400 hover:text-white">For Brands</a>
                </nav>

                <div className="hidden items-center gap-3 md:flex">
                    <Button variant="ghost" className="text-zinc-300 hover:bg-white/5 hover:text-white" onClick={() => navigate("/login")}>
                        Log in
                    </Button>
                    <Button className="bg-violet-600 text-white hover:bg-violet-500" onClick={() => navigate("/signup")}>
                        Get Started
                    </Button>
                </div>

                <button className="md:hidden text-zinc-300" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
            </div>

            {mobileOpen && (
                <div className="border-t border-white/10 bg-[#08080c]/95 px-4 py-4 backdrop-blur-xl md:hidden">
                    <div className="flex flex-col gap-3">
                        <a href="#features" className="text-sm text-zinc-400 hover:text-white" onClick={() => setMobileOpen(false)}>Features</a>
                        <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-white" onClick={() => setMobileOpen(false)}>How It Works</a>
                        <a href="#for-creators" className="text-sm text-zinc-400 hover:text-white" onClick={() => setMobileOpen(false)}>For Creators</a>
                        <a href="#for-brands" className="text-sm text-zinc-400 hover:text-white" onClick={() => setMobileOpen(false)}>For Brands</a>
                        <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-4">
                            <Button variant="outline" onClick={() => navigate("/login")}>Log in</Button>
                            <Button className="bg-violet-600 hover:bg-violet-500" onClick={() => navigate("/signup")}>Get Started</Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
