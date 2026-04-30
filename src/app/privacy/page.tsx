import { LandingFooter } from "@/components/landing/footer";
import { LandingNav } from "@/components/landing/landing-nav";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-base font-sans text-foreground">
      <LandingNav />
      <main className="mx-auto max-w-2xl px-4 py-24 text-sm leading-relaxed text-text-secondary sm:px-6">
        <h1 className="text-3xl font-bold text-foreground">Privacy</h1>
        <p className="mt-6">
          Placeholder policy. Replace with your real privacy terms before launch—especially for AI
          processing and Supabase data regions.
        </p>
      </main>
      <LandingFooter />
    </div>
  );
}
