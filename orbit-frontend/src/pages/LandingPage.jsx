import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#08080c] text-zinc-100 antialiased">
            <LandingNavbar />
            <main>
                <HeroSection />
                <FeaturesSection />
                <HowItWorksSection />
                <StatsSection />
                <TestimonialsSection />
                <CtaSection />
            </main>
            <LandingFooter />
        </div>
    );
}
