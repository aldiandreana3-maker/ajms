import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Download, Image, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Helper to get signed URL for storage paths
async function getDisplayUrl(photoUrl: string): Promise<string> {
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }
  const { data, error } = await supabase.storage
    .from("kepenghunian-files")
    .createSignedUrl(photoUrl, 3600);
  if (error || !data?.signedUrl) {
    console.error("Failed to get signed URL:", error);
    return photoUrl;
  }
  return data.signedUrl;
}

function isVideoUrl(url: string): boolean {
  const videoExts = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"];
  const lower = url.toLowerCase();
  return videoExts.some((ext) => lower.includes(ext));
}

interface PhotoActionsProps {
  photoUrl: string | null | undefined;
  label?: string;
  size?: "sm" | "default";
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
      const url = await getDisplayUrl(photoUrl);
      window.open(url, "_blank");
    }
  };

  const isVideo = isVideoUrl(photoUrl);

  return (
    <>
      <div className="flex items-center gap-1">
        <Button variant="outline" size={size} onClick={() => setIsOpen(true)} className="h-7 px-2">
          <Eye className="w-3 h-3" />
        </Button>
        <Button variant="outline" size={size} onClick={handleDownload} className="h-7 px-2">
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
            ) : isVideo ? (
              <video
                src={displayUrl || ""}
                controls
                className="w-full rounded-lg max-h-[70vh]"
              />
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
  showThumbnail?: boolean;
}

export function PhotoCell({ photos, showThumbnail = false }: PhotoCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; label: string } | null>(null);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  const validPhotos = photos.filter((p) => p.url);

  // Load thumbnail URLs
  useEffect(() => {
    if (showThumbnail && validPhotos.length > 0) {
      validPhotos.forEach((photo, index) => {
        if (photo.url && !thumbnailUrls[index]) {
          getDisplayUrl(photo.url).then((url) => {
            setThumbnailUrls((prev) => ({ ...prev, [index]: url }));
          });
        }
      });
    }
  }, [showThumbnail, validPhotos.length]);

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

  const openPreview = (photo: { url: string; label: string }) => {
    setSelectedPhoto(photo);
    setDisplayUrl(null);
    setIsOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap gap-1">
        {validPhotos.map((photo, index) => {
          const isVideo = isVideoUrl(photo.url!);
          
          if (showThumbnail) {
            return (
              <div key={index} className="space-y-1">
                {isVideo ? (
                  <div
                    className="w-16 h-16 bg-muted rounded flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openPreview({ url: photo.url!, label: photo.label })}
                  >
                    <span className="text-xs text-muted-foreground font-medium">▶ Video</span>
                  </div>
                ) : (
                  <img
                    src={thumbnailUrls[index] || ""}
                    alt={photo.label}
                    className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openPreview({ url: photo.url!, label: photo.label })}
                  />
                )}
                <button
                  onClick={() => openPreview({ url: photo.url!, label: photo.label })}
                  className="text-xs text-primary hover:underline block"
                >
                  Lihat {photo.label}
                </button>
              </div>
            );
          }

          return (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => openPreview({ url: photo.url!, label: photo.label })}
              className="h-6 px-2 text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              {photo.label}
            </Button>
          );
        })}
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
              ) : isVideoUrl(selectedPhoto.url) ? (
                <video
                  src={displayUrl || ""}
                  controls
                  className="w-full rounded-lg max-h-[70vh]"
                />
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
