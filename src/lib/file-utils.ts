export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return "file";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "music";
  if (mimeType.includes("pdf")) return "file-text";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "sheet";
  if (mimeType.includes("document") || mimeType.includes("word")) return "file-text";
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar")) return "archive";
  return "file";
}

export function getFileColor(mimeType: string | null): string {
  if (!mimeType) return "text-muted-foreground";
  if (mimeType.startsWith("image/")) return "text-green-500";
  if (mimeType.startsWith("video/")) return "text-purple-500";
  if (mimeType.startsWith("audio/")) return "text-pink-500";
  if (mimeType.includes("pdf")) return "text-red-500";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "text-emerald-500";
  if (mimeType.includes("document") || mimeType.includes("word")) return "text-blue-500";
  return "text-muted-foreground";
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
