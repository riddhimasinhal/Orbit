import { UserCircle, Briefcase } from "lucide-react";

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
                    {/* creator side */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                        <div className="mb-8 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10">
                                <UserCircle className="size-5 text-violet-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">For Creators</h3>
                        </div>
                        <div className="space-y-8">
                            <div className="flex gap-6">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/10 text-sm font-semibold text-violet-300">
                                    01
                                </div>
                                <div>
                                    <h4 className="text-base font-semibold text-white">Create Profile</h4>
                                    <p className="mt-1 text-sm text-zinc-500">Set up your creator profile with portfolio and metrics.</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/10 text-sm font-semibold text-violet-300">
                                    02
                                </div>
                                <div>
                                    <h4 className="text-base font-semibold text-white">Discover Campaigns</h4>
                                    <p className="mt-1 text-sm text-zinc-500">Browse and apply to campaigns that fit your brand.</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/10 text-sm font-semibold text-violet-300">
                                    03
                                </div>
                                <div>
                                    <h4 className="text-base font-semibold text-white">Get Collaborations</h4>
                                    <p className="mt-1 text-sm text-zinc-500">Land deals and deliver content that drives results.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* brand side */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                        <div className="mb-8 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10">
                                <Briefcase className="size-5 text-violet-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">For Brands</h3>
                        </div>
                        <div className="space-y-8">
                            <div className="flex gap-6">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/10 text-sm font-semibold text-violet-300">
                                    01
                                </div>
                                <div>
                                    <h4 className="text-base font-semibold text-white">Create Campaign</h4>
                                    <p className="mt-1 text-sm text-zinc-500">Define your goals, budget, and creative brief.</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/10 text-sm font-semibold text-violet-300">
                                    02
                                </div>
                                <div>
                                    <h4 className="text-base font-semibold text-white">Find Creators</h4>
                                    <p className="mt-1 text-sm text-zinc-500">Discover creators who align with your audience.</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/10 text-sm font-semibold text-violet-300">
                                    03
                                </div>
                                <div>
                                    <h4 className="text-base font-semibold text-white">Launch Campaigns</h4>
                                    <p className="mt-1 text-sm text-zinc-500">Go live and manage collaborations end to end.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
