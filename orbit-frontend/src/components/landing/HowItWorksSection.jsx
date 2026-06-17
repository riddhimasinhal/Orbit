import { UserCircle, Briefcase } from "lucide-react";

const creatorSteps = [
    { step: "01", title: "Create Profile", description: "Set up your creator profile with portfolio and metrics." },
    { step: "02", title: "Discover Campaigns", description: "Browse and apply to campaigns that fit your brand." },
    { step: "03", title: "Get Collaborations", description: "Land deals and deliver content that drives results." },
];

const brandSteps = [
    { step: "01", title: "Create Campaign", description: "Define your goals, budget, and creative brief." },
    { step: "02", title: "Find Creators", description: "Discover creators who align with your audience." },
    { step: "03", title: "Launch Campaigns", description: "Go live and manage collaborations end to end." },
];

function Timeline({ steps, accent }) {
    return (
        <div className="relative">
            <div className="absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-violet-500/50 via-violet-500/20 to-transparent sm:left-6 md:block" />
            <div className="space-y-8">
                {steps.map((item, i) => (
                    <div key={item.step} className="relative flex gap-6 md:gap-8">
                        <div
                            className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold sm:size-12 sm:text-sm ${accent}`}
                        >
                            {item.step}
                        </div>
                        <div className="pb-2 pt-1">
                            <h4 className="text-base font-semibold text-white sm:text-lg">{item.title}</h4>
                            <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
                            {i < steps.length - 1 && (
                                <div className="mt-4 h-px w-full bg-white/5 md:hidden" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function HowItWorksSection() {
    return (
        <section id="how-it-works" className="scroll-mt-20 border-y border-white/5 bg-white/[0.02] py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto mb-16 max-w-2xl text-center">
                    <p className="mb-3 text-sm font-medium text-violet-400">How Orbit Works</p>
                    <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                        From signup to collaboration
                    </h2>
                    <p className="mt-4 text-zinc-500">
                        A streamlined workflow designed for both sides of every partnership.
                    </p>
                </div>

                <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
                        <div className="mb-8 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10">
                                <UserCircle className="size-5 text-violet-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">For Creators</h3>
                        </div>
                        <Timeline
                            steps={creatorSteps}
                            accent="border-violet-500/40 bg-violet-500/10 text-violet-300"
                        />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
                        <div className="mb-8 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10">
                                <Briefcase className="size-5 text-violet-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">For Brands</h3>
                        </div>
                        <Timeline
                            steps={brandSteps}
                            accent="border-violet-500/40 bg-violet-500/10 text-violet-300"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
