"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = { mode: "login" | "signup" };

export function AuthForm({ mode }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const supabase = createSupabaseBrowserClient();

  const isLogin = mode === "login";
  const title = isLogin ? "Welcome back" : "Build your Hubble workspace";
  const subtitle = isLogin
    ? "Sign in and continue turning ideas into scoped execution plans."
    : "Start free and generate a complete project scope in minutes.";

  async function onMagicLink() {
    setLoading(true);
    setMessage(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setLoading(false);
    setMessage(error ? error.message : "Check your email for the magic link.");
  }

  async function onGoogle() {
    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setLoading(false);
      setMessage(error.message);
    }
  }

  return (
    <Card className="w-full max-w-5xl overflow-hidden border-white/60 bg-white/60 shadow-2xl shadow-[#5683da]/10 backdrop-blur-xl">
      <div className="grid md:grid-cols-2">
        <div className="relative hidden min-h-full flex-col justify-between border-r border-white/50 bg-gradient-to-br from-white/70 via-[#f7f9ff]/80 to-[#eef3ff]/80 p-8 md:flex">
          <div className="absolute -right-20 top-8 h-40 w-40 rounded-full bg-[#5683da]/25 blur-3xl" />
          <div className="absolute -bottom-16 left-6 h-36 w-36 rounded-full bg-[#f58562]/20 blur-3xl" />
          <div className="relative z-10">
            <p className="mb-3 inline-flex rounded-full border border-[#5683da]/30 bg-white/70 px-3 py-1 text-xs uppercase tracking-wider text-[#2a406f]">
              Hubble AI Scoping
            </p>
            <h2 className="text-3xl font-semibold text-[#111827]">
              {isLogin ? "Great to see you again." : "Launch faster with better scope clarity."}
            </h2>
            <p className="mt-3 text-sm text-[#4b5563]">
              From rough idea to a stakeholder-ready blueprint, timeline, risks, and budget confidence.
            </p>
          </div>
          <ul className="relative z-10 mt-8 space-y-3 text-sm text-[#374151]">
            <li>AI-generated scope and milestones</li>
            <li>Cost range, risks, and team plan in one place</li>
            <li>Ready-to-share output for clients and investors</li>
          </ul>
        </div>
        <div className="bg-white/50 p-6 sm:p-8">
          <CardHeader className="px-0 pt-0 text-left">
            <CardTitle className="text-3xl text-[#111827]">{title}</CardTitle>
            <CardDescription className="text-[#4b5563]">{subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-0 pb-0">
            <label className="text-xs font-medium uppercase tracking-wide text-[#4b5563]">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-11 rounded-lg border border-[#d1d5db] bg-white/80 px-3 text-sm text-[#111827] outline-none ring-[#5683da]/40 placeholder:text-[#6b7280] focus:border-[#5683da] focus:ring-2"
            />
            <Button
              onClick={onMagicLink}
              disabled={!email || loading}
              className="mt-2 w-full bg-[#5683da] text-white hover:bg-[#4a74c7]"
            >
              {loading ? "Please wait..." : "Continue with email"}
            </Button>
            <Button
              variant="secondary"
              className="w-full border border-[#d1d5db] bg-white/70 text-[#111827] hover:bg-white"
              onClick={onGoogle}
              disabled={loading}
            >
              Continue with Google
            </Button>
            {message ? <p className="text-center text-xs text-[#4b5563]">{message}</p> : null}
            <p className="text-center text-sm text-[#4b5563]">
              {isLogin ? "No account yet?" : "Already have an account?"}{" "}
              <Link href={isLogin ? "/signup" : "/login"} className="font-semibold text-[#8bb0ff] hover:underline">
                {isLogin ? "Create one" : "Sign in"}
              </Link>
            </p>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

