import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useMyPenghuniUpdate } from "@/hooks/usePenghuniUpdates";

const SESSION_KEY = "ajms_pemutakhiran_dismissed";

/**
 * Pop-up pengingat pemutakhiran data penghuni.
 * Muncul saat masuk dashboard jika status belum "sudah_diperbarui".
 * "Isi Nanti" hanya menutup sementara (per sesi), status tidak berubah.
 */
export function PemutakhiranDataModal() {
  const navigate = useNavigate();
  const { user, isLimitedAccess } = useAuth();
  const { data: myUpdate, isLoading } = useMyPenghuniUpdate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !isLimitedAccess || isLoading) return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    if (myUpdate?.status === "sudah_diperbarui") return;
    setOpen(true);
  }, [user, isLimitedAccess, isLoading, myUpdate]);

  const handleLater = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleLater() : setOpen(v))}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center mb-2">
            <Info className="w-6 h-6 text-info" />
          </div>
          <DialogTitle>Pemutakhiran Data Penghuni</DialogTitle>
          <DialogDescription className="text-left leading-relaxed">
            Untuk meningkatkan kualitas pelayanan kepenghunian, kami meminta Anda melakukan
            pemutakhiran data penghuni unit Anda. Mohon pastikan data yang diberikan adalah data
            terbaru dan sesuai kondisi sebenarnya.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={handleLater} className="w-full sm:w-auto">
            Isi Nanti
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              navigate("/kepenghunian/pemutakhiran-data");
            }}
            className="w-full sm:w-auto"
          >
            Isi Sekarang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
