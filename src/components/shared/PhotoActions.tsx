import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Download, Image } from "lucide-react";
import { useState } from "react";

interface PhotoActionsProps {
  photoUrl: string | null | undefined;
  label?: string;
  size?: "sm" | "default";
}

export function PhotoActions({ photoUrl, label = "Foto", size = "sm" }: PhotoActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!photoUrl) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${label.replace(/\s/g, "_")}_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // Fallback: open in new tab
      window.open(photoUrl, "_blank");
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
            <img
              src={photoUrl}
              alt={label}
              className="w-full h-auto rounded-lg max-h-[70vh] object-contain"
            />
            <Button onClick={handleDownload} className="w-full sm:w-auto">
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
  
  const validPhotos = photos.filter((p) => p.url);

  if (validPhotos.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const handleDownload = async (url: string, label: string) => {
    try {
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
      window.open(url, "_blank");
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
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.label}
                className="w-full h-auto rounded-lg max-h-[70vh] object-contain"
              />
              <Button 
                onClick={() => handleDownload(selectedPhoto.url, selectedPhoto.label)} 
                className="w-full sm:w-auto"
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
