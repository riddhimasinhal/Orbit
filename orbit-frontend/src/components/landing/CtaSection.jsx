import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
    const navigate = useNavigate();

    return (
        <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center backdrop-blur-sm sm:px-12 sm:py-20">
                    <div className="pointer-events-none absolute inset-0 bg-violet-600/5" />
                    <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />

                    <div className="relative">
                        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                            Ready to grow with Orbit?
                        </h2>
                        <p className="mx-auto mt-4 max-w-lg text-zinc-500">
                            Join thousands of creators and brands building meaningful collaborations
                            on the platform built for modern partnerships.
                        </p>
                        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Button
                                size="lg"
                                className="h-12 min-w-[180px] bg-violet-600 text-white hover:bg-violet-500"
                                onClick={() => navigate("/signup")}
                            >
                                Start as Creator
                                <ArrowRight className="ml-2 size-4" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-12 min-w-[180px] border-white/15 bg-white/5 text-white hover:bg-white/10"
                                onClick={() => navigate("/signup?role=brand")}
                            >
                                Start as Brand
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
