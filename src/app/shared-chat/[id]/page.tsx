import { redirect } from "next/navigation";

export default function SharedChatShortLinkPage({ params }: { params: { id: string } }) {
  redirect(`/shared-chat?id=${encodeURIComponent(params.id)}`);
}

