import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Download, Image, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PhotoActionsProps {
  photoUrl: string | null | undefined;
  label?: string;
  size?: "sm" | "default";
}

// Helper to get signed URL for storage paths
async function getDisplayUrl(photoUrl: string): Promise<string> {
  // If it's already a full URL (http/https), return as-is
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }
  // Otherwise, treat as storage path and get signed URL
  const { data, error } = await supabase.storage
    .from("kepenghunian-files")
    .createSignedUrl(photoUrl, 3600);
  if (error || !data?.signedUrl) {
    console.error("Failed to get signed URL:", error);
    return photoUrl;
  }
  return data.signedUrl;
}

export function PhotoActions({ photoUrl, label = "Foto", size = "sm" }: PhotoActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (photoUrl && isOpen) {
      setLoading(true);
      getDisplayUrl(photoUrl).then((url) => {
        setDisplayUrl(url);
        setLoading(false);
      });
    }
  }, [photoUrl, isOpen]);

  if (!photoUrl) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const handleDownload = async () => {
    try {
      const url = await getDisplayUrl(photoUrl);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${label.replace(/\s/g, "_")}_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      // Fallback: open in new tab
      const url = await getDisplayUrl(photoUrl);
      window.open(url, "_blank");
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size={size}
          onClick={() => setIsOpen(true)}
          className="h-7 px-2"
        >
          <Eye className="w-3 h-3" />
        </Button>
        <Button
          variant="outline"
          size={size}
          onClick={handleDownload}
          className="h-7 px-2"
        >
          <Download className="w-3 h-3" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              {label}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <img
                src={displayUrl || ""}
                alt={label}
                className="w-full h-auto rounded-lg max-h-[70vh] object-contain"
              />
            )}
            <Button onClick={handleDownload} className="w-full sm:w-auto" disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              Download {label}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface PhotoCellProps {
  photos: {
    url: string | null | undefined;
    label: string;
  }[];
}

export function PhotoCell({ photos }: PhotoCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; label: string } | null>(null);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const validPhotos = photos.filter((p) => p.url);

  useEffect(() => {
    if (selectedPhoto && isOpen) {
      setLoading(true);
      getDisplayUrl(selectedPhoto.url).then((url) => {
        setDisplayUrl(url);
        setLoading(false);
      });
    }
  }, [selectedPhoto, isOpen]);

  if (validPhotos.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const handleDownload = async (url: string, label: string) => {
    try {
      const resolvedUrl = await getDisplayUrl(url);
      const response = await fetch(resolvedUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${label.replace(/\s/g, "_")}_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      const resolvedUrl = await getDisplayUrl(url);
      window.open(resolvedUrl, "_blank");
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-1">
        {validPhotos.map((photo, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedPhoto({ url: photo.url!, label: photo.label });
              setDisplayUrl(null);
              setIsOpen(true);
            }}
            className="h-6 px-2 text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            {photo.label}
          </Button>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              {selectedPhoto?.label}
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="flex flex-col items-center gap-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <img
                  src={displayUrl || ""}
                  alt={selectedPhoto.label}
                  className="w-full h-auto rounded-lg max-h-[70vh] object-contain"
                />
              )}
              <Button 
                onClick={() => handleDownload(selectedPhoto.url, selectedPhoto.label)} 
                className="w-full sm:w-auto"
                disabled={loading}
              >
                <Download className="w-4 h-4 mr-2" />
                Download {selectedPhoto.label}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
