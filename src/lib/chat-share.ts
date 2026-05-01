export type SharedChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export type SharedProductSection = {
  key: string;
  title: string;
  content: string;
};

export type SharedProductSpec = {
  productTitle: string;
  oneLiner: string;
  sections: SharedProductSection[];
};

export type SharedProductWireframeBlock = {
  id: string;
  title: string;
  objective: string;
  contentItems: string[];
  ctaLabel?: string;
};

export type SharedProductWireframe = {
  pageName: string;
  blocks: SharedProductWireframeBlock[];
};

export type SharedProductLandingSection = {
  id: string;
  title: string;
  body: string;
};

export type SharedProductLandingPage = {
  slug: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryCta: string;
  secondaryCta: string;
  sections: SharedProductLandingSection[];
};

export type SharedChatPayload = {
  v: 1;
  createdAt: string;
  messages: SharedChatMessage[];
  intakeComplete?: boolean;
  productSpec?: SharedProductSpec | null;
  finalDocumentText?: string;
  productWireframe?: SharedProductWireframe | null;
  productLandingPage?: SharedProductLandingPage | null;
  generationChoice?: "skip" | "wireframe" | "landing" | "both";
};

const MAX_SHARE_PARAM_LENGTH = 14000;

function toBase64Url(value: string) {
  if (typeof window === "undefined") return "";
  const utf8 = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  return btoa(utf8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  if (typeof window === "undefined") return "";
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const encoded = Array.from(binary)
    .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
    .join("");
  return decodeURIComponent(encoded);
}

export function buildSharedChatParam(input: Omit<SharedChatPayload, "v" | "createdAt">) {
  const payload: SharedChatPayload = {
    v: 1,
    createdAt: new Date().toISOString(),
    ...input,
  };
  const encoded = toBase64Url(JSON.stringify(payload));
  if (!encoded || encoded.length > MAX_SHARE_PARAM_LENGTH) return null;
  return encoded;
}

export function parseSharedChatParam(value: string | null): SharedChatPayload | null {
  if (!value) return null;
  try {
    const raw = fromBase64Url(value);
    const parsed = JSON.parse(raw) as SharedChatPayload;
    if (parsed?.v !== 1 || !Array.isArray(parsed.messages)) return null;
    const sanitizedMessages = parsed.messages
      .filter((item) => (item.role === "user" || item.role === "assistant") && typeof item.text === "string")
      .map((item) => ({ role: item.role, text: item.text }));
    if (!sanitizedMessages.length) return null;
    return {
      v: 1,
      createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : new Date().toISOString(),
      messages: sanitizedMessages,
      intakeComplete: Boolean(parsed.intakeComplete),
      productSpec: parsed.productSpec ?? null,
      finalDocumentText: typeof parsed.finalDocumentText === "string" ? parsed.finalDocumentText : "",
      productWireframe: parsed.productWireframe ?? null,
      productLandingPage: parsed.productLandingPage ?? null,
      generationChoice:
        parsed.generationChoice === "wireframe" ||
        parsed.generationChoice === "landing" ||
        parsed.generationChoice === "both"
          ? parsed.generationChoice
          : "skip",
    };
  } catch {
    return null;
  }
}

