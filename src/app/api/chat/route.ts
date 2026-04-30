import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AttachmentPart = {
  mimeType: string;
  data: string;
  /** base64 */
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  attachments?: AttachmentPart[];
};

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

const SCOPE_IT_SYSTEM = `
You are Hubble, an AI product scoping assistant.

Rules:
- Respond naturally like a chat conversation.
- Do NOT output option lists unless user asks.
- Ask one concise follow-up question at a time if details are missing.
- Once the user asks for full scope or enough detail exists, produce a very extensive scope document in markdown with headings and clear sections.
- Keep everything in-thread and conversational.
- When the user shares images or documents, refer to them and incorporate relevant details.
- When you determine intake is complete (enough details to build a full product spec), prepend exactly this token at the start of your reply: [INTAKE_COMPLETE]
- Use [INTAKE_COMPLETE] only when you no longer need critical follow-up questions.

The product UI may show an initial welcome before the user sends a message; continue naturally from the user's messages.
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
    const thread = body.messages ?? [];
    if (thread.length === 0) {
      return NextResponse.json({ error: "messages are required" }, { status: 400 });
    }

    const contents = buildGeminiContents(thread);
    if (contents.length === 0) {
      return NextResponse.json({ error: "no user messages in thread" }, { status: 400 });
    }

    const aiResult = await queryGemini(key, modelsToTry, contents);
    if (!aiResult.content) {
      return NextResponse.json(
        { error: aiResult.lastErrorMessage || "Gemini request failed", raw: aiResult.lastRaw },
        { status: aiResult.lastStatus || 502 }
      );
    }

    return NextResponse.json({ reply: aiResult.content, modelUsed: aiResult.modelUsed });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

function buildGeminiContents(messages: ChatMessage[]): Array<{ role: "user" | "model"; parts: GeminiPart[] }> {
  const firstUserIdx = messages.findIndex((m) => m.role === "user");
  if (firstUserIdx === -1) return [];

  const sliced = messages.slice(firstUserIdx);
  const out: Array<{ role: "user" | "model"; parts: GeminiPart[] }> = [];

  for (const m of sliced) {
    if (m.role === "assistant") {
      out.push({ role: "model", parts: [{ text: m.text }] });
      continue;
    }

    const parts: GeminiPart[] = [];
    const trimmed = m.text?.trim() ?? "";
    if (trimmed) parts.push({ text: trimmed });

    for (const att of m.attachments ?? []) {
      const mime = att.mimeType || "application/octet-stream";
      if (!att.data) continue;
      parts.push({
        inlineData: {
          mimeType: mime,
          data: att.data,
        },
      });
    }

    if (parts.length === 0) {
      parts.push({ text: "(User sent attachments or an empty message.)" });
    }

    out.push({ role: "user", parts });
  }

  return out;
}

async function queryGemini(
  key: string,
  models: string[],
  contents: Array<{ role: "user" | "model"; parts: GeminiPart[] }>
) {
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
            parts: [{ text: SCOPE_IT_SYSTEM }],
          },
          generationConfig: {
            temperature: 0.4,
          },
          contents,
        }),
      }
    );

    const data = await res.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (res.ok && content) {
      return { content: stripCodeFences(content), modelUsed: model, lastStatus, lastErrorMessage, lastRaw };
    }

    lastStatus = res.status || 502;
    lastErrorMessage = data?.error?.message || "Gemini request failed";
    lastRaw = data;
    if (![429, 500, 502, 503].includes(res.status)) break;
  }

  return { content: "", modelUsed: "", lastStatus, lastErrorMessage, lastRaw };
}

function stripCodeFences(content: string) {
  return content.replace(/```markdown|```md|```/g, "").trim();
}
