const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface ChatRequest {
  query: string;
}

export interface ChatResponse {
  response: string;
  sources?: string[];
}

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }

  return res.json();
}
