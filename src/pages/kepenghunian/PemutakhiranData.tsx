import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { ArrowLeft, CheckCircle2, Loader2, ShieldAlert, Search, Pencil, UserSearch, FileSpreadsheet, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMyPenghuniProfile,
  useMyPenghuniUpdate,
  useSavePenghuniUpdate,
  useSearchPenghuniUpdates,
  useRecentPenghuniUpdates,
  useDeletePenghuniUpdate,
  type PenghuniUpdate,
} from "@/hooks/usePenghuniUpdates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const STATUS_OPTIONS = [
  "Pemilik",
  "Penyewa/Penghuni",
  "Kerabat Pemilik",
  "Agen",
  "Lainnya",
];

const CONDITIONS = [
  "Tidak Ada",
  "Lansia",
  "Balita",
  "Ibu Hamil",
  "Penghuni dengan kondisi kesehatan tertentu",
  "Lainnya",
];

interface FormState {
  unit_number: string;
  full_name: string;
  penghuni_status: string;
  owner_agent_name: string;
  lama_tinggal: string;
  phone: string;
  email: string;
  emergency_name: string;
  emergency_phone: string;
  emergency_relation: string;
  special_conditions: string[];
  lansia_name: string;
  balita_name: string;
  ibu_hamil_name: string;
  health_name: string;
  health_note: string;
  other_condition_note: string;
}

const emptyForm: FormState = {
  unit_number: "",
  full_name: "",
  penghuni_status: "",
  owner_agent_name: "",
  lama_tinggal: "",
  phone: "",
  email: "",
  emergency_name: "",
  emergency_phone: "",
  emergency_relation: "",
  special_conditions: [],
  lansia_name: "",
  balita_name: "",
  ibu_hamil_name: "",
  health_name: "",
  health_note: "",
  other_condition_note: "",
};

export default function PemutakhiranData() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isSuperAdmin } = useAuth();
  const { data: profile } = useMyPenghuniProfile();
  const { data: myUpdate, isLoading } = useMyPenghuniUpdate();
  const save = useSavePenghuniUpdate();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [declared, setDeclared] = useState(false);
  const [success, setSuccess] = useState<{ name: string; unit: string; date: string } | null>(null);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { data: results, isFetching: searching } = useSearchPenghuniUpdates(searchTerm);
  const [recentLimit, setRecentLimit] = useState("10");
  const { data: recent, isLoading: loadingRecent } = useRecentPenghuniUpdates(Number(recentLimit));
  const [exporting, setExporting] = useState(false);
  const del = useDeletePenghuniUpdate();
  const [toDelete, setToDelete] = useState<PenghuniUpdate | null>(null);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      if (editingId === toDelete.id) {
        setEditingId(undefined);
        setForm(emptyForm);
      }
      toast({ title: "Data dihapus", description: `${toDelete.unit_number} — ${toDelete.full_name}` });
      setToDelete(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal menghapus", description: e.message });
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("penghuni_updates")
        .select("*")
        .order("unit_number", { ascending: true });
      if (error) throw error;
      const rows = (data || []).map((r: any) => ({
        "Nomor Unit": r.unit_number || "",
        Tower: r.tower || "",
        "Nama Lengkap": r.full_name || "",
        "Status Kepenghunian": r.penghuni_status || "",
        "Nama Pemilik/Agen": r.owner_agent_name || "",
        "Lama Tinggal": r.lama_tinggal || "",
        "No. WhatsApp/Telepon": r.phone || "",
        Email: r.email || "",
        "Kontak Darurat": r.emergency_name || "",
        "No. Kontak Darurat": r.emergency_phone || "",
        Hubungan: r.emergency_relation || "",
        "Penghuni Khusus": (r.special_conditions || []).join(", "),
        Lansia: r.lansia_name || "",
        Balita: r.balita_name || "",
        "Ibu Hamil": r.ibu_hamil_name || "",
        "Kondisi Kesehatan": r.health_name || "",
        "Catatan Kesehatan": r.health_note || "",
        "Catatan Lainnya": r.other_condition_note || "",
        Status: r.status === "sudah_diperbarui" ? "Sudah Diperbarui" : "Belum Diperbarui",
        "Terakhir Diperbarui": r.last_updated_at || r.updated_at
          ? new Date(r.last_updated_at || r.updated_at).toLocaleString("id-ID")
          : "",
        "Diperbarui Oleh": r.updated_by_name || "",
      }));
      if (rows.length === 0) {
        toast({ title: "Tidak ada data", description: "Belum ada data untuk diekspor." });
        return;
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pemutakhiran Data");
      XLSX.writeFile(wb, `pemutakhiran-data-penghuni-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: "Export berhasil", description: `${rows.length} data diekspor.` });
    } catch (e: any) {
      toast({ title: "Export gagal", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  // Debounce live search
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fillFormFrom = (r: PenghuniUpdate) => {
    setEditingId(r.id);
    setForm({
      unit_number: r.unit_number || "",
      full_name: r.full_name || "",
      penghuni_status: r.penghuni_status || "",
      owner_agent_name: r.owner_agent_name || "",
      lama_tinggal: r.lama_tinggal || "",
      phone: r.phone || "",
      email: r.email || "",
      emergency_name: r.emergency_name || "",
      emergency_phone: r.emergency_phone || "",
      emergency_relation: r.emergency_relation || "",
      special_conditions: r.special_conditions || [],
      lansia_name: r.lansia_name || "",
      balita_name: r.balita_name || "",
      ibu_hamil_name: r.ibu_hamil_name || "",
      health_name: r.health_name || "",
      health_note: r.health_note || "",
      other_condition_note: r.other_condition_note || "",
    });
    setDeclared(!!r.declaration_accepted);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  // Prefill dari data pemutakhiran sebelumnya, fallback data penghuni (sekali saja)
  const prefilled = useRef(false);
  useEffect(() => {
    if (isLoading) return;
    if (editingId) return; // jangan timpa form saat sedang mengedit data pilihan
    if (prefilled.current) return;
    prefilled.current = true;
    if (myUpdate) {
      setForm({
        unit_number: myUpdate.unit_number || "",
        full_name: myUpdate.full_name || "",
        penghuni_status: myUpdate.penghuni_status || "",
        owner_agent_name: myUpdate.owner_agent_name || "",
        lama_tinggal: myUpdate.lama_tinggal || "",
        phone: myUpdate.phone || "",
        email: myUpdate.email || "",
        emergency_name: myUpdate.emergency_name || "",
        emergency_phone: myUpdate.emergency_phone || "",
        emergency_relation: myUpdate.emergency_relation || "",
        special_conditions: myUpdate.special_conditions || [],
        lansia_name: myUpdate.lansia_name || "",
        balita_name: myUpdate.balita_name || "",
        ibu_hamil_name: myUpdate.ibu_hamil_name || "",
        health_name: myUpdate.health_name || "",
        health_note: myUpdate.health_note || "",
        other_condition_note: myUpdate.other_condition_note || "",
      });
      setDeclared(!!myUpdate.declaration_accepted);
    } else if (profile) {
      setForm((f) => ({
        ...f,
        unit_number: profile.unit_number || "",
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        email: profile.email || "",
        penghuni_status: profile.is_owner ? "Pemilik" : f.penghuni_status,
      }));
    }
  }, [myUpdate, profile, isLoading, editingId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleCondition = (c: string) => {
    setForm((f) => {
      if (c === "Tidak Ada") return { ...f, special_conditions: ["Tidak Ada"] };
      const list = f.special_conditions.filter((x) => x !== "Tidak Ada");
      return {
        ...f,
        special_conditions: list.includes(c) ? list.filter((x) => x !== c) : [...list, c],
      };
    });
  };

  const has = (c: string) => form.special_conditions.includes(c);

  const handleSubmit = async () => {
    if (!form.unit_number.trim() || !form.full_name.trim()) {
      toast({ title: "Data belum lengkap", description: "Nomor unit dan nama wajib diisi.", variant: "destructive" });
      return;
    }
    if (!form.phone.trim()) {
      toast({ title: "Data belum lengkap", description: "Nomor WhatsApp/telepon wajib diisi.", variant: "destructive" });
      return;
    }
    if (!declared) {
      toast({ title: "Pernyataan diperlukan", description: "Mohon centang pernyataan kebenaran data.", variant: "destructive" });
      return;
    }
    try {
      await save.mutateAsync({ ...form, id: editingId, declaration_accepted: true } as any);
      setSuccess({
        name: form.full_name,
        unit: form.unit_number.toUpperCase(),
        date: new Date().toLocaleString("id-ID"),
      });
      // reset form ke kondisi awal
      setEditingId(undefined);
      setForm(emptyForm);
      setDeclared(false);
      toast({ title: "Berhasil", description: "Data penghuni berhasil disimpan dan diperbarui." });


    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Silakan Masuk</h1>
          <p className="text-muted-foreground">Login diperlukan untuk pemutakhiran data penghuni.</p>
          <Button onClick={() => navigate("/auth")}>Masuk</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Pemutakhiran Data Penghuni</h1>
            <p className="text-muted-foreground">Pastikan data unit Anda selalu terbaru</p>
          </div>
          <Badge
            className={
              myUpdate?.status === "sudah_diperbarui"
                ? "bg-success text-success-foreground"
                : "bg-warning text-white"
            }
          >
            {myUpdate?.status === "sudah_diperbarui" ? "Sudah Diperbarui" : "Belum Diperbarui"}
          </Badge>
        </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <div className="space-y-6 min-w-0">
        {editingId && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-primary/40 bg-primary/5 p-3">
            <p className="text-sm">
              Sedang mengedit data <span className="font-semibold">{form.unit_number}</span> — {form.full_name}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingId(undefined);
                setForm(emptyForm);
                setDeclared(false);
              }}
            >
              Batal Edit
            </Button>
          </div>
        )}
        {success && (
          <Card className="border-success/40 bg-success/5">
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-success">
                <CheckCircle2 className="w-5 h-5" /> Data penghuni berhasil disimpan dan diperbarui.
              </div>
              <div className="text-sm text-muted-foreground">
                {success.unit} — {success.name} · {success.date}
              </div>
            </CardContent>
          </Card>
        )}


        <Card>
          <CardHeader><CardTitle className="text-base">A. Data Unit & Penghuni</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nomor Unit *</Label>
              <Input
                value={form.unit_number}
                onChange={(e) => set("unit_number", e.target.value)}
                placeholder="Contoh: TB0827"
              />
            </div>
            <div className="space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status Kepenghunian</Label>
              <Select value={form.penghuni_status} onValueChange={(v) => set("penghuni_status", v)}>
                <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {["Penyewa/Penghuni", "Kerabat Pemilik", "Agen"].includes(form.penghuni_status) && (
              <div className="space-y-2">
                <Label>Nama Pemilik / Agen</Label>
                <Input value={form.owner_agent_name} onChange={(e) => set("owner_agent_name", e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Lama Tinggal</Label>
              <Input
                value={form.lama_tinggal}
                onChange={(e) => set("lama_tinggal", e.target.value)}
                placeholder="Contoh: 2 tahun"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">B. Data Kontak</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nomor WhatsApp / Telepon Aktif *</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="08xxxxxxxxxx" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nama Kontak Darurat</Label>
              <Input value={form.emergency_name} onChange={(e) => set("emergency_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nomor Kontak Darurat</Label>
              <Input value={form.emergency_phone} onChange={(e) => set("emergency_phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hubungan dengan Kontak Darurat</Label>
              <Input
                value={form.emergency_relation}
                onChange={(e) => set("emergency_relation", e.target.value)}
                placeholder="Contoh: Saudara"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">C. Data Penghuni Khusus</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Apakah terdapat penghuni dengan kondisi khusus di unit ini?
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {CONDITIONS.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={has(c)} onCheckedChange={() => toggleCondition(c)} />
                  {c}
                </label>
              ))}
            </div>

            {has("Lansia") && (
              <div className="space-y-2">
                <Label>Nama Lansia</Label>
                <Input value={form.lansia_name} onChange={(e) => set("lansia_name", e.target.value)} />
              </div>
            )}
            {has("Balita") && (
              <div className="space-y-2">
                <Label>Nama Balita</Label>
                <Input value={form.balita_name} onChange={(e) => set("balita_name", e.target.value)} />
              </div>
            )}
            {has("Ibu Hamil") && (
              <div className="space-y-2">
                <Label>Nama Ibu Hamil</Label>
                <Input value={form.ibu_hamil_name} onChange={(e) => set("ibu_hamil_name", e.target.value)} />
              </div>
            )}
            {has("Penghuni dengan kondisi kesehatan tertentu") && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Penghuni</Label>
                  <Input value={form.health_name} onChange={(e) => set("health_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Keterangan Kondisi Kesehatan</Label>
                  <Input value={form.health_note} onChange={(e) => set("health_note", e.target.value)} />
                </div>
              </div>
            )}
            {has("Lainnya") && (
              <div className="space-y-2">
                <Label>Keterangan Lainnya</Label>
                <Textarea
                  value={form.other_condition_note}
                  onChange={(e) => set("other_condition_note", e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Data yang Anda berikan digunakan oleh Pengelola The Jarrdin untuk keperluan administrasi,
              pelayanan kepenghunian, komunikasi, keamanan, dan keadaan darurat. Mohon pastikan data yang
              diberikan benar dan terbaru.
            </p>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox checked={declared} onCheckedChange={(v) => setDeclared(!!v)} />
              <span>Saya menyatakan bahwa data yang saya isi adalah benar dan dapat dipertanggungjawabkan.</span>
            </label>
            <Button className="w-full" onClick={handleSubmit} disabled={save.isPending}>
              {save.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan & Perbarui Data
            </Button>
          </CardContent>
        </Card>
        </div>

        {/* Panel kanan: pencarian data penghuni */}
        <div className="space-y-4 min-w-0 lg:sticky lg:top-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <UserSearch className="w-4 h-4" /> Cari Data Penghuni
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                )}
                Export Excel
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari nama penghuni atau nomor unit..."
                />
              </div>

              {!searchTerm.trim() || searchTerm.trim().length < 2 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Masukkan nama penghuni atau nomor unit untuk mencari, atau lihat data terbaru
                    yang sudah diinput di bawah ini.
                  </p>
                  <p className="text-xs font-medium">Data Terbaru Diinput</p>
                  {loadingRecent ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !recent || recent.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      Belum ada data yang diinput.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {recent.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-2 rounded-md border p-3"
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {r.unit_number} — {r.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {r.penghuni_status || "-"} • {r.phone || "-"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {r.last_updated_at || r.updated_at
                                ? new Date(r.last_updated_at || r.updated_at).toLocaleString("id-ID")
                                : "-"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button variant="outline" size="sm" onClick={() => fillFormFrom(r)}>
                              <Pencil className="w-4 h-4 mr-1" /> Edit
                            </Button>
                            {isSuperAdmin && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setToDelete(r)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : searching && !results ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !results || results.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <p className="font-medium">Data belum ditemukan</p>
                  <p className="text-sm text-muted-foreground">
                    Belum terdapat data penghuni yang sesuai dengan pencarian.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Silakan daftarkan data penghuni melalui formulir di sebelah kiri.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {results.length} data ditemukan
                  </p>
                  {results.map((r, i) => (
                    <Card key={r.id} className={i === 0 ? "border-primary/50" : ""}>
                      <CardContent className="pt-4 space-y-3">
                        {i === 0 && (
                          <Badge className="bg-success text-success-foreground">
                            Data Penghuni Ditemukan
                          </Badge>
                        )}
                        <div className="font-semibold">
                          {r.unit_number} — {r.full_name}
                        </div>
                        <div className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                          <Field label="Nomor Unit" value={r.unit_number} />
                          <Field label="Nama Lengkap" value={r.full_name} />
                          <Field label="Status Kepenghunian" value={r.penghuni_status} />
                          <Field label="Lama Tinggal" value={r.lama_tinggal} />
                          <Field label="Nomor WhatsApp / Telepon" value={r.phone} />
                          <Field label="Email" value={r.email} />
                          <Field label="Kontak Darurat" value={r.emergency_name} />
                          <Field label="Nomor Kontak Darurat" value={r.emergency_phone} />
                          <Field label="Hubungan" value={r.emergency_relation} />
                          <Field
                            label="Penghuni Khusus"
                            value={
                              r.special_conditions?.length
                                ? r.special_conditions.join(", ")
                                : "Tidak Ada"
                            }
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Terakhir diperbarui:{" "}
                          {r.last_updated_at || r.updated_at
                            ? new Date(r.last_updated_at || r.updated_at).toLocaleString("id-ID")
                            : "-"}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => fillFormFrom(r)}
                          >
                            <Pencil className="w-4 h-4 mr-2" /> Edit Data Ini
                          </Button>
                          {isSuperAdmin && (
                            <Button variant="destructive" size="sm" onClick={() => setToDelete(r)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Hapus
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data penghuni?</AlertDialogTitle>
            <AlertDialogDescription>
              Data {toDelete?.unit_number} — {toDelete?.full_name} akan dihapus permanen dan tidak
              dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={del.isPending}
            >
              {del.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words">{value || "-"}</p>
    </div>
  );
}

