import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white font-sans text-foreground">
      <main className="relative mx-auto flex min-h-screen max-w-6xl items-start justify-center px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
        <Suspense fallback={null}>
          <AuthForm mode="signup" />
        </Suspense>
      </main>
    </div>
  );
}
