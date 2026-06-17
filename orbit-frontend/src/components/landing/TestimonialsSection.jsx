import { Quote } from "lucide-react";

const testimonials = [
    {
        quote:
            "Orbit completely changed how I find brand deals. I went from cold DMs to consistent monthly collaborations within two months.",
        name: "Maya Chen",
        role: "Tech Creator · 124K followers",
        initials: "MC",
    },
    {
        quote:
            "We cut our creator sourcing time in half. The campaign tools and creator filters are exactly what our marketing team needed.",
        name: "James Okonkwo",
        role: "Head of Marketing, Lumina",
        initials: "JO",
    },
    {
        quote:
            "The professional profile builder helped me land my first major brand partnership. Everything feels polished and purpose-built.",
        name: "Sofia Patel",
        role: "Beauty Creator · 210K followers",
        initials: "SP",
    },
];

export function TestimonialsSection() {
    return (
        <section className="border-t border-white/5 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto mb-16 max-w-2xl text-center">
                    <p className="mb-3 text-sm font-medium text-violet-400">Testimonials</p>
                    <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                        Trusted by creators and brands
                    </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {testimonials.map((item) => (
                        <div
                            key={item.name}
                            className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-violet-500/25 hover:bg-white/[0.05]"
                        >
                            <Quote className="mb-4 size-5 text-violet-400/60" />
                            <p className="flex-1 text-sm leading-relaxed text-zinc-400">
                                &ldquo;{item.quote}&rdquo;
                            </p>
                            <div className="mt-6 flex items-center gap-3 border-t border-white/5 pt-6">
                                <div className="flex size-10 items-center justify-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-300">
                                    {item.initials}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{item.name}</p>
                                    <p className="text-xs text-zinc-500">{item.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
