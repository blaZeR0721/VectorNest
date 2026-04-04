import { useCallback, useEffect, useRef, useState } from "react";

import {
  CheckCircle2,
  FileText,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type IndexedDocument,
  type UploadProgress,
  deleteDocument,
  fetchDocuments,
  uploadDocument,
  validateFile,
} from "@/services/uploadservice";

export function FileUploader() {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [indexed, setIndexed] = useState<IndexedDocument[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await fetchDocuments();
      setIndexed(docs);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        const uploadId = crypto.randomUUID();
        const error = validateFile(file);
        if (error) {
          setUploads((prev) => [
            ...prev,
            {
              id: uploadId,
              fileName: file.name,
              progress: 0,
              status: "error",
              error,
            },
          ]);
          continue;
        }

        setUploads((prev) => [
          ...prev,
          {
            id: uploadId,
            fileName: file.name,
            progress: 0,
            status: "uploading",
          },
        ]);

        try {
          await uploadDocument(file, (progress) => {
            setUploads((prev) =>
              prev.map((u) => (u.id === uploadId ? { ...u, progress } : u))
            );
          });
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId ? { ...u, progress: 100, status: "success" } : u
            )
          );
          await loadDocuments();
        } catch (err) {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId
                ? {
                    ...u,
                    status: "error",
                    error: err instanceof Error ? err.message : "Upload failed",
                  }
                : u
            )
          );
        }
      }
    },
    [loadDocuments]
  );

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const handleDelete = async (fileName: string) => {
    const doc = indexed.find((d) => d.filename === fileName);
    if (!doc) return;
    try {
      await deleteDocument(doc.file_hash);
      setIndexed((prev) => prev.filter((d) => d.file_hash !== doc.file_hash));
      setUploads((prev) => prev.filter((u) => u.fileName !== fileName));
    } catch {
      // silently fail
    }
  };

  const allEntries = [
    ...indexed.map((doc) => ({
      id: doc.file_hash,
      fileName: doc.filename,
      source: "indexed" as const,
      doc,
    })),
    ...uploads
      .filter(
        (u) =>
          !indexed.some((d) => d.filename === u.fileName) ||
          u.status === "error"
      )
      .map((u) => ({
        id: u.id,
        fileName: u.fileName,
        source: "upload" as const,
        upload: u,
      })),
  ];

  return (
    <div className="p-4 space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          processFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground"
        )}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drop files here or{" "}
          <span className="text-primary font-medium">browse</span>
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          PDF, TXT, DOCX, CSV
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.docx,.csv"
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
      </div>

      {allEntries.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
          {allEntries.map((entry) => {
            const isIndexed = entry.source === "indexed";
            const upload = entry.source === "upload" ? entry.upload : null;
            const isError = upload?.status === "error";

            return (
              <div
                key={entry.id}
                className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-xs"
              >
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />

                {isError ? (
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate text-foreground">
                      {entry.fileName}
                    </span>
                    <span
                      className="truncate text-destructive text-[10px]"
                      title={upload.error}
                    >
                      <XCircle className="w-3 h-3 inline mr-1" />
                      {upload.error}
                    </span>
                  </div>
                ) : (
                  <span className="truncate flex-1 text-foreground">
                    {entry.fileName}
                  </span>
                )}

                {upload?.status === "uploading" && (
                  <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}

                {isIndexed && (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                )}

                {isIndexed ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(entry.fileName)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={() => removeUpload(entry.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
