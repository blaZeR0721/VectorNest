const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".csv", ".docx"];

const MAX_SIZE: Record<string, number> = {
  ".txt": 1 * 1024 * 1024,
  ".csv": 3 * 1024 * 1024,
  ".pdf": 10 * 1024 * 1024,
  ".docx": 5 * 1024 * 1024,
};

export function validateFile(file: File): string | null {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
    return `Unsupported file type. Allowed: .pdf, .txt, .csv, .docx`;
  }
  const maxSize = MAX_SIZE[ext] ?? 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return `File too large, maximum size for ${ext} files is ${maxSize / (1024 * 1024)}MB`;
  }
  return null;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

export interface IndexedDocument {
  file_hash: string;
  filename: string;
  chunk_count: number;
}

export async function uploadDocument(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ message: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.detail || `Upload failed: ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.open("POST", `${API_BASE}/api/uploads`);
    xhr.send(formData);
  });
}

export async function fetchDocuments(): Promise<IndexedDocument[]> {
  const res = await fetch(`${API_BASE}/api/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function deleteDocument(file_hash: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/documents/${file_hash}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete document");
}