import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ScopeBuilder } from "@/components/scope/scope-builder";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewScopePage() {
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

