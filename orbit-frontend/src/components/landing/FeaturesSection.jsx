import {
    Search, ClipboardList, UserCircle,
    Megaphone, Handshake, Briefcase,
} from "lucide-react";

export function FeaturesSection() {
    return (
        <section id="features" className="scroll-mt-20 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto mb-16 max-w-2xl text-center">
                    <p className="mb-3 text-sm font-medium text-violet-400">Features</p>
                    <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                        Everything you need to collaborate
                    </h2>
                    <p className="mt-4 text-zinc-500">
                        Purpose-built tools for creators and brands to connect, collaborate, and grow.
                    </p>
                </div>

                {/* for creators */}
                <div id="for-creators" className="scroll-mt-24 mb-16">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-white/5">
                            <UserCircle className="size-4 text-violet-400" />
                        </div>
                        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-400">For Creators</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-violet-500/30 hover:bg-white/[0.05] transition-all">
                            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                                <Search className="size-5 text-violet-300" />
                            </div>
                            <h3 className="mb-2 text-base font-semibold text-white">Discover Campaigns</h3>
                            <p className="text-sm text-zinc-500">Browse curated brand campaigns matched to your niche, audience, and content style.</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-violet-500/30 hover:bg-white/[0.05] transition-all">
                            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                                <ClipboardList className="size-5 text-violet-300" />
                            </div>
                            <h3 className="mb-2 text-base font-semibold text-white">Track Applications</h3>
                            <p className="text-sm text-zinc-500">Monitor every application in one place — from submission to approval and delivery.</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-violet-500/30 hover:bg-white/[0.05] transition-all">
                            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                                <UserCircle className="size-5 text-violet-300" />
                            </div>
                            <h3 className="mb-2 text-base font-semibold text-white">Build Professional Profile</h3>
                            <p className="text-sm text-zinc-500">Showcase your portfolio, metrics, and past collaborations to attract top brands.</p>
                        </div>
                    </div>
                </div>

                {/* for brands */}
                <div id="for-brands" className="scroll-mt-24">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-white/5">
                            <Briefcase className="size-4 text-violet-400" />
                        </div>
                        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-400">For Brands</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-violet-500/30 hover:bg-white/[0.05] transition-all">
                            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                                <Search className="size-5 text-violet-300" />
                            </div>
                            <h3 className="mb-2 text-base font-semibold text-white">Find Creators</h3>
                            <p className="text-sm text-zinc-500">Filter by niche, reach, engagement, and audience demographics to find ideal partners.</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-violet-500/30 hover:bg-white/[0.05] transition-all">
                            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                                <Megaphone className="size-5 text-violet-300" />
                            </div>
                            <h3 className="mb-2 text-base font-semibold text-white">Launch Campaigns</h3>
                            <p className="text-sm text-zinc-500">Create campaigns with clear briefs, budgets, and timelines — publish in minutes.</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-violet-500/30 hover:bg-white/[0.05] transition-all">
                            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                                <Handshake className="size-5 text-violet-300" />
                            </div>
                            <h3 className="mb-2 text-base font-semibold text-white">Manage Collaborations</h3>
                            <p className="text-sm text-zinc-500">Coordinate deliverables, approvals, and payments from a single dashboard.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
