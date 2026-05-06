import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Upload, FolderOpen, Star, Clock, FileText, Image, Video, Music } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FileCard } from "@/components/FileCard";
import { formatFileSize } from "@/lib/file-utils";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentFiles, setRecentFiles] = useState<Tables<"files">[]>([]);
  const [stats, setStats] = useState({ totalFiles: 0, totalFolders: 0, totalSize: 0, starred: 0 });
  const [previewFile, setPreviewFile] = useState<Tables<"files"> | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [filesRes, foldersRes, starredRes] = await Promise.all([
      supabase.from("files").select("*").eq("user_id", user.id).eq("is_trashed", false).order("created_at", { ascending: false }).limit(8),
      supabase.from("folders").select("id").eq("user_id", user.id).eq("is_trashed", false),
      supabase.from("files").select("id").eq("user_id", user.id).eq("is_starred", true).eq("is_trashed", false),
    ]);

    const files = filesRes.data || [];
    setRecentFiles(files);
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    setStats({
      totalFiles: files.length,
      totalFolders: foldersRes.data?.length || 0,
      totalSize,
      starred: starredRes.data?.length || 0,
    });
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

  const statCards = [
    { title: "Total Files", value: stats.totalFiles, icon: FileText, color: "text-primary" },
    { title: "Folders", value: stats.totalFolders, icon: FolderOpen, color: "text-primary" },
    { title: "Storage Used", value: formatFileSize(stats.totalSize), icon: Upload, color: "text-primary" },
    { title: "Starred", value: stats.starred, icon: Star, color: "text-yellow-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your cloud storage</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Files</h2>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/dashboard/files" })}>
          View all
        </Button>
      </div>

      {recentFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No files yet</p>
            <p className="text-sm text-muted-foreground mb-4">Upload your first file to get started</p>
            <Button onClick={() => navigate({ to: "/dashboard/upload" })}>
              <Upload className="h-4 w-4 mr-2" />Upload Files
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recentFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onStar={handleStar}
              onTrash={handleTrash}
              onRename={handleRename}
              onDownload={handleDownload}
              onPreview={setPreviewFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
