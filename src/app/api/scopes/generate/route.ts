import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ScopeInput, ScopeOutput } from "@/lib/scope";

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const fallbackModels = (
    process.env.GEMINI_FALLBACK_MODELS || "gemini-3.1-flash-lite-preview,gemini-3-flash-preview"
  )
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const modelsToTry = Array.from(new Set([primaryModel, ...fallbackModels]));
  if (!key) {
    return NextResponse.json(
      {
        error: "GEMINI_API_KEY is not configured",
        hint: "Add GEMINI_API_KEY to .env.local to enable generation.",
      },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as ScopeInput;
    const prompt = buildPrompt(body);

    const aiResult = await generateWithGeminiFallback(key, modelsToTry, prompt);
    if (!aiResult.content) {
      return NextResponse.json(
        {
          error: aiResult.lastErrorMessage || "Gemini request failed",
          raw: aiResult.lastRaw,
          attemptedModels: modelsToTry,
        },
        { status: aiResult.lastStatus || 502 }
      );
    }

    const scope = JSON.parse(stripCodeFences(aiResult.content)) as ScopeOutput;
    await maybePersistScope(body, scope);
    return NextResponse.json({
      scope,
      modelUsed: aiResult.modelUsed,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request or model response" }, { status: 400 });
  }
}

async function generateWithGeminiFallback(key: string, models: string[], prompt: string) {
  let lastStatus = 0;
  let lastErrorMessage = "";
  let lastRaw: unknown = null;

  for (const model of models) {
    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.35,
          responseMimeType: "application/json",
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  "You are Hubble, an expert product manager. Output ONLY valid JSON for a project scope. Be practical, realistic, and cost-aware for Nigeria/Africa market context.",
              },
              { text: prompt },
            ],
          },
        ],
      }),
      }
    );

    const aiData = await aiRes.json();
    const content = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (aiRes.ok && content) {
      return { content, modelUsed: model, lastStatus, lastErrorMessage, lastRaw };
    }

    lastStatus = aiRes.status || 502;
    lastErrorMessage = aiData?.error?.message || "Gemini request failed";
    lastRaw = aiData;

    // Retry with next model for temporary capacity and backend outages.
    if (aiRes.status !== 503 && aiRes.status !== 429 && aiRes.status !== 500 && aiRes.status !== 502) {
      break;
    }
  }

  return { content: "", modelUsed: "", lastStatus, lastErrorMessage, lastRaw };
}

function stripCodeFences(content: string) {
  return content.replace(/```json|```/g, "").trim();
}

function buildPrompt(input: ScopeInput) {
  return `
Generate a comprehensive project scope as JSON with keys:
table_of_contents[], executive_summary, problem_statement, proposed_solution, key_features[], tech_stack, timeline{phases[]}, cost_estimate{breakdown[], total_min, total_max, currency}, team{roles[]}, risk_assessment[], success_metrics{kpis[]}, next_steps[].

Rules:
- The structure must read like a client consulting deliverable, not generic notes.
- Include these exact section names inside table_of_contents in order:
  ["Executive Summary","Problem Statement","Proposed Solution","Key Features","Tech Stack","Timeline","Cost Estimate","Risk Assessment","Success Metrics","Next Steps"].
- Include 8-12 key_features.
- key_features shape: { name, priority: must_have|nice_to_have|future, complexity: 1-5, estimated_hours, description }
- Each tech_stack category must use shape: { item, reason }.
- timeline.phases shape: { name, weeks, deliverables[], gantt_hint } where gantt_hint is short text like "Weeks 1-2".
- team.roles shape: { name, hours, when_needed }
- risk_assessment shape: { risk, probability, impact, mitigation }
- success_metrics.kpis should have 5-8 measurable KPIs.
- Costs must be in Naira only (currency = "NGN"), and ranges should be realistic for Nigerian SMEs/startups.
- Return strictly valid JSON.

Input:
${JSON.stringify(input, null, 2)}
`.trim();
}

async function maybePersistScope(input: ScopeInput, scope: ScopeOutput) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) return;

  const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });
  try {
    await supabase.from("scopes").insert({
      title: input.projectName || "Untitled scope",
      description: input.description,
      industry: input.industry,
      target_audience: input.targetAudience,
      budget_min: input.budgetMin,
      budget_max: input.budgetMax,
      timeline: input.timeline,
      team_size: input.teamSize,
      status: "generated",
      ai_payload: scope,
    });
  } catch {
    // Optional persistence: ignore schema mismatch until DB migrations are applied.
  }
}
