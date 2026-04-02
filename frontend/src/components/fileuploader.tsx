import { useState, useRef, useCallback } from "react";
import { Upload, FileText, CheckCircle2, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadDocument, validateFile, type UploadProgress } from "@/services/uploadservice";
import { cn } from "@/lib/utils";

export function FileUploader() {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        setUploads((prev) => [
          ...prev,
          { fileName: file.name, progress: 0, status: "error", error },
        ]);
        continue;
      }

      setUploads((prev) => [
        ...prev,
        { fileName: file.name, progress: 0, status: "uploading" },
      ]);

      try {
        await uploadDocument(file, (progress) => {
          setUploads((prev) =>
            prev.map((u) => (u.fileName === file.name ? { ...u, progress } : u))
          );
        });
        setUploads((prev) =>
          prev.map((u) =>
            u.fileName === file.name ? { ...u, progress: 100, status: "success" } : u
          )
        );
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.fileName === file.name
              ? { ...u, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
              : u
          )
        );
      }
    }
  }, []);

  const removeUpload = (fileName: string) => {
    setUploads((prev) => prev.filter((u) => u.fileName !== fileName));
  };

  return (
    <div className="p-4 space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
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
          Drop files here or <span className="text-primary font-medium">browse</span>
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">PDF, TXT, DOCX, CSV — max 50MB</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.docx,.csv"
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
          {uploads.map((u) => (
            <div
              key={u.fileName}
              className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-xs"
            >
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate flex-1 text-foreground">{u.fileName}</span>

              {u.status === "uploading" && (
                <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
              {u.status === "success" && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
              {u.status === "error" && (
                <span className="text-destructive truncate max-w-[120px]" title={u.error}>
                  <XCircle className="w-4 h-4 inline mr-1" />
                  {u.error}
                </span>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0"
                onClick={() => removeUpload(u.fileName)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
