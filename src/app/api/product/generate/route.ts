import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type ProductSection = {
  key: string;
  title: string;
  content: string;
};

type ProductSpec = {
  productTitle: string;
  oneLiner: string;
  sections: ProductSection[];
};

const PRODUCT_SYSTEM = `
You are Hubble, a senior product manager and technical writer.
Turn rough project ideas into practical MVP product specs.
Return valid JSON only and no markdown fences.
`.trim();

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
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };
    const messages = body.messages ?? [];
    const userMessages = messages.filter((m) => m.role === "user" && m.text?.trim());
    if (!userMessages.length) {
      return NextResponse.json({ error: "At least one user message is required." }, { status: 400 });
    }

    const prompt = [
      "Build a complete MVP product specification from this chat transcript.",
      "",
      "Return strict JSON with this shape:",
      "{",
      '  "productTitle": "string",',
      '  "oneLiner": "string",',
      '  "sections": [',
      '    { "key": "vision", "title": "Product Vision", "content": "..." },',
      '    { "key": "users", "title": "Target Users & Personas", "content": "..." },',
      '    { "key": "requirements", "title": "Functional Requirements", "content": "..." },',
      '    { "key": "stories", "title": "User Stories", "content": "..." },',
      '    { "key": "nonfunctional", "title": "Non-functional Requirements", "content": "..." },',
      '    { "key": "stack", "title": "Recommended Tech Stack", "content": "..." },',
      '    { "key": "roadmap", "title": "Milestones & Roadmap", "content": "..." },',
      '    { "key": "risks", "title": "Risks & Mitigations", "content": "..." },',
      '    { "key": "qa", "title": "QA & Launch Checklist", "content": "..." }',
      "  ]",
      "}",
      "",
      "Rules:",
      "- Keep each section concrete and implementation-oriented.",
      "- Use plain text in content fields (no markdown code fences).",
      "- Mention assumptions when details are missing.",
      "",
      "Transcript:",
      ...messages.map((m) => `${m.role.toUpperCase()}: ${m.text}`),
    ].join("\n");

    const aiResult = await queryGemini(key, modelsToTry, prompt);
    if (!aiResult.content) {
      return NextResponse.json(
        { error: aiResult.lastErrorMessage || "Gemini request failed", raw: aiResult.lastRaw },
        { status: aiResult.lastStatus || 502 }
      );
    }

    const parsed = JSON.parse(stripCodeFences(aiResult.content)) as ProductSpec;
    if (!parsed?.productTitle || !Array.isArray(parsed.sections)) {
      return NextResponse.json({ error: "Invalid AI response format." }, { status: 502 });
    }

    return NextResponse.json({ spec: parsed, modelUsed: aiResult.modelUsed });
  } catch {
    return NextResponse.json({ error: "Invalid request payload or model response." }, { status: 400 });
  }
}

async function queryGemini(key: string, models: string[], prompt: string) {
  let lastStatus = 0;
  let lastErrorMessage = "";
  let lastRaw: unknown = null;

  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: PRODUCT_SYSTEM }],
          },
          generationConfig: {
            temperature: 0.25,
            responseMimeType: "application/json",
          },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await res.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (res.ok && content) {
      return { content, modelUsed: model, lastStatus, lastErrorMessage, lastRaw };
    }

    lastStatus = res.status || 502;
    lastErrorMessage = data?.error?.message || "Gemini request failed";
    lastRaw = data;
    if (![429, 500, 502, 503].includes(res.status)) break;
  }

  return { content: "", modelUsed: "", lastStatus, lastErrorMessage, lastRaw };
}

function stripCodeFences(content: string) {
  return content.replace(/```json|```/g, "").trim();
}
