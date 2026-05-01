import { NextResponse } from "next/server";
import type { SharedChatPayload } from "@/lib/chat-share";
import { upsertSharedChat } from "@/lib/shared-chat-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { id?: string; payload?: SharedChatPayload };
    if (!body?.payload || body.payload.v !== 1 || !Array.isArray(body.payload.messages)) {
      return NextResponse.json({ error: "Invalid shared chat payload." }, { status: 400 });
    }

    const record = upsertSharedChat(body.payload, body.id);
    return NextResponse.json({ id: record.id, updatedAt: record.updatedAt });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}

