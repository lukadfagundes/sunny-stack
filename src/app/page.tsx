import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";

export default function Home() {
  return (
    <main className="flex-1">
      <HeroSection />
      <StatsSection />

      {/* Below-fold placeholder */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-sunny-cream-muted mb-4">
          More Coming Soon
        </h2>
        <p className="text-sunny-cream-muted/60 max-w-md mx-auto">
          Featured projects, journey highlights, and more interactive experiences are on the way.
        </p>
      </section>
    </main>
  );
}
