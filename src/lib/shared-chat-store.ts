import type { SharedChatPayload } from "@/lib/chat-share";

type StoredSharedChat = {
  id: string;
  payload: SharedChatPayload;
  updatedAt: string;
};

type SharedChatStore = Map<string, StoredSharedChat>;

const STORE_KEY = "__hubble_shared_chat_store__";

function getStore(): SharedChatStore {
  const globalObj = globalThis as typeof globalThis & { [STORE_KEY]?: SharedChatStore };
  if (!globalObj[STORE_KEY]) {
    globalObj[STORE_KEY] = new Map<string, StoredSharedChat>();
  }
  return globalObj[STORE_KEY]!;
}

function createId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function upsertSharedChat(payload: SharedChatPayload, id?: string) {
  const store = getStore();
  const nextId = id && store.has(id) ? id : createId();
  const record: StoredSharedChat = {
    id: nextId,
    payload,
    updatedAt: new Date().toISOString(),
  };
  store.set(nextId, record);
  return record;
}

export function getSharedChat(id: string) {
  const store = getStore();
  return store.get(id) ?? null;
}

