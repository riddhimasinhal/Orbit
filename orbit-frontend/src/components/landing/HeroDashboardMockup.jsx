import { Badge } from "@/components/ui/badge";
import {
    BarChart3,
    Bell,
    MessageSquare,
    Search,
    Sparkles,
    TrendingUp,
    Users,
} from "lucide-react";

export function HeroDashboardMockup() {
    return (
        <div className="relative mx-auto w-full max-w-4xl">
            <div className="absolute -inset-4 rounded-3xl bg-violet-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-violet-500/10 backdrop-blur-xl">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                    <div className="flex gap-1.5">
                        <span className="size-2.5 rounded-full bg-white/20" />
                        <span className="size-2.5 rounded-full bg-white/20" />
                        <span className="size-2.5 rounded-full bg-white/20" />
                    </div>
                    <div className="mx-auto flex h-7 w-48 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-xs text-zinc-500">
                        <Search className="size-3" />
                        Search creators, campaigns...
                    </div>
                </div>

                <div className="grid gap-4 p-4 md:grid-cols-[180px_1fr]">
                    <div className="hidden space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 md:block">
                        {["Dashboard", "Campaigns", "Creators", "Analytics"].map((item, i) => (
                            <div
                                key={item}
                                className={`rounded-lg px-3 py-2 text-xs ${i === 0 ? "bg-violet-500/15 text-violet-200" : "text-zinc-500"}`}
                            >
                                {item}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                            {[
                                { label: "Active Campaigns", value: "24", icon: Sparkles },
                                { label: "Creator Matches", value: "156", icon: Users },
                                { label: "Avg. Engagement", value: "8.4%", icon: TrendingUp },
                            ].map(({ label, value, icon: Icon }) => (
                                <div
                                    key={label}
                                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-violet-500/30"
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-500">{label}</span>
                                        <Icon className="size-3.5 text-violet-400" />
                                    </div>
                                    <p className="text-lg font-semibold text-white">{value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2">
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-xs font-medium text-zinc-300">Creator Profiles</p>
                                    <Badge className="border-violet-500/30 bg-violet-500/10 text-violet-300">
                                        Live
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { name: "Maya Chen", niche: "Tech", followers: "124K" },
                                        { name: "Alex Rivera", niche: "Fitness", followers: "89K" },
                                        { name: "Sofia Patel", niche: "Beauty", followers: "210K" },
                                    ].map((creator) => (
                                        <div
                                            key={creator.name}
                                            className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 transition-colors hover:border-violet-500/20"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="size-7 rounded-full bg-gradient-to-br from-violet-500/40 to-violet-700/20" />
                                                <div>
                                                    <p className="text-xs font-medium text-zinc-200">{creator.name}</p>
                                                    <p className="text-[10px] text-zinc-500">{creator.niche}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-zinc-400">{creator.followers}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                    <p className="mb-3 text-xs font-medium text-zinc-300">Campaign Requests</p>
                                    {["Summer Launch", "Product Review"].map((campaign) => (
                                        <div
                                            key={campaign}
                                            className="mb-2 flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 last:mb-0"
                                        >
                                            <span className="text-xs text-zinc-300">{campaign}</span>
                                            <div className="flex gap-1">
                                                <MessageSquare className="size-3 text-zinc-500" />
                                                <Bell className="size-3 text-violet-400" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex h-24 items-end gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 rounded-sm bg-violet-500/30 transition-all hover:bg-violet-500/50"
                                            style={{ height: `${h}%` }}
                                        />
                                    ))}
                                    <BarChart3 className="ml-2 size-4 text-violet-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
