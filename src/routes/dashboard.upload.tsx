import { createFileRoute } from "@tanstack/react-router";
import { FileUploadZone } from "@/components/FileUploadZone";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/upload")({
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Files</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload files to your cloud storage
        </p>
      </div>
      <FileUploadZone
        onUploadComplete={() => {
          // Could navigate or just stay
        }}
      />
    </div>
  );
}
