"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  const { url, anon } = getSupabaseEnv();
  return createBrowserClient(url, anon);
}

