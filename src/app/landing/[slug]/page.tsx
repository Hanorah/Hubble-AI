"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";

type ProductLandingSection = {
  id: string;
  title: string;
  body: string;
};

type ProductLandingPage = {
  slug: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryCta: string;
  secondaryCta: string;
  sections: ProductLandingSection[];
};

const LANDING_PAGES_STORAGE_KEY = "hubble.landingPages";

function readLandingPage(chatId: string | null): ProductLandingPage | null {
  if (typeof window === "undefined" || !chatId) return null;
  try {
    const raw = window.localStorage.getItem(LANDING_PAGES_STORAGE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as Record<string, { landingPage?: ProductLandingPage; updatedAt: string }>)
      : {};
    return parsed[chatId]?.landingPage ?? null;
  } catch {
    return null;
  }
}

export default function LandingPreviewPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chat");
  const routeSlug = params.slug;

  const landing = useMemo(() => readLandingPage(chatId), [chatId]);

  if (!landing) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-16 sm:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-semibold text-slate-900">Landing page not found</h1>
          <p className="mt-2 text-sm text-slate-700">
            This preview link is missing chat context, or the landing page has not been generated on this browser yet.
          </p>
          <div className="mt-4">
            <Link href="/dashboard" className="text-sm font-medium text-red-700 hover:text-red-800">
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const slugMatches = landing.slug === routeSlug;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden border-b border-red-100 bg-gradient-to-b from-red-100/70 via-white to-white">
        <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-red-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-700">Hubble landing preview</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-[0.04em] text-slate-900 sm:text-6xl">
            {landing.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">{landing.heroSubtitle}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full bg-red-600 px-7 py-3 text-sm font-medium tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-700"
            >
              {landing.primaryCta}
            </button>
            <button
              type="button"
              className="rounded-full border border-red-200 bg-white px-7 py-3 text-sm font-medium tracking-wide text-red-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50"
            >
              {landing.secondaryCta}
            </button>
          </div>
          {!slugMatches ? (
            <p className="mt-5 text-xs tracking-wide text-amber-700">
              URL slug and generated slug differ. Loaded preview for this chat anyway.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-[0.03em] text-slate-900 sm:text-3xl">Why this product</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Structured sections generated from your product brief, arranged into a conversion-focused landing experience.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {landing.sections.map((section) => (
            <article
              key={section.id}
              className="group rounded-2xl border border-red-100/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">{section.id}</p>
              <h3 className="mt-3 text-xl font-semibold tracking-[0.02em] text-slate-900">{section.title}</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-red-100 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 sm:flex-row sm:items-center sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-700">Ready to ship</p>
            <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              This preview is generated from the dashboard and can be iterated before turning it into a full public page.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium tracking-wide text-white transition hover:bg-slate-700"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

