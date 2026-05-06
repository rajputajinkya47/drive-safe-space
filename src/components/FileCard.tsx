import { useState } from "react";
import {
  FileText,
  Image,
  Video,
  Music,
  File,
  Star,
  MoreVertical,
  Download,
  Trash2,
  Pencil,
  Archive,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatFileSize, formatDate, getFileIcon } from "@/lib/file-utils";
import type { Tables } from "@/integrations/supabase/types";

const iconMap: Record<string, React.ElementType> = {
  "file-text": FileText,
  image: Image,
  video: Video,
  music: Music,
  archive: Archive,
  sheet: FileText,
  file: File,
};

const colorMap: Record<string, string> = {
  "file-text": "text-red-500",
  image: "text-green-500",
  video: "text-purple-500",
  music: "text-pink-500",
  archive: "text-yellow-600",
  sheet: "text-emerald-500",
  file: "text-muted-foreground",
};

interface FileCardProps {
  file: Tables<"files">;
  onStar: (id: string, starred: boolean) => void;
  onTrash: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDownload: (file: Tables<"files">) => void;
  onPreview: (file: Tables<"files">) => void;
}

export function FileCard({ file, onStar, onTrash, onRename, onDownload, onPreview }: FileCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const iconType = getFileIcon(file.mime_type);
  const Icon = iconMap[iconType] || File;
  const iconColor = colorMap[iconType] || "text-muted-foreground";

  const handleRename = () => {
    if (newName.trim() && newName !== file.name) {
      onRename(file.id, newName.trim());
    }
    setRenaming(false);
  };

  return (
    <Card
      className="group relative p-4 hover:shadow-md transition-all cursor-pointer border-border/50 hover:border-primary/30"
      onClick={() => !renaming && onPreview(file)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onStar(file.id, !file.is_starred);
            }}
          >
            <Star
              className={`h-3.5 w-3.5 ${file.is_starred ? "fill-yellow-400 text-yellow-400" : ""}`}
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(file); }}>
                <Download className="h-4 w-4 mr-2" />Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenaming(true); }}>
                <Pencil className="h-4 w-4 mr-2" />Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onTrash(file.id); }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {renaming ? (
        <input
          className="text-sm font-medium bg-secondary rounded px-2 py-1 w-full outline-none border border-primary"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => e.key === "Enter" && handleRename()}
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      ) : (
        <p className="text-sm font-medium truncate">{file.name}</p>
      )}
      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
        <span>{formatFileSize(file.size)}</span>
        <span>•</span>
        <span>{formatDate(file.created_at)}</span>
      </div>
    </Card>
  );
}
