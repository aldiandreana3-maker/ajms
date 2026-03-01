import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Camera, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  accept?: string;
  className?: string;
}

export function PhotoUpload({
  label,
  value,
  onChange,
  required = false,
  accept = "image/*",
  className,
}: PhotoUploadProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when value changes
  const updatePreview = useCallback((file: File | null) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
      updatePreview(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      console.error("Camera error:", error);
      // Fallback to file input if camera not available
      fileInputRef.current?.click();
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `photo-${Date.now()}.jpg`, {
                type: "image/jpeg",
              });
              onChange(file);
              updatePreview(file);
              stopCamera();
            }
          },
          "image/jpeg",
          0.8
        );
      }
    }
  };

  const clearPhoto = () => {
    onChange(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
        capture="environment"
      />

      {preview || value ? (
        <div className="relative border rounded-lg overflow-hidden">
          {value?.type.startsWith("video/") ? (
            <video
              src={preview || (value ? URL.createObjectURL(value) : "")}
              className="w-full h-32 object-cover"
              muted
              playsInline
            />
          ) : (
            <img
              src={preview || (value ? URL.createObjectURL(value) : "")}
              alt="Preview"
              className="w-full h-32 object-cover"
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={clearPhoto}
          >
            <X className="h-3 w-3" />
          </Button>
          <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
            {value?.name || "Captured photo"}
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Pilih File
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startCamera}
              >
                <Camera className="w-4 h-4 mr-2" />
                Kamera
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              {label} {required && <span className="text-destructive">*</span>}
            </span>
          </div>
        </div>
      )}

      {/* Camera Dialog */}
      <Dialog open={showCamera} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ambil Foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={stopCamera}>
                Batal
              </Button>
              <Button onClick={capturePhoto}>
                <Camera className="w-4 h-4 mr-2" />
                Ambil Foto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
