import {
    Briefcase,
    Megaphone,
    Search,
    UserCircle,
    ClipboardList,
    Handshake,
} from "lucide-react";

const creatorFeatures = [
    {
        icon: Search,
        title: "Discover Campaigns",
        description:
            "Browse curated brand campaigns matched to your niche, audience, and content style.",
    },
    {
        icon: ClipboardList,
        title: "Track Applications",
        description:
            "Monitor every application in one place — from submission to approval and delivery.",
    },
    {
        icon: UserCircle,
        title: "Build Professional Profile",
        description:
            "Showcase your portfolio, metrics, and past collaborations to attract top brands.",
    },
];

const brandFeatures = [
    {
        icon: Search,
        title: "Find Creators",
        description:
            "Filter by niche, reach, engagement, and audience demographics to find ideal partners.",
    },
    {
        icon: Megaphone,
        title: "Launch Campaigns",
        description:
            "Create campaigns with clear briefs, budgets, and timelines — publish in minutes.",
    },
    {
        icon: Handshake,
        title: "Manage Collaborations",
        description:
            "Coordinate deliverables, approvals, and payments from a single dashboard.",
    },
];

function FeatureCard({ icon: Icon, title, description }) {
    return (
        <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-violet-500/5">
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20 transition-colors group-hover:bg-violet-500/20">
                <Icon className="size-5 text-violet-300" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
            <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
        </div>
    );
}

function FeatureGroup({ id, label, icon: GroupIcon, features }) {
    return (
        <div id={id} className="scroll-mt-24">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-white/5">
                    <GroupIcon className="size-4 text-violet-400" />
                </div>
                <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                    {label}
                </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                    <FeatureCard key={feature.title} {...feature} />
                ))}
            </div>
        </div>
    );
}

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
                        Purpose-built tools for creators and brands to connect, collaborate, and
                        grow.
                    </p>
                </div>

                <div className="space-y-16">
                    <FeatureGroup
                        id="for-creators"
                        label="For Creators"
                        icon={UserCircle}
                        features={creatorFeatures}
                    />
                    <FeatureGroup
                        id="for-brands"
                        label="For Brands"
                        icon={Briefcase}
                        features={brandFeatures}
                    />
                </div>
            </div>
        </section>
    );
}
