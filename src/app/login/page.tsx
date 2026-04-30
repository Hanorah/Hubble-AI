import { Suspense } from "react";
import Header from "@/components/huly/header";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f8ff] font-sans text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[#090a0c]" />
      <div className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-[#5683da]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#f58562]/15 blur-3xl" />
      <Header />
      <main className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-28 sm:px-6">
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </main>
    </div>
  );
}
