const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface ChatRequest {
  query: string;
}

export async function sendChatMessageStream(
  payload: ChatRequest,
  onChunk: (chunk: string) => Promise<void>
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    await onChunk(decoder.decode(value, { stream: true }));
  }
}
