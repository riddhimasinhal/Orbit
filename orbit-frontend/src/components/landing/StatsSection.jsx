import { useCountUp } from "./useCountUp";

function StatItem({ end, suffix, label }) {
    const { ref, display } = useCountUp(end, 2000, suffix);

    return (
        <div ref={ref} className="text-center">
            <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {display}
            </p>
            <p className="mt-2 text-sm text-zinc-500">{label}</p>
        </div>
    );
}

export function StatsSection() {
    return (
        <section className="py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 backdrop-blur-sm sm:px-12 sm:py-16">
                    <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
                        <StatItem end={10} suffix="K+" label="Creators" />
                        <StatItem end={1} suffix="K+" label="Brands" />
                        <StatItem end={50} suffix="K+" label="Collaborations" />
                        <StatItem end={95} suffix="%" label="Satisfaction" />
                    </div>
                </div>
            </div>
        </section>
    );
}
