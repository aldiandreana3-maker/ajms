import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSecurityPatrols } from "@/hooks/useSecurityPatrols";
import { useProfile } from "@/hooks/useProfile";
import { ArrowLeft, Plus, Shield, Camera, MapPin, Clock, Image } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function Security() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin, isLimitedAccess } = useAuth();
  const { profile } = useProfile();
  const { patrols, addPatrol, uploadPhoto } = useSecurityPatrols();
  const [open, setOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [form, setForm] = useState({ location: "", status: "aman", notes: "", photo: null as File | null });
  const [loading, setLoading] = useState(false);

  const canAccess = (isSuperAdmin || isAdmin) && !isLimitedAccess;
  if (!canAccess) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Shield className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async () => {
    if (!form.location) return;
    setLoading(true);
    try {
      let photo_url = null;
      if (form.photo) {
        photo_url = await uploadPhoto(form.photo);
      }
      await addPatrol.mutateAsync({
        location: form.location,
        status: form.status,
        notes: form.notes || null,
        photo_url,
        officer_id: user?.id,
        officer_name: profile?.full_name || user?.email || "",
      });
      setForm({ location: "", status: "aman", notes: "", photo: null });
      setPhotoPreview(null);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(f => ({ ...f, photo: file }));
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const statusColor = (s: string) => {
    if (s === "aman") return "bg-green-500/10 text-green-700 border-green-300";
    if (s === "mencurigakan") return "bg-yellow-500/10 text-yellow-700 border-yellow-300";
    return "bg-red-500/10 text-red-700 border-red-300";
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Security Patrol</h1>
              <p className="text-muted-foreground">Sistem patroli penjagaan real-time</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Catat Patroli</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Catat Patroli Baru</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Lokasi <span className="text-destructive">*</span></label>
                  <Input placeholder="Contoh: Lantai 5, Lobby, Parkir B2" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aman">Aman</SelectItem>
                      <SelectItem value="mencurigakan">Mencurigakan</SelectItem>
                      <SelectItem value="bahaya">Bahaya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Foto Patroli</label>
                  <Input type="file" accept="image/*" capture="environment" onChange={handleFileChange} />
                  {photoPreview && <img src={photoPreview} alt="Preview" className="mt-2 rounded-lg max-h-40 object-cover" />}
                </div>
                <div>
                  <label className="text-sm font-medium">Catatan</label>
                  <Textarea placeholder="Catatan tambahan..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={loading || !form.location}>
                  {loading ? "Menyimpan..." : "Simpan Patroli"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Patroli Hari Ini", value: patrols.data?.filter(p => p.patrol_date === format(new Date(), "yyyy-MM-dd")).length || 0, icon: Clock, color: "text-primary" },
            { label: "Status Aman", value: patrols.data?.filter(p => p.status === "aman" && p.patrol_date === format(new Date(), "yyyy-MM-dd")).length || 0, icon: Shield, color: "text-green-600" },
            { label: "Perlu Perhatian", value: patrols.data?.filter(p => p.status !== "aman" && p.patrol_date === format(new Date(), "yyyy-MM-dd")).length || 0, icon: MapPin, color: "text-destructive" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-4">
                <s.icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardHeader><CardTitle>Riwayat Patroli</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Petugas</TableHead>
                    <TableHead>Foto</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patrols.data?.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">{format(new Date(p.patrol_time), "dd MMM yyyy HH:mm", { locale: localeId })}</TableCell>
                      <TableCell>{p.location}</TableCell>
                      <TableCell><Badge className={statusColor(p.status)}>{p.status}</Badge></TableCell>
                      <TableCell>{p.officer_name || "-"}</TableCell>
                      <TableCell>
                        {p.photo_url ? (
                          <img
                            src={p.photo_url}
                            alt="Patrol"
                            className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedPhoto(p.photo_url)}
                          />
                        ) : <span className="text-muted-foreground text-sm">-</span>}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{p.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {!patrols.data?.length && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Belum ada data patroli</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Photo Viewer Dialog */}
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Foto Patroli</DialogTitle></DialogHeader>
            {selectedPhoto && <img src={selectedPhoto} alt="Full patrol" className="w-full rounded-lg object-contain max-h-[70vh]" />}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
