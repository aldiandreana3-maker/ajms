import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const MAX_STORAGE_MB = 1024; // 1 GB
const WARNING_THRESHOLD = 0.7; // 70%

export function StorageWarning() {
  const { isSuperAdmin } = useAuth();
  const [storageUsageMB, setStorageUsageMB] = useState<number | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) return;

    const checkStorage = async () => {
      try {
        // Estimate storage usage by listing objects in all buckets
        const buckets = ["kepenghunian-files", "packages", "agent-gallery"];
        let totalSize = 0;

        for (const bucket of buckets) {
          const { data: files } = await supabase.storage.from(bucket).list("", {
            limit: 1000,
            sortBy: { column: "created_at", order: "desc" },
          });

          if (files) {
            for (const file of files) {
              if (file.metadata?.size) {
                totalSize += file.metadata.size;
              }
            }
          }
        }

        setStorageUsageMB(totalSize / (1024 * 1024));
      } catch (err) {
        console.warn("Failed to check storage usage:", err);
      }
    };

    checkStorage();
  }, [isSuperAdmin]);

  if (!isSuperAdmin || storageUsageMB === null) return null;

  const usagePercent = (storageUsageMB / MAX_STORAGE_MB) * 100;

  if (usagePercent < WARNING_THRESHOLD * 100) return null;

  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Peringatan Kapasitas Penyimpanan</AlertTitle>
      <AlertDescription>
        Penggunaan penyimpanan file sudah mencapai{" "}
        <span className="font-bold">{usagePercent.toFixed(1)}%</span>{" "}
        ({storageUsageMB.toFixed(1)} MB dari {MAX_STORAGE_MB} MB).
        Pertimbangkan untuk menghapus file lama atau upgrade kapasitas.
      </AlertDescription>
    </Alert>
  );
}
