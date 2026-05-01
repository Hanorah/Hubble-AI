"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = { mode: "login" | "signup" };

export function AuthForm({ mode }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const supabase = createSupabaseBrowserClient();

  const isLogin = mode === "login";
  const title = isLogin ? "Sign in" : "Sign up";

  async function onSubmit() {
    setLoading(true);
    setMessage(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    // If email confirmation is disabled, sign-up returns a session.
    if (data.session) {
      router.push(next);
      router.refresh();
      return;
    }

    setMessage("Check your email to confirm your account, then sign in.");
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
    <Card className="w-full max-w-md border-[#f1d2d3] bg-white shadow-2xl shadow-[#c2383a]/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl text-[#111827]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <label className="text-xs font-medium uppercase tracking-wide text-[#4b5563]">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="h-11 rounded-lg border border-[#d1d5db] bg-white px-3 text-sm text-[#111827] outline-none ring-[#c2383a]/40 placeholder:text-[#6b7280] focus:border-[#c2383a] focus:ring-2"
        />
        <label className="text-xs font-medium uppercase tracking-wide text-[#4b5563]">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="h-11 rounded-lg border border-[#d1d5db] bg-white px-3 text-sm text-[#111827] outline-none ring-[#c2383a]/40 placeholder:text-[#6b7280] focus:border-[#c2383a] focus:ring-2"
        />
        <Button
          onClick={onSubmit}
          disabled={!email || !password || loading}
          className="mt-2 w-full bg-[#c2383a] text-white hover:bg-[#a92f31]"
        >
          {loading ? "Please wait..." : isLogin ? "Sign in" : "Sign up"}
        </Button>
        <Button
          variant="secondary"
          className="w-full border border-[#d1d5db] bg-white text-[#111827] hover:bg-white"
          onClick={onGoogle}
          disabled={loading}
        >
          {isLogin ? "Sign in with Google" : "Sign up with Google"}
        </Button>
        {message ? <p className="text-center text-xs text-[#4b5563]">{message}</p> : null}
        <p className="text-center text-sm text-[#4b5563]">
          {isLogin ? "No account?" : "Already have an account?"}{" "}
          <Link href={isLogin ? "/signup" : "/login"} className="font-semibold text-[#c2383a] hover:underline">
            {isLogin ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

