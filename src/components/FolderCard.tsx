import { useState } from "react";
import { Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/file-utils";
import type { Tables } from "@/integrations/supabase/types";

interface FolderCardProps {
  folder: Tables<"folders">;
  onOpen: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onTrash: (id: string) => void;
}

export function FolderCard({ folder, onOpen, onRename, onTrash }: FolderCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);

  const handleRename = () => {
    if (newName.trim() && newName !== folder.name) {
      onRename(folder.id, newName.trim());
    }
    setRenaming(false);
  };

  return (
    <Card
      className="group relative p-4 hover:shadow-md transition-all cursor-pointer border-border/50 hover:border-primary/30"
      onClick={() => !renaming && onOpen(folder.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Folder className="h-5 w-5" />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenaming(true); }}>
                <Pencil className="h-4 w-4 mr-2" />Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onTrash(folder.id); }}
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
        <p className="text-sm font-medium truncate">{folder.name}</p>
      )}
      <p className="text-xs text-muted-foreground mt-1">{formatDate(folder.created_at)}</p>
    </Card>
  );
}
