import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForeignGuests, useCreateForeignGuest } from "@/hooks/useForeignGuests";
import { UnitSelector } from "@/components/shared/UnitSelector";
import { PermissionButton } from "@/components/ui/permission-button";
import { LoginPromptButton } from "@/components/shared/LoginPromptButton";
import { usePermissions } from "@/hooks/usePermissions";
import { Globe, Plus, Loader2, Upload } from "lucide-react";
import { format } from "date-fns";

export default function TamuAsing() {
  const { getFeaturePermission, isAuthenticated } = usePermissions();
  const permission = getFeaturePermission("tamu-asing");
  const { data: guests, isLoading } = useForeignGuests();
  const createMutation = useCreateForeignGuest();

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    unit_number: "",
    birth_place: "",
    birth_date: "",
    gender: "" as "pria" | "wanita" | "",
    nationality: "",
    passport_number: "",
    passport_expiry: "",
    passport_photo: null as File | null,
    check_in_date: "",
    check_out_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gender) return;
    
    await createMutation.mutateAsync({
      full_name: form.full_name,
      birth_place: form.birth_place,
      birth_date: form.birth_date,
      gender: form.gender,
      nationality: form.nationality,
      passport_number: form.passport_number,
      passport_expiry: form.passport_expiry,
      check_in_date: form.check_in_date,
      check_out_date: form.check_out_date,
    });
    setIsOpen(false);
    setForm({
      full_name: "",
      unit_number: "",
      birth_place: "",
      birth_date: "",
      gender: "",
      nationality: "",
      passport_number: "",
      passport_expiry: "",
      passport_photo: null,
      check_in_date: "",
      check_out_date: "",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, passport_photo: file });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-info/10 rounded-xl">
              <Globe className="w-6 h-6 text-info" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pelaporan Tamu Asing (WNA)</h1>
              <p className="text-muted-foreground">Catat data tamu warga negara asing</p>
            </div>
          </div>

          {!isAuthenticated ? (
            <LoginPromptButton />
          ) : (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <PermissionButton
                  hasPermission={permission?.canCreate ?? true}
                  tooltip={permission?.tooltip}
                  category="blue"
                  className="ring-2 ring-user-blue"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Lapor Tamu Asing
                </PermissionButton>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Pelaporan Tamu Asing (WNA)</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nama Lengkap Orang Asing <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>

                  <UnitSelector
                    value={form.unit_number}
                    onChange={(v) => setForm({ ...form, unit_number: v })}
                    label="Alamat Tower & Unit *"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tempat Lahir <span className="text-destructive">*</span></Label>
                      <Input
                        value={form.birth_place}
                        onChange={(e) => setForm({ ...form, birth_place: e.target.value })}
                        placeholder="Kota/Negara"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Lahir <span className="text-destructive">*</span></Label>
                      <Input
                        type="date"
                        value={form.birth_date}
                        onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Jenis Kelamin <span className="text-destructive">*</span></Label>
                    <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as "pria" | "wanita" })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pria">Pria</SelectItem>
                        <SelectItem value="wanita">Wanita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Kewarganegaraan <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.nationality}
                      onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                      placeholder="Contoh: Amerika Serikat"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nomor Paspor <span className="text-destructive">*</span></Label>
                      <Input
                        value={form.passport_number}
                        onChange={(e) => setForm({ ...form, passport_number: e.target.value })}
                        placeholder="Nomor paspor"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Masa Berlaku <span className="text-destructive">*</span></Label>
                      <Input
                        type="date"
                        value={form.passport_expiry}
                        onChange={(e) => setForm({ ...form, passport_expiry: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Foto Halaman Biodata Paspor <span className="text-destructive">*</span></Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="passport-upload"
                        required
                      />
                      <label htmlFor="passport-upload" className="cursor-pointer">
                        {form.passport_photo ? (
                          <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                            <Upload className="w-5 h-5" />
                            {form.passport_photo.name}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="w-8 h-8" />
                            <span className="text-sm">Klik untuk upload foto paspor</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tanggal Check In <span className="text-destructive">*</span></Label>
                      <Input
                        type="date"
                        value={form.check_in_date}
                        onChange={(e) => setForm({ ...form, check_in_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Check Out <span className="text-destructive">*</span></Label>
                      <Input
                        type="date"
                        value={form.check_out_date}
                        onChange={(e) => setForm({ ...form, check_out_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Simpan Laporan
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Tamu Asing</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Kewarganegaraan</TableHead>
                    <TableHead>No. Paspor</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests?.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{g.full_name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{g.gender}</p>
                        </div>
                      </TableCell>
                      <TableCell>{g.units?.unit_number || "-"}</TableCell>
                      <TableCell>{g.nationality}</TableCell>
                      <TableCell className="font-mono">{g.passport_number}</TableCell>
                      <TableCell>{format(new Date(g.check_in_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{format(new Date(g.check_out_date), "dd/MM/yyyy")}</TableCell>
                    </TableRow>
                  ))}
                  {guests?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Belum ada data tamu asing
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
