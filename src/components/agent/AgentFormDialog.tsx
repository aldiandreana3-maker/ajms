import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AgentFormData {
  name: string;
  position: string;
  phone: string;
  email: string;
  office_location: string;
  photo_url: string;
}

interface AgentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  form: AgentFormData;
  onFormChange: (form: AgentFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function AgentFormDialog({
  open,
  onOpenChange,
  editingId,
  form,
  onFormChange,
  onSubmit,
  isPending,
}: AgentFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Agent" : "Tambah Agent Baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama</Label>
            <Input
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Posisi</Label>
            <Input
              value={form.position}
              onChange={(e) => onFormChange({ ...form, position: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telepon</Label>
              <Input
                value={form.phone}
                onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => onFormChange({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Lokasi Kantor</Label>
            <Input
              value={form.office_location}
              onChange={(e) => onFormChange({ ...form, office_location: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>URL Foto</Label>
            <Input
              value={form.photo_url}
              onChange={(e) => onFormChange({ ...form, photo_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editingId ? "Update" : "Simpan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
