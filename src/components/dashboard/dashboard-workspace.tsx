"use client";

import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, FileText, Mic, Plus, Send, WandSparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getScopeTemplateById } from "@/lib/scope-templates";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Minimal typings for Chromium's Web Speech API (not in all TS dom libs). */
type WebSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { results: WebSpeechResultList }) => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
};

type WebSpeechResultList = {
  readonly length: number;
  item(index: number): WebSpeechResult;
  [index: number]: WebSpeechResult;
};

type WebSpeechResult = {
  readonly isFinal: boolean;
  item(index: number): WebSpeechAlternative;
  [index: number]: WebSpeechAlternative;
};

type WebSpeechAlternative = {
  transcript: string;
};

type PptxGenInstance = {
  layout: string;
  author: string;
  subject: string;
  title: string;
  addSlide(): {
    background?: { color: string };
    addText(
      text: string | { text: string; options?: { bullet?: { indent?: number } } }[],
      options: Record<string, unknown>
    ): void;
  };
  writeFile(options: { fileName: string }): Promise<void>;
};

type PptxGenCtor = new () => PptxGenInstance;

type WindowWithPptx = Window & {
  PptxGenJS?: PptxGenCtor;
};

type UserFilePreview =
  | { kind: "image"; name: string; src: string }
  | { kind: "pdf"; name: string; src: string }
  | { kind: "audio"; name: string; src: string }
  | { kind: "text"; name: string; content: string };

type ThreadMessage = {
  role: "user" | "assistant";
  /** Full message for the API (includes inlined text files). */
  text: string;
  /** When `filePreviews` is set, the short line the user typed (shown in the bubble). */
  caption?: string;
  filePreviews?: UserFilePreview[];
};

type PendingFile = {
  id: string;
  file: File;
  previewUrl: string | null;
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

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_FILES = 8;
const FILE_ACCEPT =
  "image/*,audio/*,.pdf,.txt,.md,.json,.csv,text/*,application/pdf,application/json";
const CHAT_TITLES_STORAGE_KEY = "hubble.chatTitles";
const CHAT_THREADS_STORAGE_KEY = "hubble.chatThreads";

function randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read file"));
        return;
      }
      const base64 = result.includes(",") ? result.split(",")[1]! : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function ChatFilePreviewBlock({ file }: { file: UserFilePreview }) {
  if (file.kind === "image") {
    return (
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
        <Image
          src={file.src}
          alt={file.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }
  if (file.kind === "pdf") {
    return (
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
          <FileText className="h-4 w-4 shrink-0 text-red-600" />
          <span className="min-w-0 flex-1 truncate text-left">{file.name}</span>
          <span className="shrink-0 text-slate-400">PDF</span>
        </div>
        <iframe title={file.name} src={file.src} className="h-52 w-full bg-slate-100" />
      </div>
    );
  }
  if (file.kind === "audio") {
    return (
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
          <Mic className="h-4 w-4 shrink-0 text-red-600" />
          <span className="min-w-0 flex-1 truncate text-left">{file.name}</span>
          <span className="shrink-0 text-slate-400">Audio</span>
        </div>
        <div className="px-3 py-3">
          <audio controls className="w-full">
            <source src={file.src} />
            Your browser does not support audio playback.
          </audio>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
        <FileText className="h-4 w-4 shrink-0 text-slate-600" />
        <span className="min-w-0 flex-1 truncate text-left">{file.name}</span>
        <span className="shrink-0 text-slate-400">Text</span>
      </div>
      <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words border-t border-slate-50 bg-slate-50/50 px-3 py-2.5 text-left text-[13px] leading-relaxed text-slate-800">
        {file.content}
      </pre>
    </div>
  );
}

function getSpeechRecognitionCtor(): (new () => WebSpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => WebSpeechRecognition;
    webkitSpeechRecognition?: new () => WebSpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

async function loadBrowserPptxGenCtor(): Promise<PptxGenCtor> {
  if (typeof window === "undefined") {
    throw new Error("PPT export is only available in the browser.");
  }

  const win = window as WindowWithPptx;
  if (win.PptxGenJS) return win.PptxGenJS;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-pptxgenjs="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load PPT library.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/pptxgenjs@4.0.1/dist/pptxgen.bundle.js";
    script.async = true;
    script.dataset.pptxgenjs = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PPT library."));
    document.body.appendChild(script);
  });

  if (!win.PptxGenJS) {
    throw new Error("PPT library loaded but could not be initialized.");
  }
  return win.PptxGenJS;
}

export function DashboardWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const chatId = searchParams.get("chat");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const THINKING_TEXT = "Thinking...";
  const removeLastThinking = (items: ThreadMessage[]) => {
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i]!.role === "assistant" && items[i]!.text === THINKING_TEXT) {
        return [...items.slice(0, i), ...items.slice(i + 1)];
      }
    }
    return items;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [specLoading, setSpecLoading] = useState(false);
  const [specError, setSpecError] = useState<string | null>(null);
  const [productSpec, setProductSpec] = useState<ProductSpec | null>(null);
  const [finalDocumentText, setFinalDocumentText] = useState("");
  const [intakeComplete, setIntakeComplete] = useState(false);

  const recognitionRef = useRef<WebSpeechRecognition | null>(null);
  const promptAtListenStartRef = useRef("");

  const defaultMessages: ThreadMessage[] = [
    {
      role: "assistant",
      text: "Let us build your scope through a short chat. Start by telling me your product idea.",
    },
  ];
  const [messages, setMessages] = useState<ThreadMessage[]>(defaultMessages);
  const hasUserMessages = messages.some((message) => message.role === "user");

  const lastTemplateIdRef = useRef<string | null>(null);

  function parseAssistantReply(rawText: string) {
    const token = "[INTAKE_COMPLETE]";
    const trimmed = rawText.trim();
    const completed = trimmed.startsWith(token);
    const text = completed ? trimmed.slice(token.length).trim() : trimmed;
    return { text, completed };
  }

  useEffect(() => {
    if (!chatId) return;
    setPrompt("");
    setPendingFiles([]);
    setSpeechError(null);
    setProductSpec(null);
    setFinalDocumentText("");
    setSpecError(null);
    setIntakeComplete(false);
    lastTemplateIdRef.current = null;
    try {
      const raw = window.localStorage.getItem(CHAT_THREADS_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, { messages?: ThreadMessage[] }>) : {};
      const saved = parsed[chatId]?.messages;
      if (saved?.length) {
        setMessages(saved);
        return;
      }
    } catch {
      // Ignore localStorage failures.
    }
    setMessages(defaultMessages);
  }, [chatId]);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthenticated(Boolean(data.session?.user));
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  function makeChatTitle(input: string) {
    const normalized = input.replace(/\s+/g, " ").trim();
    if (!normalized) return "New chat";
    return normalized.length > 60 ? `${normalized.slice(0, 60)}...` : normalized;
  }

  function saveChatTitle(id: string, title: string) {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(CHAT_TITLES_STORAGE_KEY);
      const existing = raw ? (JSON.parse(raw) as { id: string; title: string; createdAt: string }[]) : [];
      const next = [
        { id, title, createdAt: new Date().toISOString() },
        ...existing.filter((entry) => entry.id !== id),
      ].slice(0, 20);
      window.localStorage.setItem(CHAT_TITLES_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("hubble:chat-titles-updated"));
    } catch {
      // Ignore localStorage failures.
    }
  }

  useEffect(() => {
    if (!chatId) return;
    try {
      const raw = window.localStorage.getItem(CHAT_THREADS_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, { messages: ThreadMessage[]; updatedAt: string }>) : {};
      parsed[chatId] = { messages, updatedAt: new Date().toISOString() };
      window.localStorage.setItem(CHAT_THREADS_STORAGE_KEY, JSON.stringify(parsed));
    } catch {
      // Ignore localStorage failures.
    }
  }, [chatId, messages]);

  async function onGoogleLogin() {
    setSpeechError(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) setSpeechError(error.message);
  }

  function updateSectionContent(key: string, value: string) {
    setProductSpec((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((section) => (section.key === key ? { ...section, content: value } : section)),
      };
    });
  }

  function buildFinalDocument(spec: ProductSpec) {
    const chunks = [
      `${spec.productTitle || "Untitled Product Spec"}`,
      `${"=".repeat((spec.productTitle || "Untitled Product Spec").length)}`,
      "",
      spec.oneLiner || "",
      "",
      ...spec.sections.flatMap((section) => [section.title, "-".repeat(section.title.length), section.content || "", ""]),
    ];
    return chunks.join("\n").trim();
  }

  function toSlideBullets(content: string) {
    return content
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 7)
      .map((line) => (line.length > 120 ? `${line.slice(0, 117)}...` : line));
  }

  async function downloadPitchDeck() {
    if (!productSpec) return;
    try {
      const PptxGenJS = await loadBrowserPptxGenCtor();
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";
      pptx.author = "Hubble";
      pptx.subject = "Auto-generated product pitch deck";
      pptx.title = `${productSpec.productTitle} Pitch Deck`;

      const titleSlide = pptx.addSlide();
      titleSlide.background = { color: "7F1D1D" };
      titleSlide.addText(productSpec.productTitle || "Product Pitch Deck", {
        x: 0.7,
        y: 1.2,
        w: 12,
        h: 1,
        fontSize: 38,
        bold: true,
        color: "FFFFFF",
      });
      titleSlide.addText(productSpec.oneLiner || "Generated by Hubble", {
        x: 0.7,
        y: 2.3,
        w: 11.5,
        h: 1.5,
        fontSize: 19,
        color: "FEE2E2",
      });
      titleSlide.addText("Generated by Hubble", {
        x: 0.7,
        y: 6.5,
        w: 4,
        h: 0.4,
        fontSize: 12,
        color: "FECACA",
      });

      for (const section of productSpec.sections) {
        const slide = pptx.addSlide();
        slide.background = { color: "FFF7F7" };
        slide.addText(section.title, {
          x: 0.6,
          y: 0.45,
          w: 12.1,
          h: 0.7,
          fontSize: 26,
          bold: true,
          color: "7F1D1D",
        });

        const bullets = toSlideBullets(section.content);
        if (bullets.length) {
          slide.addText(
            bullets.map((text) => ({ text, options: { bullet: { indent: 18 } } })),
            {
              x: 0.9,
              y: 1.4,
              w: 11.8,
              h: 5.2,
              fontSize: 17,
              color: "3F3F46",
              breakLine: true,
              valign: "top",
            }
          );
        } else {
          slide.addText("No content provided for this section yet.", {
            x: 0.9,
            y: 1.6,
            w: 11.5,
            h: 1,
            fontSize: 14,
            color: "71717A",
          });
        }
      }

      const baseName = (productSpec.productTitle || "product-pitch-deck")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      await pptx.writeFile({ fileName: `${baseName || "product-pitch-deck"}.pptx` });
    } catch (error) {
      setSpecError(error instanceof Error ? error.message : "Could not create PPT file.");
    }
  }

  function downloadTextDocument() {
    if (!finalDocumentText.trim()) return;
    const baseName = (productSpec?.productTitle || "product-spec")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const blob = new Blob([finalDocumentText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${baseName || "product-spec"}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  async function generateProductSpec() {
    if (!messages.some((m) => m.role === "user")) {
      setSpecError("Send at least one message first so I can build the product spec.");
      return;
    }
    setSpecLoading(true);
    setSpecError(null);
    try {
      const res = await fetch("/api/product/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate product spec");
      const spec = data.spec as ProductSpec;
      setProductSpec(spec);
      setFinalDocumentText(buildFinalDocument(spec));
    } catch (error) {
      setSpecError(error instanceof Error ? error.message : "Could not generate product spec.");
    } finally {
      setSpecLoading(false);
    }
  }

  useEffect(() => {
    if (!templateId) return;
    if (lastTemplateIdRef.current === templateId) return;

    const template = getScopeTemplateById(templateId);
    if (!template) return;
    lastTemplateIdRef.current = templateId;

    // Start a new chat context when a template is selected.
    setPrompt("");
    setPendingFiles([]);
    setIntakeComplete(false);

    const comprehensivePrompt = [
      `Template selected: ${template.name}.`,
      `Template description: ${template.description}`,
      `Industry: ${template.industry}.`,
      `Client goal: Build a client-ready blueprint for this use-case.`,
      ``,
      `First, ask ONE intake question that is most critical for producing a high-quality scope for this template.`,
      `Suggested intake options (use whichever fits best):`,
      `- target customer and geography`,
      `- key features they definitely want`,
      `- budget range`,
      `- preferred timeline`,
      ``,
      `Do not output the full scope yet. Keep the response conversational and short.`,
    ].join("\n");

    // Prefill the chat UI (and attach the same prompt to the AI request)
    setMessages([
      {
        role: "assistant",
        text: `You selected "${template.name}".`,
      },
      {
        role: "user",
        text: comprehensivePrompt,
      },
    ]);

    (async () => {
      try {
        setLoading(true);
        setMessages((prev) => [...prev, { role: "assistant", text: THINKING_TEXT }]);

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", text: comprehensivePrompt }],
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to chat");

        const parsed = parseAssistantReply(String(data.reply ?? data?.reply ?? ""));
        if (parsed.completed) setIntakeComplete(true);
        setMessages((prev) => {
          const cleaned = removeLastThinking(prev);
          return [...cleaned, ...(parsed.text ? [{ role: "assistant" as const, text: parsed.text }] : [])];
        });
      } catch {
        setMessages((prev) => {
          const cleaned = removeLastThinking(prev);
          return [
            ...cleaned,
            {
              role: "assistant",
              text: `I couldn't reach the AI right now. Please tell me a bit about the client for "${template.name}".`,
            },
          ];
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [templateId]);

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: { results: WebSpeechResultList }) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i]![0]!.transcript;
      }
      const prefix = promptAtListenStartRef.current;
      const spacer = prefix && !prefix.endsWith(" ") && transcript && !transcript.startsWith(" ") ? " " : "";
      setPrompt(prefix + spacer + transcript);
    };

    recognition.onerror = (event: { error: string; message?: string }) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      setSpeechError(event.message || event.error || "Speech recognition failed");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, []);

  const revokePending = useCallback((items: PendingFile[]) => {
    items.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
  }, []);

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;
      setSpeechError(null);
      const next: PendingFile[] = [];
      let total = pendingFiles.length;
      for (let i = 0; i < fileList.length; i++) {
        if (total >= MAX_FILES) break;
        const file = fileList.item(i);
        if (!file) continue;
        if (file.size > MAX_FILE_BYTES) {
          setSpeechError(`"${file.name}" is larger than 4MB.`);
          continue;
        }
        const isImage = file.type.startsWith("image/");
        const previewUrl = isImage ? URL.createObjectURL(file) : null;
        next.push({ id: randomId(), file, previewUrl });
        total += 1;
      }
      if (next.length) setPendingFiles((prev) => [...prev, ...next]);
    },
    [pendingFiles.length]
  );

  const removePendingFile = useCallback((id: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const toggleListening = useCallback(() => {
    setSpeechError(null);
    const rec = recognitionRef.current;
    if (!rec) {
      setSpeechError("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (listening) {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      setListening(false);
      return;
    }

    promptAtListenStartRef.current = prompt;
    try {
      rec.start();
      setListening(true);
    } catch (e) {
      setSpeechError(e instanceof Error ? e.message : "Could not start microphone");
      setListening(false);
    }
  }, [listening, prompt]);

  async function sendMessage() {
    const trimmed = prompt.trim();
    if (loading) return;
    if (!trimmed && pendingFiles.length === 0) return;
    if (!isAuthenticated) {
      setSpeechError("Please login with Google before sending a chat.");
      return;
    }

    const effectiveChatId = chatId || `${Date.now()}`;
    if (!chatId) {
      router.replace(`/dashboard?chat=${encodeURIComponent(effectiveChatId)}`);
    }

    const hasPriorUserMessage = messages.some((m) => m.role === "user");
    if (!hasPriorUserMessage) {
      saveChatTitle(effectiveChatId, makeChatTitle(trimmed));
    }

    const textChunks: string[] = [];
    if (trimmed) textChunks.push(trimmed);

    const attachments: { mimeType: string; data: string }[] = [];
    const filePreviews: UserFilePreview[] = [];

    for (const p of pendingFiles) {
      const f = p.file;
      const isPlainText =
        f.type.startsWith("text/") ||
        /\.(txt|md|json|csv)$/i.test(f.name) ||
        f.type === "application/json";

      if (isPlainText) {
        try {
          const textContent = await f.text();
          textChunks.push(`\n\n[File: ${f.name}]\n${textContent}`);
          filePreviews.push({ kind: "text", name: f.name, content: textContent });
        } catch {
          textChunks.push(`\n\n[File: ${f.name}]\n(Could not read file.)`);
          filePreviews.push({
            kind: "text",
            name: f.name,
            content: "(Could not read file.)",
          });
        }
        continue;
      }

      if (!f.type.startsWith("image/") && !f.type.startsWith("audio/") && f.type !== "application/pdf") {
        setSpeechError(`Unsupported type for "${f.name}". Use images, audio, PDF, or text files.`);
        return;
      }

      try {
        const data = await readFileAsBase64(f);
        const mimeType = f.type || "application/octet-stream";
        attachments.push({ mimeType, data });
        if (f.type.startsWith("image/")) {
          filePreviews.push({
            kind: "image",
            name: f.name,
            src: p.previewUrl || `data:${mimeType};base64,${data}`,
          });
        } else if (f.type.startsWith("audio/")) {
          filePreviews.push({
            kind: "audio",
            name: f.name,
            src: `data:${mimeType};base64,${data}`,
          });
        } else {
          filePreviews.push({
            kind: "pdf",
            name: f.name,
            src: `data:${mimeType};base64,${data}`,
          });
        }
      } catch {
        setSpeechError(`Could not read "${f.name}".`);
        return;
      }
    }

    const composed =
      textChunks.join("").trim() ||
      (attachments.length ? "Please review the attached file(s)." : "");

    const hasFileUi = filePreviews.length > 0;
    const nextThread = [
      ...messages,
      {
        role: "user" as const,
        text: composed,
        ...(hasFileUi ? { caption: trimmed, filePreviews } : {}),
      },
    ];

    const toRevoke = [...pendingFiles];
    setMessages(nextThread);
    setPrompt("");
    setPendingFiles([]);
    revokePending(toRevoke);

    const apiMessages = nextThread.map((m, idx) => {
      if (m.role === "assistant") {
        return { role: "assistant" as const, text: m.text };
      }
      const isLatestUser = idx === nextThread.length - 1;
      if (isLatestUser && attachments.length > 0) {
        return { role: "user" as const, text: m.text, attachments };
      }
      return { role: "user" as const, text: m.text };
    });

    setLoading(true);
    try {
      setMessages((prev) => [...prev, { role: "assistant", text: THINKING_TEXT }]);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to chat");
      const parsed = parseAssistantReply(String(data.reply ?? ""));
      if (parsed.completed) setIntakeComplete(true);
      setMessages((prev) => {
        const cleaned = removeLastThinking(prev);
        return [...cleaned, { role: "assistant", text: parsed.text }];
      });
    } catch (error) {
      setMessages((prev) => {
        const cleaned = removeLastThinking(prev);
        return [
          ...cleaned,
          {
            role: "assistant",
            text: error instanceof Error ? `I hit an error: ${error.message}` : "I hit an unknown error.",
          },
        ];
      });
    } finally {
      setLoading(false);
    }
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] w-full max-w-6xl flex-col items-center">
      {!hasUserMessages ? (
        <div className="w-full max-w-4xl space-y-4 text-center">
          <p className="text-3xl font-semibold tracking-tight text-slate-900">Hi there</p>
          <h2 className="text-5xl font-semibold leading-tight tracking-tight text-slate-900">
            Where should we start?
          </h2>
        </div>
      ) : null}

      <div className="mt-10 w-full max-w-4xl">
        <div className="space-y-7">
          {messages.map((message, idx) => (
            <div key={`${message.role}-${idx}`} className="w-full">
              {message.role === "user" ? (
                <div className="ml-auto flex w-full max-w-[85%] flex-col items-end gap-2 sm:max-w-[70%]">
                  {message.filePreviews?.length ? (
                    <div className="flex w-full flex-col items-end gap-2">
                      {message.filePreviews.length > 1 && message.filePreviews.every((f) => f.kind === "image") ? (
                        <div className="flex flex-wrap justify-end gap-2">
                          {message.filePreviews.map((file, i) => (
                            <ChatFilePreviewBlock key={`${file.kind}-${file.name}-${i}`} file={file} />
                          ))}
                        </div>
                      ) : (
                        message.filePreviews.map((file, i) => (
                          <ChatFilePreviewBlock key={`${file.kind}-${file.name}-${i}`} file={file} />
                        ))
                      )}
                    </div>
                  ) : null}
                  {message.filePreviews?.length ? (
                    message.caption?.trim() ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-slate-900 shadow-sm">
                        <p className="whitespace-pre-wrap text-left">{message.caption}</p>
                      </div>
                    ) : null
                  ) : (
                    <div className="w-fit rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-slate-900 shadow-sm">
                      <p className="whitespace-pre-wrap text-left">{message.text}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-black shadow-sm">
                    <video autoPlay muted loop playsInline className="h-full w-full object-cover">
                      <source src="/clock.mp4" type="video/mp4" />
                    </video>
                  </div>
                  <div className="min-w-0 flex-1 leading-relaxed text-slate-800">
                    <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{message.text}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {intakeComplete || productSpec ? (
        <div className="mt-8 w-full max-w-4xl rounded-3xl border border-red-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-slate-900">Product Builder</p>
              <p className="text-sm text-slate-600">
                Generate a full product spec from this chat, edit sections, and download a text document.
              </p>
            </div>
            <Button
              type="button"
              onClick={generateProductSpec}
              disabled={specLoading || loading || !hasUserMessages}
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
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">
                  Product Title
                </label>
                <input
                  value={productSpec.productTitle}
                  onChange={(e) => setProductSpec((prev) => (prev ? { ...prev, productTitle: e.target.value } : prev))}
                  className="h-10 w-full rounded-lg border border-red-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-red-400"
                />
                <label className="mb-1 mt-3 block text-xs font-medium uppercase tracking-wide text-slate-600">
                  One-liner
                </label>
                <textarea
                  value={productSpec.oneLiner}
                  onChange={(e) => setProductSpec((prev) => (prev ? { ...prev, oneLiner: e.target.value } : prev))}
                  rows={2}
                  className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-400"
                />
              </div>

              {productSpec.sections.map((section) => (
                <div key={section.key} className="rounded-2xl border border-red-100 p-4">
                  <p className="mb-2 text-sm font-semibold text-slate-900">{section.title}</p>
                  <textarea
                    value={section.content}
                    onChange={(e) => updateSectionContent(section.key, e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-red-400"
                  />
                </div>
              ))}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  onClick={downloadPitchDeck}
                >
                  <Download className="h-4 w-4" />
                  Download PPT
                </Button>
                <Button
                  type="button"
                  onClick={downloadTextDocument}
                  disabled={!finalDocumentText.trim()}
                  className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  Download TXT
                </Button>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
                <p className="mb-2 text-sm font-semibold text-slate-900">Final Document Preview</p>
                <textarea
                  value={finalDocumentText}
                  onChange={(e) => setFinalDocumentText(e.target.value)}
                  rows={14}
                  className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-red-400"
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mx-auto mt-8 w-full max-w-4xl">
        <div className="w-full overflow-hidden rounded-[1.75rem] border border-red-100 bg-white shadow-[0_8px_30px_rgb(127,29,29,0.08)]">
          {!isAuthenticated ? (
            <div className="flex flex-col gap-2 border-b border-red-100 bg-red-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-slate-700">Login with Google before sending your first chat.</p>
              <Button
                type="button"
                onClick={onGoogleLogin}
                className="h-9 bg-red-600 px-4 text-white hover:bg-red-700"
              >
                Continue with Google
              </Button>
            </div>
          ) : null}
          <label htmlFor="scope-prompt" className="sr-only">
            Describe your project
          </label>

          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            multiple
            accept={FILE_ACCEPT}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {pendingFiles.length > 0 ? (
            <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3 sm:px-6">
              {pendingFiles.map((p) => (
                <div
                  key={p.id}
                  className="group relative flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 py-1 pl-1 pr-8 text-left text-xs text-slate-700"
                >
                  {p.previewUrl ? (
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={p.previewUrl}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </span>
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-100 text-[10px] font-medium text-red-700">
                      FILE
                    </span>
                  )}
                  <span className="max-w-[140px] truncate">{p.file.name}</span>
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-red-100 hover:text-red-700"
                    onClick={() => removePendingFile(p.id)}
                    aria-label={`Remove ${p.file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {speechError ? (
            <p className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs text-amber-900 sm:px-6">
              {speechError}
            </p>
          ) : null}

          {/* Top: input */}
          <div className="flex items-start gap-3 px-5 pb-2 pt-5 sm:gap-4 sm:px-6 sm:pt-6">
            <textarea
              id="scope-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={onComposerKeyDown}
              placeholder="Ask Hubble"
              rows={3}
              className="min-h-[5.5rem] flex-1 resize-none bg-transparent text-[15px] leading-6 text-slate-900 placeholder:text-slate-400 outline-none ring-0 focus:ring-0"
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-slate-600 hover:bg-red-50 hover:text-red-700"
                aria-label="Add files or images"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-5 w-5" strokeWidth={2} />
              </Button>
            </div>

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPrompt("");
                  revokePending(pendingFiles);
                  setPendingFiles([]);
                }}
                className="hidden h-9 px-2 text-sm font-normal text-slate-500 hover:bg-red-50 hover:text-red-700 sm:inline-flex"
              >
                Clear
              </Button>
              <Button
                type="button"
                size="icon"
                className="h-9 w-9 rounded-full bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                onClick={sendMessage}
                disabled={loading || !isAuthenticated}
                aria-label={loading ? "Sending" : "Send message"}
                title={!isAuthenticated ? "Login required" : loading ? "Sending…" : "Send"}
              >
                <Send className="h-4 w-4" strokeWidth={2} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-9 w-9 text-slate-600 hover:bg-red-50 hover:text-red-700 ${listening ? "bg-red-50 text-red-600 ring-2 ring-red-200" : ""}`}
                aria-label={listening ? "Stop voice input" : "Voice input"}
                title={listening ? "Stop listening" : "Speak to type"}
                onClick={toggleListening}
              >
                <Mic className="h-5 w-5" strokeWidth={2} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
