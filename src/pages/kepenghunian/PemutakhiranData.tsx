import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, ShieldAlert, Search, Pencil, UserSearch } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
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
  type PenghuniUpdate,
} from "@/hooks/usePenghuniUpdates";


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
  const { user } = useAuth();
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


  // Prefill dari data pemutakhiran sebelumnya, fallback data penghuni
  useEffect(() => {
    if (isLoading) return;
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
  }, [myUpdate, profile, isLoading]);

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
      await save.mutateAsync({ ...form, declaration_accepted: true } as any);
      setSuccess({
        name: form.full_name,
        unit: form.unit_number.toUpperCase(),
        date: new Date().toLocaleString("id-ID"),
      });
      toast({ title: "Pemutakhiran Data Berhasil", description: "Data penghuni unit Anda telah berhasil diperbarui." });
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

  if (success) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto py-12 animate-fade-in">
          <Card className="text-center">
            <CardContent className="pt-8 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
              <h2 className="text-xl font-bold">Pemutakhiran Data Berhasil</h2>
              <p className="text-muted-foreground text-sm">
                Terima kasih. Data penghuni unit Anda telah berhasil diperbarui.
              </p>
              <Badge className="bg-success text-success-foreground">DATA SUDAH DIPERBARUI</Badge>
              <div className="text-sm text-left border rounded-lg p-4 space-y-1">
                <p><span className="text-muted-foreground">Nama:</span> {success.name}</p>
                <p><span className="text-muted-foreground">Nomor Unit:</span> {success.unit}</p>
                <p><span className="text-muted-foreground">Tanggal Pemutakhiran:</span> {success.date}</p>
              </div>
              <Button className="w-full" onClick={() => navigate("/")}>Kembali ke Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl">
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
    </MainLayout>
  );
}
