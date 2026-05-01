import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { ShardeumAssetLoader, ShardeumSourceHtmlSection } from "@/components/landing/sections/shardeum-source-html-section";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-foreground">
      <ShardeumAssetLoader />
      <ShardeumSourceHtmlSection selector="#globalHeader" />
      <ShardeumSourceHtmlSection selector="#globalMenu" />
      <main className="relative mx-auto flex min-h-screen max-w-6xl items-start justify-center px-4 pb-16 pt-44 sm:px-6 sm:pt-48">
        <Suspense fallback={null}>
          <AuthForm mode="signup" />
        </Suspense>
      </main>
    </div>
  );
}
