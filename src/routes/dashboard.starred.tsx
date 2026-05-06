import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FileCard } from "@/components/FileCard";
import { FilePreviewDialog } from "@/components/FilePreviewDialog";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/dashboard/starred")({
  component: StarredPage,
});

function StarredPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<Tables<"files">[]>([]);
  const [previewFile, setPreviewFile] = useState<Tables<"files"> | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("files")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_starred", true)
      .eq("is_trashed", false)
      .order("updated_at", { ascending: false });
    setFiles(data || []);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStar = async (id: string, starred: boolean) => {
    await supabase.from("files").update({ is_starred: starred }).eq("id", id);
    fetchData();
  };

  const handleTrash = async (id: string) => {
    await supabase.from("files").update({ is_trashed: true, trashed_at: new Date().toISOString() }).eq("id", id);
    fetchData();
  };

  const handleRename = async (id: string, name: string) => {
    await supabase.from("files").update({ name }).eq("id", id);
    fetchData();
  };

  const handleDownload = async (file: Tables<"files">) => {
    const { data } = await supabase.storage.from("user-files").createSignedUrl(file.storage_path, 3600);
    if (data) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Starred Files</h1>
        <p className="text-muted-foreground text-sm mt-1">Your favorite files in one place</p>
      </div>
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Star className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium text-muted-foreground">No starred files</p>
          <p className="text-sm text-muted-foreground mt-1">Star files to find them quickly</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((file) => (
            <FileCard key={file.id} file={file} onStar={handleStar} onTrash={handleTrash} onRename={handleRename} onDownload={handleDownload} onPreview={setPreviewFile} />
          ))}
        </div>
      )}
      <FilePreviewDialog file={previewFile} open={!!previewFile} onClose={() => setPreviewFile(null)} onDownload={handleDownload} />
    </div>
  );
}
