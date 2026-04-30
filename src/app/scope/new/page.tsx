import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ScopeBuilder } from "@/components/scope/scope-builder";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NewScopePage() {
  const hasSupabaseEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseEnv) {
    return (
      <AppShell title="Create New Blueprint" subtitle="Configuration required">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">Supabase env vars are missing</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900">
            Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your Vercel project settings, then
            redeploy.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <AppShell
      title="Create New Blueprint"
      subtitle="Chat with Hubble and watch a live client-ready blueprint build in real time."
    >
      <ScopeBuilder />
    </AppShell>
  );
}

