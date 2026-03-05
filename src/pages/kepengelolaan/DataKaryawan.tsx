import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeBiodataList, useCreateEmployeeBiodata, useUpdateEmployeeBiodata, useDeleteEmployeeBiodata, EmployeeBiodata } from "@/hooks/useEmployeeBiodata";
import { useUsers } from "@/hooks/useUserManagement";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, ArrowLeft, Plus, Pencil, Trash2, Users, Search, Upload, User } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export default function DataKaryawan() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, isLimitedAccess } = useAuth();
  const canAccess = (isSuperAdmin || isAdmin) && !isLimitedAccess;

  const { data: biodataList = [], isLoading } = useEmployeeBiodataList();
  const { data: users = [] } = useUsers();
  const createBiodata = useCreateEmployeeBiodata();
  const updateBiodata = useUpdateEmployeeBiodata();
  const deleteBiodata = useDeleteEmployeeBiodata();
  const { uploadFile, uploading } = useFileUpload({ bucket: "kepenghunian-files", folder: "employee-photos" });

  const [showDialog, setShowDialog] = useState(false);
  const [editData, setEditData] = useState<EmployeeBiodata | null>(null);
  const [search, setSearch] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    user_id: "",
    full_name: "",
    birth_place: "",
    birth_date: "",
    phone: "",
    email: "",
    address: "",
    bank_account_number: "",
    bank_name: "",
    avatar_url: "",
  });

  // Load signed URLs for avatars
  useEffect(() => {
    const loadSignedUrls = async () => {
      const urls: Record<string, string> = {};
      for (const b of biodataList) {
        if (b.avatar_url) {
          const { data } = await supabase.storage
            .from("kepenghunian-files")
            .createSignedUrl(b.avatar_url, 3600);
          if (data?.signedUrl) urls[b.id] = data.signedUrl;
        }
      }
      setSignedUrls(urls);
    };
    if (biodataList.length > 0) loadSignedUrls();
  }, [biodataList]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    const path = await uploadFile(file);
    if (path) {
      setForm((p) => ({ ...p, avatar_url: path }));
    }
  };

  // Filter staff users (not penghuni/agent)
  const staffUsers = users.filter(
    (u) => u.role && !["penghuni", "agent"].includes(u.role)
  );

  // Users that don't have biodata yet
  const availableUsers = staffUsers.filter(
    (u) => !biodataList.some((b) => b.user_id === u.id)
  );

  const filteredList = biodataList.filter((b) =>
    b.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditData(null);
    setAvatarPreview(null);
    setForm({
      user_id: "",
      full_name: "",
      birth_place: "",
      birth_date: "",
      phone: "",
      email: "",
      address: "",
      bank_account_number: "",
      bank_name: "",
      avatar_url: "",
    });
    setShowDialog(true);
  };

  const openEdit = (data: EmployeeBiodata) => {
    setEditData(data);
    setAvatarPreview(signedUrls[data.id] || null);
    setForm({
      user_id: data.user_id,
      full_name: data.full_name,
      birth_place: data.birth_place || "",
      birth_date: data.birth_date || "",
      phone: data.phone || "",
      email: data.email || "",
      address: data.address || "",
      bank_account_number: data.bank_account_number || "",
      bank_name: data.bank_name || "",
      avatar_url: data.avatar_url || "",
    });
    setShowDialog(true);
  };

  const handleUserSelect = (userId: string) => {
    const user = staffUsers.find((u) => u.id === userId);
    setForm((prev) => ({
      ...prev,
      user_id: userId,
      full_name: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      avatar_url: user?.avatar_url || "",
    }));
  };

  const handleSave = () => {
    if (!form.full_name || !form.user_id) return;

    if (editData) {
      updateBiodata.mutate(
        {
          id: editData.id,
          full_name: form.full_name,
          birth_place: form.birth_place || null,
          birth_date: form.birth_date || null,
          phone: form.phone || null,
          email: form.email || null,
          address: form.address || null,
          bank_account_number: form.bank_account_number || null,
          bank_name: form.bank_name || null,
          avatar_url: form.avatar_url || null,
        },
        { onSuccess: () => setShowDialog(false) }
      );
    } else {
      createBiodata.mutate(
        {
          user_id: form.user_id,
          full_name: form.full_name,
          birth_place: form.birth_place || null,
          birth_date: form.birth_date || null,
          phone: form.phone || null,
          email: form.email || null,
          address: form.address || null,
          bank_account_number: form.bank_account_number || null,
          bank_name: form.bank_name || null,
          avatar_url: form.avatar_url || null,
        },
        { onSuccess: () => setShowDialog(false) }
      );
    }
  };

  if (!canAccess) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
          <p className="text-muted-foreground text-center max-w-md">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/hrd-ga")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Data Karyawan</h1>
              <p className="text-muted-foreground">Kelengkapan data pribadi karyawan</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama karyawan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Data
          </Button>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Tempat, Tanggal Lahir</TableHead>
                <TableHead>No. Telepon</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>No. Rekening</TableHead>
                <TableHead className="w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Memuat data...</TableCell>
                </TableRow>
              ) : filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada data karyawan</TableCell>
                </TableRow>
              ) : (
                filteredList.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {signedUrls[b.id] ? (
                          <img src={signedUrls[b.id]} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {b.full_name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium">{b.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {b.birth_place || b.birth_date
                        ? `${b.birth_place || "-"}, ${b.birth_date ? format(new Date(b.birth_date), "dd MMM yyyy", { locale: localeId }) : "-"}`
                        : "-"}
                    </TableCell>
                    <TableCell>{b.phone || "-"}</TableCell>
                    <TableCell>{b.email || "-"}</TableCell>
                    <TableCell>
                      {b.bank_account_number
                        ? `${b.bank_name ? b.bank_name + " - " : ""}${b.bank_account_number}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Data Karyawan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Data {b.full_name} akan dihapus permanen.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteBiodata.mutate(b.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editData ? "Edit Data Karyawan" : "Tambah Data Karyawan"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!editData && (
                <div className="space-y-2">
                  <Label>Pilih Karyawan</Label>
                  <Select value={form.user_id} onValueChange={handleUserSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih karyawan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name || u.email} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tempat Lahir</Label>
                  <Input value={form.birth_place} onChange={(e) => setForm((p) => ({ ...p, birth_place: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Lahir</Label>
                  <Input type="date" value={form.birth_date} onChange={(e) => setForm((p) => ({ ...p, birth_date: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>No. Telepon</Label>
                  <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Bank</Label>
                  <Input value={form.bank_name} onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))} placeholder="BCA, BNI, dll" />
                </div>
                <div className="space-y-2">
                  <Label>No. Rekening</Label>
                  <Input value={form.bank_account_number} onChange={(e) => setForm((p) => ({ ...p, bank_account_number: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Foto Profil</Label>
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-14 h-14 rounded-full object-cover border" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Mengupload..." : "Upload Foto"}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
                <Button onClick={handleSave} disabled={!form.full_name || !form.user_id}>
                  {editData ? "Simpan Perubahan" : "Tambah"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
