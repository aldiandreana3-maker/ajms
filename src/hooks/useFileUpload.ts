import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageCompression";

interface UseFileUploadOptions {
  bucket?: string;
  folder?: string;
  compressImages?: boolean;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { bucket = "kepenghunian-files", folder = "", compressImages = true } = options;
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("Silakan login terlebih dahulu");
        return null;
      }

      // Compress image if enabled and file is an image
      let fileToUpload = file;
      if (compressImages && file.type.startsWith("image/")) {
        try {
          fileToUpload = await compressImage(file);
        } catch (compressionError) {
          console.warn("Image compression failed, using original:", compressionError);
        }
      }

      const userId = sessionData.session.user.id;
      const fileExt = fileToUpload.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = folder
        ? `${userId}/${folder}/${fileName}`
        : `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileToUpload, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Gagal upload file: " + uploadError.message);
        return null;
      }

      return filePath;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Gagal upload file");
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
