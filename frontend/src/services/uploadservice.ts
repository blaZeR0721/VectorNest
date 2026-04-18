import { API_URL } from "@/config/env";

import { getAccessToken, getRefreshToken, refreshTokens } from "./authservice";

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".csv", ".docx"] as const;

// Per-extension max sizes (bytes) — must match backend MAX_FILE_SIZE
const MAX_FILE_SIZE: Record<string, number> = {
  ".txt": 1 * 1024 * 1024,
  ".csv": 3 * 1024 * 1024,
  ".pdf": 10 * 1024 * 1024,
  ".docx": 5 * 1024 * 1024,
};

function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx).toLowerCase();
}

export function validateFile(file: File): string | null {
  const ext = getExtension(file.name);
  if (
    !ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])
  ) {
    return "Unsupported file type. Use PDF, TXT, DOCX, or CSV.";
  }
  const max = MAX_FILE_SIZE[ext];
  if (file.size > max) {
    return `File is too large. Max size for ${ext.toUpperCase()} is ${max / (1024 * 1024)}MB.`;
  }
  return null;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
  chunkCount?: number;
}

export interface UploadResponse {
  status: string;
  filename: string;
  chunk_count: number;
}

export async function uploadDocument(
  file: File,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<UploadResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("You must be logged in to upload files.");
  }

  const sendOnce = (bearerToken: string) =>
    new Promise<UploadResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file, file.name);

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText) as UploadResponse);
          } catch {
            reject(new Error("Invalid server response"));
          }
          return;
        }

        // Keep user-facing errors short and clear.
        let message = "Upload failed. Try again.";
        if (xhr.status === 401)
          message = "Session expired. Please log in again.";
        else if (xhr.status === 409) message = "This file is already uploaded.";
        else if (xhr.status === 413) message = "File is too large.";
        else if (xhr.status >= 500)
          message = "Server error. Try again in a moment.";

        const err = new Error(message) as Error & { status?: number };
        err.status = xhr.status;
        reject(err);
      });

      xhr.addEventListener("error", () =>
        reject(new Error("Network error. Check your connection and try again."))
      );
      xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));
      signal?.addEventListener(
        "abort",
        () => {
          xhr.abort();
        },
        { once: true }
      );

      xhr.open("POST", `${API_URL}/uploads`);
      xhr.setRequestHeader("Authorization", `Bearer ${bearerToken}`);
      xhr.send(formData);
    });

  try {
    return await sendOnce(token);
  } catch (e) {
    const err = e as Error & { status?: number };
    // If access token expired, refresh once and retry.
    if (err.status === 401 && getRefreshToken()) {
      await refreshTokens();
      const newToken = getAccessToken();
      if (!newToken) throw new Error("Session expired. Please log in again.");
      return await sendOnce(newToken);
    }
    throw e;
  }
}
