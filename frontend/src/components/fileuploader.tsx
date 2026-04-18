import { useCallback, useEffect, useRef, useState } from "react";

import {
  CheckCircle2,
  FileText,
  Loader2,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type DocumentRecord,
  deleteDocument,
  listDocuments,
} from "@/services/documentservice";
import {
  type UploadResponse,
  uploadDocument,
  validateFile,
} from "@/services/uploadservice";

type UploadStatus = "uploading" | "success" | "error";

interface UploadItem {
  id: string; // unique per upload (not filename — handles duplicates)
  fileName: string;
  progress: number;
  status: UploadStatus;
  error?: string;
  chunkCount?: number;
}

const MAX_CONCURRENT = 3;

export function FileUploader() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load previously uploaded documents
  const refreshDocs = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const data = await listDocuments();
      setDocs(data);
    } catch (err) {
      console.error("Failed to load documents", err);
      toast.error("Couldn't load your files. Try again.");
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    refreshDocs();
  }, [refreshDocs]);

  const updateUpload = useCallback((id: string, patch: Partial<UploadItem>) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
    );
  }, []);

  const uploadOne = useCallback(
    async (file: File, id: string) => {
      try {
        const res: UploadResponse = await uploadDocument(file, (progress) => {
          updateUpload(id, { progress });
        });
        updateUpload(id, {
          progress: 100,
          status: "success",
          chunkCount: res.chunk_count,
        });
        // Refresh persisted docs after a successful upload
        refreshDocs();
      } catch (err) {
        console.error("Upload failed", err);
        updateUpload(id, {
          status: "error",
          error: "Upload failed. Try again.",
        });
        toast.error("Upload failed. Try again.");
      }
    },
    [updateUpload, refreshDocs]
  );

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const queue: { file: File; id: string }[] = [];

      // Validate first, queue valid ones
      const newItems: UploadItem[] = [];
      for (const file of fileArray) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const error = validateFile(file);
        if (error) {
          toast.error(error);
        } else {
          newItems.push({
            id,
            fileName: file.name,
            progress: 0,
            status: "uploading",
          });
          queue.push({ file, id });
        }
      }

      setUploads((prev) => [...prev, ...newItems]);

      // Concurrent worker pool
      let cursor = 0;
      const workers = Array.from(
        { length: Math.min(MAX_CONCURRENT, queue.length) },
        async () => {
          while (cursor < queue.length) {
            const idx = cursor++;
            const { file, id } = queue[idx];
            await uploadOne(file, id);
          }
        }
      );
      await Promise.all(workers);

      if (inputRef.current) inputRef.current.value = "";
    },
    [uploadOne]
  );

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const handleDeleteDoc = async (doc: DocumentRecord) => {
    setDeletingId(doc.id);
    try {
      await deleteDocument(doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      // Also remove any matching success row in the upload list
      setUploads((prev) =>
        prev.filter(
          (u) => !(u.status === "success" && u.fileName === doc.filename)
        )
      );
      toast.success(`Deleted ${doc.filename}`);
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Couldn't delete the file. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Hide active uploads that are already represented in persisted docs (by filename + success)
  const visibleUploads = uploads.filter(
    (u) =>
      !(u.status === "success" && docs.some((d) => d.filename === u.fileName))
  );

  return (
    <div className="p-4 space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
          dragOver
            ? "border-primary bg-primary/5 shadow-inner"
            : "border-border/60 hover:border-primary/40 hover:bg-primary/5"
        )}
      >
        <div
          className={cn(
            "w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center transition-colors",
            dragOver ? "bg-primary/15" : "bg-muted"
          )}
        >
          <Upload
            className={cn(
              "w-5 h-5 transition-colors",
              dragOver ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Drop files here or{" "}
          <span className="text-primary font-medium">browse</span>
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          PDF • DOCX • CSV • TXT
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.docx,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) processFiles(e.target.files);
          }}
        />
      </div>

      {/* Active uploads (in-progress or errors) */}
      {visibleUploads.length > 0 && (
        <div className="space-y-2">
          <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
            {visibleUploads.map((u) => (
              <div
                key={u.id}
                className="group flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 text-xs border border-border/30"
              >
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-foreground">{u.fileName}</p>
                  {u.status === "success" && u.chunkCount !== undefined && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Indexed • {u.chunkCount} chunks
                    </p>
                  )}
                </div>

                {u.status === "uploading" && (
                  <div className="flex items-center shrink-0">
                    <div className="w-14 h-1.5 bg-border/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                {u.status === "success" && (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                )}
                {u.status === "error" && (
                  <XCircle className="w-4 h-4 text-destructive shrink-0" />
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-5 w-5 shrink-0 opacity-70 transition-all",
                    "group-hover:opacity-100",
                    "text-muted-foreground group-hover:text-destructive hover:text-destructive",
                    "hover:bg-transparent"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUpload(u.id);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Persisted documents */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Your documents {docs.length > 0 && `(${docs.length})`}
          </p>
        </div>

        {loadingDocs && docs.length === 0 ? (
          <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
            Loading documents…
          </div>
        ) : docs.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/60 text-center py-3">
            No documents uploaded yet
          </p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2 text-xs border border-border/30 group"
              >
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span
                  className="truncate flex-1 text-foreground"
                  title={doc.filename}
                >
                  {doc.filename}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 shrink-0 opacity-70 group-hover:opacity-100 transition-all",
                    "text-muted-foreground group-hover:text-destructive hover:text-destructive",
                    "hover:bg-transparent"
                  )}
                  disabled={deletingId === doc.id}
                  onClick={() => handleDeleteDoc(doc)}
                  title="Delete document"
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
