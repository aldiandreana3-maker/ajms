import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, X, SwitchCamera } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  className?: string;
  showPreview?: boolean;
}

export function CameraCapture({
  label,
  value,
  onChange,
  required = false,
  className,
  showPreview = true,
}: CameraCaptureProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update preview when value changes
  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [value]);

  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
      setStream(mediaStream);
      setFacingMode(mode);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      console.error("Camera error:", error);
      // If requested mode fails, try the other one
      if (mode === "user") {
        try {
          const fallback = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false,
          });
          setStream(fallback);
          setFacingMode("environment");
          setShowCamera(true);
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = fallback;
            }
          }, 100);
          return;
        } catch {}
      }
      alert("Tidak dapat mengakses kamera. Pastikan perangkat memiliki kamera dan izin sudah diberikan.");
    }
  };

  const switchCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    startCamera(newMode);
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
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showPreview && preview ? (
        <div className="relative border rounded-lg overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-32 object-cover"
          />
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
            Foto dari kamera
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-4">
          <div className="flex flex-col items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={startCamera}
            >
              <Camera className="w-4 h-4 mr-2" />
              Ambil Foto
            </Button>
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
