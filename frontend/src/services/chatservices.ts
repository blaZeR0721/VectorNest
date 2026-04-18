import { API_URL } from "@/config/env";

import { authFetch } from "./authservice";

export interface ChatRequest {
  query: string;
  k?: number;
  mode?: "summary" | "detailed";
}

export interface ChatResponse {
  answer: string;
  sources?: string[];
}

export async function sendChatMessage(
  payload: ChatRequest
): Promise<ChatResponse> {
  const res = await authFetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Couldn't send your message. Try again.";
    if (res.status === 401) message = "Session expired. Please log in again.";
    else if (res.status >= 500)
      message = "Server error. Try again in a moment.";
    throw new Error(message);
  }

  return res.json();
}

export async function sendChatMessageStream(
  payload: ChatRequest,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await authFetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    let message = "Couldn't send your message. Try again.";
    if (res.status === 401) message = "Session expired. Please log in again.";
    else if (res.status >= 500)
      message = "Server error. Try again in a moment.";
    throw new Error(message);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  // ✅ One shared decoder instance across all chunks
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      // ✅ Flush remaining bytes in the decoder buffer
      const final = decoder.decode();
      if (final) onChunk(final);
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    if (chunk) onChunk(chunk);
  }
}
