import { API_URL } from "@/config/env";

import { authFetch } from "./authservice";

export interface DocumentRecord {
  id: string;
  filename: string;
  file_hash: string;
  user_id?: string;
  created_at?: string;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    // Keep user-facing errors simple. Avoid showing raw backend details in the UI.
    let message = "Couldn't complete that request. Try again.";
    if (res.status === 401) message = "Session expired. Please log in again.";
    else if (res.status === 404) message = "Not found.";
    else if (res.status === 413) message = "File is too large.";
    else if (res.status >= 500)
      message = "Server error. Try again in a moment.";
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const res = await authFetch(`${API_URL}/documents`);
  return handle<DocumentRecord[]>(res);
}

export async function deleteDocument(documentId: string): Promise<void> {
  const res = await authFetch(`${API_URL}/documents/${documentId}`, {
    method: "DELETE",
  });
  await handle<{ status: string; document_id: string }>(res);
}
