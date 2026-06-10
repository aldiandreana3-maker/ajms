import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageCompression";

interface UseFileUploadOptions {
  bucket?: string;
  folder?: string;
  compressImages?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { bucket = "kepenghunian-files", folder = "", compressImages = true, maxWidth, maxHeight, quality } = options;
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("Silakan login terlebih dahulu");
        return null;
      }

      // Validasi format (untuk gambar: hanya JPG/JPEG/PNG; lainnya dilewati)
      if (file.type.startsWith("image/")) {
        const ok = ["image/jpeg", "image/jpg", "image/png"].includes(file.type);
        if (!ok) {
          toast.error("Format foto tidak didukung. Gunakan JPG, JPEG, atau PNG.");
          return null;
        }
      }

      // Compress image if enabled and file is an image
      let fileToUpload = file;
      if (compressImages && file.type.startsWith("image/")) {
        try {
          fileToUpload = await compressImage(file, maxWidth, maxHeight, quality);
        } catch (compressionError) {
          console.warn("Image compression failed, using original:", compressionError);
        }
      }

      const userId = sessionData.session.user.id;
      const fileExt = (fileToUpload.name.split(".").pop() || "bin").toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = folder
        ? `${userId}/${folder}/${fileName}`
        : `${userId}/${fileName}`;

      // Retry hingga 3x untuk gangguan jaringan
      const maxAttempts = 3;
      let lastError: any = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, fileToUpload, {
            cacheControl: "3600",
            upsert: false,
            contentType: fileToUpload.type || undefined,
          });

        if (!uploadError) {
          return filePath;
        }
        lastError = uploadError;
        console.warn(`Upload gagal (percobaan ${attempt}/${maxAttempts}):`, uploadError.message);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 600 * attempt));
        }
      }

      toast.error("Upload foto gagal. Silakan coba kembali. (" + (lastError?.message || "network") + ")");
      return null;
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Upload foto gagal. Silakan coba kembali.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const getPublicUrl = (filePath: string | null): string | null => {
    if (!filePath) return null;
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getSignedUrl = async (filePath: string | null): Promise<string | null> => {
    if (!filePath) return null;
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    if (error) {
      console.error("Signed URL error:", error);
      return null;
    }
    return data.signedUrl;
  };

  return {
    uploadFile,
    getPublicUrl,
    getSignedUrl,
    uploading,
  };
}
