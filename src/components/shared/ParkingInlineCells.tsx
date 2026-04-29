import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Check, X, Loader2, Eye, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NotesCellProps {
  id: string;
  value: string | null;
  canEdit: boolean;
  onSave: (notes: string) => void;
}

export function NotesCell({ id, value, canEdit, onSave }: NotesCellProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value || "");

  useEffect(() => setText(value || ""), [value]);

  if (!canEdit) {
    return (
      <span className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
        {value || "-"}
      </span>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-left w-full text-xs hover:bg-muted/50 rounded px-1 py-1 min-h-[2rem] whitespace-pre-wrap break-words"
        title="Klik untuk edit catatan"
      >
        {value || <span className="text-muted-foreground italic">+ Tambah catatan</span>}
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Catatan (kekurangan transfer/dokumen, dsb.)"
        className="text-xs min-h-[60px]"
        autoFocus
      />
      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => {
            onSave(text.trim());
            setEditing(false);
          }}
        >
          <Check className="w-3 h-3 mr-1" /> Simpan
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs"
          onClick={() => {
            setText(value || "");
            setEditing(false);
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

interface ReceiptPhotoCellProps {
  id: string;
  url: string | null;
  canEdit: boolean;
  onUpload: (file: File) => Promise<void> | void;
  onClear: () => void;
}

export function ReceiptPhotoCell({ id, url, canEdit, onUpload, onClear }: ReceiptPhotoCellProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [uploading, setUploading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!url) { setSignedUrl(null); return; }
      if (url.startsWith("http")) { setSignedUrl(url); return; }
      const { data } = await supabase.storage.from("kepenghunian-files").createSignedUrl(url, 3600);
      if (active) setSignedUrl(data?.signedUrl || null);
    }
    load();
    return () => { active = false; };
  }, [url]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      setStream(s);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = s;
      }, 100);
    } catch (e) {
      console.error("Camera error:", e);
      fileRef.current?.click();
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setShowCamera(false);
  };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    c.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `kwitansi-${Date.now()}.jpg`, { type: "image/jpeg" });
      stopCamera();
      setUploading(true);
      await onUpload(file);
      setUploading(false);
    }, "image/jpeg", 0.85);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    await onUpload(f);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-1 items-start">
      {url && signedUrl ? (
        <>
          <img
            src={signedUrl}
            alt="Kwitansi"
            className="w-14 h-14 object-cover rounded border cursor-pointer"
            onClick={() => setViewing(true)}
          />
          {canEdit && (
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={startCamera}
                disabled={uploading}
                title="Ambil ulang"
              >
                <Camera className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-destructive"
                onClick={onClear}
                disabled={uploading}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </>
      ) : canEdit ? (
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={startCamera}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3 mr-1" />}
            Foto
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Upload file"
          >
            <Upload className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      <Dialog open={showCamera} onOpenChange={(o) => !o && stopCamera()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Foto Kwitansi (Live)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-black rounded-lg overflow-hidden aspect-video">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={stopCamera}>Batal</Button>
              <Button onClick={capture}>
                <Camera className="w-4 h-4 mr-2" /> Ambil Foto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewing} onOpenChange={setViewing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Foto Kwitansi</DialogTitle>
          </DialogHeader>
          {signedUrl && <img src={signedUrl} alt="Kwitansi" className="w-full rounded" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
