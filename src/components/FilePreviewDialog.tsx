import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

interface FilePreviewDialogProps {
  file: Tables<"files"> | null;
  open: boolean;
  onClose: () => void;
  onDownload: (file: Tables<"files">) => void;
}

export function FilePreviewDialog({ file, open, onClose, onDownload }: FilePreviewDialogProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !open) { setUrl(null); return; }
    const fetchUrl = async () => {
      const { data } = await supabase.storage
        .from("user-files")
        .createSignedUrl(file.storage_path, 3600);
      if (data) setUrl(data.signedUrl);
    };
    fetchUrl();
  }, [file, open]);

  if (!file) return null;

  const isImage = file.mime_type?.startsWith("image/");
  const isVideo = file.mime_type?.startsWith("video/");
  const isAudio = file.mime_type?.startsWith("audio/");
  const isPdf = file.mime_type?.includes("pdf");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-medium truncate flex-1">{file.name}</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDownload(file)}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[300px] p-4 bg-secondary/30">
          {!url ? (
            <p className="text-muted-foreground text-sm">Loading preview...</p>
          ) : isImage ? (
            <img src={url} alt={file.name} className="max-w-full max-h-[60vh] object-contain rounded" />
          ) : isVideo ? (
            <video src={url} controls className="max-w-full max-h-[60vh] rounded" />
          ) : isAudio ? (
            <audio src={url} controls className="w-full max-w-md" />
          ) : isPdf ? (
            <iframe src={url} className="w-full h-[60vh] rounded" title={file.name} />
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-2">Preview not available</p>
              <Button variant="outline" size="sm" onClick={() => onDownload(file)}>
                Download to view
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
