"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type SharedChatPayload, parseSharedChatParam } from "@/lib/chat-share";

export default function SharedLandingPage() {
  const searchParams = useSearchParams();
  const data = searchParams.get("data");
  const id = searchParams.get("id");
  const payloadFromData = useMemo(() => parseSharedChatParam(data), [data]);
  const [payload, setPayload] = useState<SharedChatPayload | null>(payloadFromData);
  const [loading, setLoading] = useState(Boolean(id && !payloadFromData));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPayload(payloadFromData);
    if (!id || payloadFromData) {
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/shared-chat/${encodeURIComponent(id)}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result?.error || "Could not load shared chat.");
        if (!cancelled) setPayload(result.payload as SharedChatPayload);
      } catch (err) {
        if (!cancelled) {
          setPayload(null);
          setError(err instanceof Error ? err.message : "Could not load shared landing page.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, payloadFromData]);

  if (loading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-16 sm:px-8">
        <p className="text-slate-700">Loading landing page...</p>
      </main>
    );
  }

  const landing = payload?.productLandingPage;
  if (!landing) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-16 sm:px-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-semibold text-slate-900">Landing page not available</h1>
          <p className="mt-2 text-sm text-slate-700">
            {error || "This shared chat does not include a generated landing page yet."}
          </p>
          <Link href={id ? `/shared-chat?id=${encodeURIComponent(id)}` : "/shared-chat"} className="mt-4 inline-block text-sm font-medium text-red-700 hover:text-red-800">
            Back to shared chat
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-red-100 bg-gradient-to-b from-red-100/70 via-white to-white">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-700">Shared landing page</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-[0.04em] text-slate-900 sm:text-6xl">
            {landing.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">{landing.heroSubtitle}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <button type="button" className="rounded-full bg-red-600 px-7 py-3 text-sm font-medium tracking-wide text-white">
              {landing.primaryCta}
            </button>
            <button type="button" className="rounded-full border border-red-200 bg-white px-7 py-3 text-sm font-medium tracking-wide text-red-700">
              {landing.secondaryCta}
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {landing.sections.map((section) => (
            <article key={section.id} className="rounded-2xl border border-red-100/80 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">{section.id}</p>
              <h2 className="mt-3 text-xl font-semibold tracking-[0.02em] text-slate-900">{section.title}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

