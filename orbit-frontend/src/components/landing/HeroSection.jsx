import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { HeroDashboardMockup } from "./HeroDashboardMockup";

export function HeroSection() {
    const navigate = useNavigate();

    return (
        <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28">
            {/* background glow */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
            </div>

            <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <p className="mb-6 inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
                        Creator × Brand collaboration platform
                    </p>
                    <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Where Creators Meet{" "}
                        <span className="text-violet-300">Opportunities.</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-400 sm:text-lg">
                        Orbit helps creators discover brand collaborations and enables brands to
                        find the perfect creators for impactful campaigns.
                    </p>
                    <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Button
                            size="lg"
                            className="h-12 min-w-[180px] bg-violet-600 px-8 text-white hover:bg-violet-500"
                            onClick={() => navigate("/signup")}
                        >
                            Join as Creator
                            <ArrowRight className="ml-2 size-4" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-12 min-w-[180px] border-white/15 bg-white/5 text-white hover:bg-white/10"
                            onClick={() => navigate("/signup?role=brand")}
                        >
                            Join as Brand
                        </Button>
                    </div>
                </div>

                <div className="mt-16 sm:mt-20">
                    <HeroDashboardMockup />
                </div>
            </div>
        </section>
    );
}
