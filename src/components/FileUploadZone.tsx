import { useState, useCallback } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatFileSize } from "@/lib/file-utils";

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

interface FileUploadZoneProps {
  folderId?: string | null;
  onUploadComplete: () => void;
}

export function FileUploadZone({ folderId, onUploadComplete }: FileUploadZoneProps) {
  const { user } = useAuth();
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadingFile[]>([]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!user) return;
      const idx = Date.now();
      setUploads((prev) => [...prev, { file, progress: 30, status: "uploading" }]);

      try {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: storageError } = await supabase.storage
          .from("user-files")
          .upload(path, file);

        if (storageError) throw storageError;

        setUploads((prev) =>
          prev.map((u) => (u.file === file ? { ...u, progress: 70 } : u))
        );

        const { error: dbError } = await supabase.from("files").insert({
          user_id: user.id,
          name: file.name,
          size: file.size,
          mime_type: file.type || null,
          storage_path: path,
          folder_id: folderId || null,
        });

        if (dbError) throw dbError;

        // Update storage used
        await supabase
          .from("profiles")
          .update({ storage_used: 0 }) // Will be recalculated
          .eq("user_id", user.id);

        setUploads((prev) =>
          prev.map((u) => (u.file === file ? { ...u, progress: 100, status: "done" } : u))
        );
        onUploadComplete();
      } catch (err: any) {
        setUploads((prev) =>
          prev.map((u) =>
            u.file === file
              ? { ...u, status: "error", error: err.message || "Upload failed" }
              : u
          )
        );
      }
    },
    [user, folderId, onUploadComplete]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach(uploadFile);
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  const clearDone = () => {
    setUploads((prev) => prev.filter((u) => u.status === "uploading"));
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">Drag & drop files here</p>
        <p className="text-xs text-muted-foreground mb-3">or click to browse</p>
        <label>
          <input type="file" multiple className="hidden" onChange={handleFileInput} />
          <Button variant="outline" size="sm" asChild>
            <span>Browse Files</span>
          </Button>
        </label>
      </div>
      {uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Uploads</p>
            <Button variant="ghost" size="sm" onClick={clearDone}>
              Clear completed
            </Button>
          </div>
          {uploads.map((u, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border">
              {u.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              {u.status === "done" && <CheckCircle className="h-4 w-4 text-green-500" />}
              {u.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{u.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(u.file.size)}</p>
                {u.status === "uploading" && <Progress value={u.progress} className="h-1 mt-1" />}
                {u.error && <p className="text-xs text-destructive">{u.error}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
