import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const footerLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "Contact", href: "#" },
];

export function LandingFooter() {
    return (
        <footer className="border-t border-white/10 py-12">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/30">
                            <Sparkles className="size-3.5 text-violet-300" />
                        </div>
                        <span className="font-semibold text-white">Orbit</span>
                    </Link>

                    <nav className="flex flex-wrap items-center justify-center gap-6">
                        {footerLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <p className="text-sm text-zinc-600">
                        © {new Date().getFullYear()} Orbit. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
