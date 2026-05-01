import { NextResponse } from "next/server";
import { getSharedChat } from "@/lib/shared-chat-store";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "Missing share id." }, { status: 400 });
  }
  const record = getSharedChat(id);
  if (!record) {
    return NextResponse.json({ error: "Shared chat not found." }, { status: 404 });
  }
  return NextResponse.json({ payload: record.payload, updatedAt: record.updatedAt });
}

