import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

const WIREFRAME_SYSTEM = `
You are an expert UX strategist.
Generate practical product landing page wireframes.
Return valid JSON only, with no markdown fences.
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
    const body = (await request.json()) as { spec?: ProductSpec };
    const spec = body.spec;
    if (!spec?.productTitle || !Array.isArray(spec.sections)) {
      return NextResponse.json({ error: "A valid product spec is required." }, { status: 400 });
    }

    const prompt = [
      "Create a practical landing page wireframe from this product spec.",
      "",
      "Return strict JSON with this exact shape:",
      "{",
      '  "pageName": "string",',
      '  "blocks": [',
      '    {',
      '      "id": "hero",',
      '      "title": "Hero",',
      '      "objective": "What this block must accomplish",',
      '      "contentItems": ["headline", "subheadline", "social proof"],',
      '      "ctaLabel": "Start free"',
      "    }",
      "  ]",
      "}",
      "",
      "Rules:",
      "- Include 6 to 8 blocks in a logical top-to-bottom order.",
      "- Keep contentItems concise and implementation-friendly.",
      "- Use practical conversion-focused blocks.",
      "- IDs should be lowercase kebab-case and unique.",
      "",
      "Product Spec:",
      JSON.stringify(spec),
    ].join("\n");

    const aiResult = await queryGemini(key, modelsToTry, prompt);
    if (!aiResult.content) {
      return NextResponse.json(
        { error: aiResult.lastErrorMessage || "Gemini request failed", raw: aiResult.lastRaw },
        { status: aiResult.lastStatus || 502 }
      );
    }

    const parsed = JSON.parse(stripCodeFences(aiResult.content)) as {
      pageName?: string;
      blocks?: Array<{
        id?: string;
        title?: string;
        objective?: string;
        contentItems?: string[];
        ctaLabel?: string;
      }>;
    };
    if (!parsed?.pageName || !Array.isArray(parsed.blocks) || parsed.blocks.length === 0) {
      return NextResponse.json({ error: "Invalid wireframe response format." }, { status: 502 });
    }

    return NextResponse.json({ wireframe: parsed, modelUsed: aiResult.modelUsed });
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
            parts: [{ text: WIREFRAME_SYSTEM }],
          },
          generationConfig: {
            temperature: 0.3,
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
