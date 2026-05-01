"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type SharedChatPayload, parseSharedChatParam } from "@/lib/chat-share";
import { WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SharedChatPage() {
  const searchParams = useSearchParams();
  const data = searchParams.get("data");
  const id = searchParams.get("id");
  const payloadFromData = useMemo(() => parseSharedChatParam(data), [data]);
  const [payload, setPayload] = useState<SharedChatPayload | null>(payloadFromData);
  const [loadingShared, setLoadingShared] = useState(Boolean(id && !payloadFromData));
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setPayload(payloadFromData);
    if (!id || payloadFromData) {
      setLoadingShared(false);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingShared(true);
        setLoadError(null);
        const res = await fetch(`/api/shared-chat/${encodeURIComponent(id)}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result?.error || "Could not load shared chat.");
        if (!cancelled) setPayload(result.payload as SharedChatPayload);
      } catch (error) {
        if (!cancelled) {
          setPayload(null);
          setLoadError(error instanceof Error ? error.message : "Could not load shared chat.");
        }
      } finally {
        if (!cancelled) setLoadingShared(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, payloadFromData]);
  const [specLoading, setSpecLoading] = useState(false);
  const [wireframeLoading, setWireframeLoading] = useState(false);
  const [landingLoading, setLandingLoading] = useState(false);
  const [specError, setSpecError] = useState<string | null>(null);
  const [wireframeError, setWireframeError] = useState<string | null>(null);
  const [landingError, setLandingError] = useState<string | null>(null);
  const [productSpec, setProductSpec] = useState(payload?.productSpec ?? null);
  const [finalDocumentText, setFinalDocumentText] = useState(payload?.finalDocumentText ?? "");
  const [productWireframe, setProductWireframe] = useState(payload?.productWireframe ?? null);
  const [productLandingPage, setProductLandingPage] = useState(payload?.productLandingPage ?? null);
  const [generationChoice, setGenerationChoice] = useState<"skip" | "wireframe" | "landing" | "both">(
    payload?.generationChoice ?? "skip"
  );
  const intakeComplete = payload?.intakeComplete ?? false;

  if (loadingShared) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-16 sm:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-slate-900">Loading shared chat...</h1>
        </div>
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-16 sm:px-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-semibold text-slate-900">Invalid share link</h1>
          <p className="mt-2 text-sm text-slate-700">
            {loadError || "This chat link is missing data or has an unsupported format."}
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-red-700 hover:text-red-800">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  const hasUserMessages = payload.messages.some((m) => m.role === "user");

  async function generateProductSpec() {
    if (!hasUserMessages) return;
    setSpecLoading(true);
    setSpecError(null);
    try {
      const res = await fetch("/api/product/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payload.messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate product spec");
      const spec = data.spec;
      setProductSpec(spec);
      setFinalDocumentText(
        [
          `${spec.productTitle || "Untitled Product Spec"}`,
          `${"=".repeat((spec.productTitle || "Untitled Product Spec").length)}`,
          "",
          spec.oneLiner || "",
          "",
          ...spec.sections.flatMap((section: { title: string; content: string }) => [
            section.title,
            "-".repeat(section.title.length),
            section.content || "",
            "",
          ]),
        ]
          .join("\n")
          .trim()
      );
      setProductWireframe(null);
      setProductLandingPage(null);
      setGenerationChoice("skip");
    } catch (error) {
      setSpecError(error instanceof Error ? error.message : "Could not generate product spec.");
    } finally {
      setSpecLoading(false);
    }
  }

  async function generateWireframe() {
    if (!productSpec) return;
    setWireframeLoading(true);
    setWireframeError(null);
    try {
      const res = await fetch("/api/product/wireframe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: productSpec }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate wireframe");
      setProductWireframe(data.wireframe);
    } catch (error) {
      setWireframeError(error instanceof Error ? error.message : "Could not generate wireframe.");
    } finally {
      setWireframeLoading(false);
    }
  }

  async function generateLandingPage() {
    if (!productSpec) return;
    setLandingLoading(true);
    setLandingError(null);
    try {
      const res = await fetch("/api/product/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: productSpec }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate landing page");
      setProductLandingPage(data.landingPage);
    } catch (error) {
      setLandingError(error instanceof Error ? error.message : "Could not generate landing page.");
    } finally {
      setLandingLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10 sm:px-8">
      <div className="mb-6 border-b border-red-100 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-700">Shared chat</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Hubble conversation</h1>
      </div>

      <div className="space-y-6">
        {payload.messages.map((message, idx) => (
          <div key={`${message.role}-${idx}`} className="w-full">
            {message.role === "user" ? (
              <div className="ml-auto w-full max-w-[85%] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-slate-900 sm:max-w-[70%]">
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-black shadow-sm" />
                <div className="min-w-0 flex-1 text-[15px] leading-7 text-slate-700">
                  <p className="whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {intakeComplete || productSpec ? (
        <div className="mt-8 w-full rounded-3xl border border-red-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-slate-900">Product Builder</p>
              <p className="text-sm text-slate-600">Generate and view product outputs from this shared chat.</p>
            </div>
            <Button
              type="button"
              onClick={generateProductSpec}
              disabled={specLoading || !hasUserMessages}
              className="h-9 bg-red-600 px-4 text-white hover:bg-red-700 disabled:opacity-60"
            >
              <WandSparkles className="h-4 w-4" />
              {specLoading ? "Generating..." : "Generate Product Spec"}
            </Button>
          </div>

          {specError ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {specError}
            </p>
          ) : null}

          {productSpec ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
                <p className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">Product Title</p>
                <p className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900">{productSpec.productTitle}</p>
                <p className="mb-1 mt-3 block text-xs font-medium uppercase tracking-wide text-slate-600">One-liner</p>
                <p className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900">{productSpec.oneLiner}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(generationChoice === "wireframe" || generationChoice === "both") && (
                  <Button
                    type="button"
                    onClick={generateWireframe}
                    disabled={wireframeLoading || specLoading}
                    className="h-9 bg-red-600 px-4 text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    <WandSparkles className="h-4 w-4" />
                    {wireframeLoading ? "Generating wireframe..." : "Generate Wireframe"}
                  </Button>
                )}
                {(generationChoice === "landing" || generationChoice === "both") && (
                  <Button
                    type="button"
                    onClick={generateLandingPage}
                    disabled={landingLoading || specLoading}
                    className="h-9 bg-red-600 px-4 text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    <WandSparkles className="h-4 w-4" />
                    {landingLoading ? "Generating landing page..." : "Generate Landing Page"}
                  </Button>
                )}
                {generationChoice === "skip" && (
                  <p className="text-sm text-slate-500">Choose an option below to generate additional outputs.</p>
                )}
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {[
                  { value: "skip", label: "Skip" },
                  { value: "wireframe", label: "Generate wireframe" },
                  { value: "landing", label: "Generate landing page" },
                  { value: "both", label: "Generate both" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      generationChoice === option.value
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="generation-choice-shared"
                      value={option.value}
                      checked={generationChoice === option.value}
                      onChange={() => setGenerationChoice(option.value as "skip" | "wireframe" | "landing" | "both")}
                      className="accent-red-600"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>

              {wireframeError ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {wireframeError}
                </p>
              ) : null}
              {landingError ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {landingError}
                </p>
              ) : null}

              <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
                <p className="mb-2 text-sm font-semibold text-slate-900">Final Document Preview</p>
                <textarea
                  value={finalDocumentText}
                  onChange={(e) => setFinalDocumentText(e.target.value)}
                  rows={12}
                  className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-red-400"
                />
              </div>

              {productWireframe ? (
                <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
                  <p className="text-sm font-semibold text-slate-900">Wireframe: {productWireframe.pageName}</p>
                </div>
              ) : null}

              {productLandingPage ? (
                <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
                  <p className="text-sm font-semibold text-slate-900">Landing page draft</p>
                  <p className="mt-1 text-sm text-slate-700">{productLandingPage.heroTitle}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}

