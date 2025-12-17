import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Dumbbell, Waves, Car, ShoppingBag, Utensils, Shield, Wifi, Zap, Building2,
  Plus, Edit, Trash2, Loader2
} from "lucide-react";
import { useFacilities, useCreateFacility, useUpdateFacility, useDeleteFacility } from "@/hooks/useFacilities";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Dumbbell, Waves, Car, ShoppingBag, Utensils, Shield, Wifi, Zap, Building2
};

const iconOptions = [
  { value: "Building2", label: "Building" },
  { value: "Waves", label: "Kolam Renang" },
  { value: "Dumbbell", label: "Fitness" },
  { value: "Car", label: "Parkir" },
  { value: "ShoppingBag", label: "Shopping" },
  { value: "Utensils", label: "Food" },
  { value: "Shield", label: "Security" },
  { value: "Wifi", label: "Internet" },
  { value: "Zap", label: "Listrik" },
];

const StrukturFasilitas = () => {
  const { data: facilities, isLoading } = useFacilities();
  const createMutation = useCreateFacility();
  const updateMutation = useUpdateFacility();
  const deleteMutation = useDeleteFacility();
  const { isSuperAdmin } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<typeof facilities[0] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    icon_name: "Building2",
    floor_location: "",
    status: "Aktif",
    image_url: "",
    display_order: 0,
  });

  const resetForm = () => {
    setForm({ name: "", description: "", icon_name: "Building2", floor_location: "", status: "Aktif", image_url: "", display_order: 0 });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setIsOpen(false);
    resetForm();
  };

  const handleEdit = (facility: typeof facilities[0]) => {
    setEditingId(facility.id);
    setForm({
      name: facility.name,
      description: facility.description || "",
      icon_name: facility.icon_name || "Building2",
      floor_location: facility.floor_location || "",
      status: facility.status || "Aktif",
      image_url: facility.image_url || "",
      display_order: facility.display_order || 0,
    });
    setSelectedFacility(null);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus fasilitas ini?")) {
      await deleteMutation.mutateAsync(id);
      setSelectedFacility(null);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Struktur Fasilitas</h1>
            <p className="text-muted-foreground">Fasilitas yang tersedia di gedung</p>
          </div>
          {isSuperAdmin && (
            <Button onClick={() => { resetForm(); setIsOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Fasilitas
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {facilities?.map((facility, index) => {
            const IconComponent = iconMap[facility.icon_name || "Building2"] || Building2;
            
            return (
              <div
                key={facility.id}
                className="bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-scale-in cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setSelectedFacility(facility)}
              >
                {facility.image_url ? (
                  <div className="w-full h-32 rounded-xl overflow-hidden mb-4">
                    <img src={facility.image_url} alt={facility.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                )}
                <h3 className="font-bold text-foreground mb-1">{facility.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{facility.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {facility.floor_location}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      facility.status === "Aktif"
                        ? "bg-success-light text-success"
                        : "bg-warning-light text-warning"
                    }`}
                  >
                    {facility.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {facilities?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Belum ada fasilitas terdaftar
          </div>
        )}
      </div>

      {/* Add/Edit Facility Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Fasilitas" : "Tambah Fasilitas Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Fasilitas</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={form.icon_name} onValueChange={(v) => setForm({ ...form, icon_name: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Standby">Standby</SelectItem>
                    <SelectItem value="Tidak Aktif">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lokasi</Label>
              <Input
                value={form.floor_location}
                onChange={(e) => setForm({ ...form, floor_location: e.target.value })}
                placeholder="Lt. 5, B1-B3, All Area"
              />
            </div>
            <div className="space-y-2">
              <Label>URL Gambar</Label>
              <Input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Update" : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Facility Detail Dialog */}
      <Dialog open={!!selectedFacility} onOpenChange={(open) => !open && setSelectedFacility(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Fasilitas</DialogTitle>
          </DialogHeader>
          {selectedFacility && (
            <div className="space-y-4">
              {selectedFacility.image_url ? (
                <div className="w-full h-48 rounded-xl overflow-hidden">
                  <img src={selectedFacility.image_url} alt={selectedFacility.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  {(() => {
                    const IconComponent = iconMap[selectedFacility.icon_name || "Building2"] || Building2;
                    return <IconComponent className="w-8 h-8 text-primary" />;
                  })()}
                </div>
              )}
              
              <div>
                <h3 className="text-xl font-bold">{selectedFacility.name}</h3>
                <p className="text-muted-foreground mt-2">{selectedFacility.description}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Lokasi: {selectedFacility.floor_location}
                </span>
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                    selectedFacility.status === "Aktif"
                      ? "bg-success-light text-success"
                      : "bg-warning-light text-warning"
                  }`}
                >
                  {selectedFacility.status}
                </span>
              </div>

              {isSuperAdmin && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => handleEdit(selectedFacility)} className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(selectedFacility.id)} className="flex-1">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default StrukturFasilitas;
