"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useScopeStore } from "@/store/scope-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScopeOutput } from "@/lib/scope";
import { getScopeTemplateById } from "@/lib/scope-templates";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

const questions = [
  "What should we call this project?",
  "Who is the target audience for this project?",
  "What budget range are you considering? (example: 500000-1200000)",
  "What timeline do you prefer? (ASAP, 1 month, 3 months, 6 months, flexible)",
  "List 3-6 key features (comma separated).",
];

export function ScopeBuilder() {
  const searchParams = useSearchParams();
  const { input, output, loading, error, setField, setOutput, setLoading, setError } = useScopeStore();
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Great, let us scope your project together. I will ask a few quick questions and build your blueprint live.",
    },
    { role: "assistant", text: questions[0]! },
  ]);
  const [step, setStep] = useState(0);
  const [isIntakeComplete, setIsIntakeComplete] = useState(false);
  const appliedTemplateIdRef = useRef<string | null>(null);
  const scrolledRef = useRef<HTMLDivElement | null>(null);

  const incomingIdea = searchParams.get("idea");
  const templateId = searchParams.get("template");

  useEffect(() => {
    if (incomingIdea && input.description !== incomingIdea) {
      setField("description", incomingIdea);
    }
  }, [incomingIdea, input.description, setField]);

  useEffect(() => {
    if (!templateId || appliedTemplateIdRef.current === templateId) return;
    const template = getScopeTemplateById(templateId);
    if (!template) return;

    setField("projectName", template.prefill.projectName);
    setField("description", template.prefill.description);
    setField("industry", template.prefill.industry);
    setField("targetAudience", template.prefill.targetAudience);
    setField("budgetMin", template.prefill.budgetMin);
    setField("budgetMax", template.prefill.budgetMax);
    setField("timeline", template.prefill.timeline);
    setField("teamSize", template.prefill.teamSize);
    setField("keyFeatures", template.prefill.keyFeatures);
    setField("competitors", template.prefill.competitors || "");
    setOutput(null);
    setError(null);
    setStep(0);
    setIsIntakeComplete(false);
    appliedTemplateIdRef.current = templateId;

    // Start a NEW AI chat context associated with the selected template.
    setChatInput("");
    setChatMessages([{ role: "assistant", text: `Starting a new chat for "${template.name}"...` }]);

    (async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                text: [
                  `Template selected: ${template.name}.`,
                  `Template description: ${template.description}`,
                  "Start a new conversation and ask me the first intake question needed to generate a client-ready blueprint.",
                ].join(" "),
              },
            ],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "AI chat failed");

        setChatMessages([
          { role: "assistant", text: `Great choice. You selected "${template.name}".` },
          { role: "assistant", text: String(data.reply ?? data?.reply ?? "Great, let's start.") },
          { role: "assistant", text: questions[0]! },
        ]);
      } catch {
        setChatMessages([
          { role: "assistant", text: `Great choice. You selected "${template.name}".` },
          { role: "assistant", text: `Template prompt: ${template.description}` },
          { role: "assistant", text: questions[0]! },
        ]);
      }
    })();
  }, [templateId, setError, setField, setOutput]);

  useEffect(() => {
    if (scrolledRef.current) {
      scrolledRef.current.scrollTop = scrolledRef.current.scrollHeight;
    }
  }, [chatMessages]);

  function applyAnswerForStep(stepIndex: number, answer: string) {
    const normalized = answer.trim();
    if (!normalized) return;

    if (stepIndex === 0) {
      setField("projectName", normalized);
      return;
    }
    if (stepIndex === 1) {
      setField("targetAudience", normalized);
      return;
    }
    if (stepIndex === 2) {
      const match = normalized.match(/(\d[\d,]*)\s*[-–]\s*(\d[\d,]*)/);
      if (match) {
        const min = Number(match[1]!.replace(/,/g, ""));
        const max = Number(match[2]!.replace(/,/g, ""));
        if (!Number.isNaN(min) && !Number.isNaN(max)) {
          setField("budgetMin", min);
          setField("budgetMax", max);
        }
      }
      return;
    }
    if (stepIndex === 3) {
      setField("timeline", normalized);
      return;
    }
    if (stepIndex === 4) {
      const features = normalized
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (features.length) setField("keyFeatures", features);
    }
  }

  function handleSend() {
    const text = chatInput.trim();
    if (!text) return;

    setChatMessages((prev) => [...prev, { role: "user", text }]);
    setChatInput("");

    if (step === 0 && !input.description) {
      setField("description", text);
    }

    applyAnswerForStep(step, text);
    setOutput(null);

    const next = step + 1;
    if (next < questions.length) {
      setStep(next);
      setChatMessages((prev) => [...prev, { role: "assistant", text: questions[next]! }]);
      return;
    }

    setIsIntakeComplete(true);
    setChatMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: "Perfect. Intake is complete. Click Generate Blueprint to produce the full AI document.",
      },
    ]);
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scopes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate scope");
      setOutput(data.scope as ScopeOutput);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle>Conversational Scoping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div ref={scrolledRef} className="h-[420px] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
            {chatMessages.map((message, idx) => (
              <div key={`${message.role}-${idx}`} className={message.role === "assistant" ? "mr-8" : "ml-8"}>
                <div
                  className={
                    message.role === "assistant"
                      ? "rounded-2xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                      : "rounded-2xl bg-[#5683da] px-3 py-2 text-sm text-white shadow-sm"
                  }
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              placeholder="Answer here..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button onClick={handleSend} className="bg-[#5683da] text-white hover:bg-[#4a74c7]">
              Send
            </Button>
          </div>

          <Button
            onClick={generate}
            disabled={loading || !isIntakeComplete}
            className="w-full bg-[#111827] text-white hover:bg-[#0b1220] disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate Blueprint"}
          </Button>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          {output ? (
            <p className="text-xs text-emerald-700">
              Blueprint generated successfully. Continue chatting or move to export/share.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

