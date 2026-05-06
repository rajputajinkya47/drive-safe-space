import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Trash2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatFileSize, formatDate } from "@/lib/file-utils";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/dashboard/trash")({
  component: TrashPage,
});

function TrashPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<Tables<"files">[]>([]);
  const [folders, setFolders] = useState<Tables<"folders">[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [filesRes, foldersRes] = await Promise.all([
      supabase.from("files").select("*").eq("user_id", user.id).eq("is_trashed", true).order("trashed_at", { ascending: false }),
      supabase.from("folders").select("*").eq("user_id", user.id).eq("is_trashed", true).order("trashed_at", { ascending: false }),
    ]);
    setFiles(filesRes.data || []);
    setFolders(foldersRes.data || []);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const restoreFile = async (id: string) => {
    await supabase.from("files").update({ is_trashed: false, trashed_at: null }).eq("id", id);
    fetchData();
  };

  const restoreFolder = async (id: string) => {
    await supabase.from("folders").update({ is_trashed: false, trashed_at: null }).eq("id", id);
    fetchData();
  };

  const permanentDeleteFile = async (file: Tables<"files">) => {
    await supabase.storage.from("user-files").remove([file.storage_path]);
    await supabase.from("files").delete().eq("id", file.id);
    fetchData();
  };

  const permanentDeleteFolder = async (id: string) => {
    await supabase.from("folders").delete().eq("id", id);
    fetchData();
  };

  const emptyTrash = async () => {
    if (!user) return;
    for (const file of files) {
      await supabase.storage.from("user-files").remove([file.storage_path]);
    }
    await supabase.from("files").delete().eq("user_id", user.id).eq("is_trashed", true);
    await supabase.from("folders").delete().eq("user_id", user.id).eq("is_trashed", true);
    fetchData();
  };

  const totalItems = files.length + folders.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trash</h1>
          <p className="text-muted-foreground text-sm mt-1">{totalItems} items in trash</p>
        </div>
        {totalItems > 0 && (
          <Button variant="destructive" size="sm" onClick={emptyTrash}>
            <Trash2 className="h-4 w-4 mr-2" />
            Empty Trash
          </Button>
        )}
      </div>

      {totalItems === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Trash2 className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium text-muted-foreground">Trash is empty</p>
        </div>
      ) : (
        <div className="space-y-2">
          {folders.map((folder) => (
            <Card key={folder.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">{folder.name}</p>
                <p className="text-xs text-muted-foreground">Folder • Deleted {folder.trashed_at ? formatDate(folder.trashed_at) : ""}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => restoreFolder(folder.id)}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => permanentDeleteFolder(folder.id)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          {files.map((file) => (
            <Card key={file.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)} • Deleted {file.trashed_at ? formatDate(file.trashed_at) : ""}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => restoreFile(file.id)}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => permanentDeleteFile(file)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
