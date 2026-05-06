import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FileCard } from "@/components/FileCard";
import { FolderCard } from "@/components/FolderCard";
import { CreateFolderDialog } from "@/components/CreateFolderDialog";
import { FilePreviewDialog } from "@/components/FilePreviewDialog";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/dashboard/files")({
  component: MyFilesPage,
});

function MyFilesPage() {
  const { user } = useAuth();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "My Files" },
  ]);
  const [folders, setFolders] = useState<Tables<"folders">[]>([]);
  const [files, setFiles] = useState<Tables<"files">[]>([]);
  const [previewFile, setPreviewFile] = useState<Tables<"files"> | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const foldersQuery = supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_trashed", false)
      .order("name");

    const filesQuery = supabase
      .from("files")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_trashed", false)
      .order("created_at", { ascending: false });

    if (currentFolderId) {
      foldersQuery.eq("parent_folder_id", currentFolderId);
      filesQuery.eq("folder_id", currentFolderId);
    } else {
      foldersQuery.is("parent_folder_id", null);
      filesQuery.is("folder_id", null);
    }

    const [foldersRes, filesRes] = await Promise.all([foldersQuery, filesQuery]);
    setFolders(foldersRes.data || []);
    setFiles(filesRes.data || []);
  }, [user, currentFolderId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const navigateToFolder = async (folderId: string) => {
    const { data: folder } = await supabase.from("folders").select("id, name").eq("id", folderId).single();
    if (folder) {
      setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
      setCurrentFolderId(folderId);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    setCurrentFolderId(breadcrumbs[index].id);
  };

  const handleStar = async (id: string, starred: boolean) => {
    await supabase.from("files").update({ is_starred: starred }).eq("id", id);
    fetchData();
  };

  const handleTrashFile = async (id: string) => {
    await supabase.from("files").update({ is_trashed: true, trashed_at: new Date().toISOString() }).eq("id", id);
    fetchData();
  };

  const handleTrashFolder = async (id: string) => {
    await supabase.from("folders").update({ is_trashed: true, trashed_at: new Date().toISOString() }).eq("id", id);
    fetchData();
  };

  const handleRenameFile = async (id: string, name: string) => {
    await supabase.from("files").update({ name }).eq("id", id);
    fetchData();
  };

  const handleRenameFolder = async (id: string, name: string) => {
    await supabase.from("folders").update({ name }).eq("id", id);
    fetchData();
  };

  const handleDownload = async (file: Tables<"files">) => {
    const { data } = await supabase.storage.from("user-files").createSignedUrl(file.storage_path, 3600);
    if (data) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              <button
                onClick={() => navigateToBreadcrumb(i)}
                className={`hover:text-primary transition-colors ${
                  i === breadcrumbs.length - 1
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {i === 0 ? <Home className="h-4 w-4 inline mr-1" /> : null}
                {b.name}
              </button>
            </span>
          ))}
        </div>
        <CreateFolderDialog parentFolderId={currentFolderId} onCreated={fetchData} />
      </div>

      {folders.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Folders</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onOpen={navigateToFolder}
                onRename={handleRenameFolder}
                onTrash={handleTrashFolder}
              />
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Files</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onStar={handleStar}
                onTrash={handleTrashFile}
                onRename={handleRenameFile}
                onDownload={handleDownload}
                onPreview={setPreviewFile}
              />
            ))}
          </div>
        </div>
      )}

      {folders.length === 0 && files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Home className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium text-muted-foreground">This folder is empty</p>
          <p className="text-sm text-muted-foreground mt-1">Upload files or create a new folder</p>
        </div>
      )}

      <FilePreviewDialog
        file={previewFile}
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
      />
    </div>
  );
}
