import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useBroadcastMessages, TargetType } from "@/hooks/useBroadcastMessages";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ShieldAlert, Megaphone, Send, Trash2, Clock, Users, Building2, Home, UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const TOWERS = ["Tower A", "Tower B", "Tower C", "Tower D"];

const targetLabels: Record<TargetType, string> = {
  all: "Semua Penghuni",
  tower: "Berdasarkan Tower",
  unit: "Berdasarkan Unit",
  custom: "Pilih Penghuni",
};

export default function BroadcastPesan() {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const { messages, isLoading, sendMessage, deleteMessage } = useBroadcastMessages();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [selectedTowers, setSelectedTowers] = useState<string[]>([]);
  const [unitInput, setUnitInput] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [penghuniList, setPenghuniList] = useState<{ user_id: string; full_name: string; unit_number: string | null }[]>([]);
  const [selectedPenghuni, setSelectedPenghuni] = useState<string[]>([]);
  const [penghuniSearch, setPenghuniSearch] = useState("");
  const [loadingPenghuni, setLoadingPenghuni] = useState(false);

  const canAccess = isSuperAdmin || isAdmin;

  // Load penghuni list when custom target selected
  useEffect(() => {
    if (targetType === "custom" && penghuniList.length === 0) {
      setLoadingPenghuni(true);
      supabase
        .from("penghuni")
        .select("user_id, full_name, unit_number")
        .eq("is_active", true)
        .not("user_id", "is", null)
        .order("full_name")
        .then(({ data }) => {
          setPenghuniList(data || []);
          setLoadingPenghuni(false);
        });
    }
  }, [targetType]);

  if (!user || !canAccess) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Hanya Super Admin dan Admin yang dapat mengakses halaman ini.
          </p>
        </div>
      </MainLayout>
    );
  }

  const handleAddUnit = () => {
    const trimmed = unitInput.trim().toUpperCase();
    if (trimmed && !selectedUnits.includes(trimmed)) {
      setSelectedUnits([...selectedUnits, trimmed]);
    }
    setUnitInput("");
  };

  const handleRemoveUnit = (unit: string) => {
    setSelectedUnits(selectedUnits.filter((u) => u !== unit));
  };

  const toggleTower = (tower: string) => {
    setSelectedTowers((prev) =>
      prev.includes(tower) ? prev.filter((t) => t !== tower) : [...prev, tower]
    );
  };

  const togglePenghuni = (userId: string) => {
    setSelectedPenghuni((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const getTargetValue = (): string[] => {
    switch (targetType) {
      case "tower": return selectedTowers;
      case "unit": return selectedUnits;
      case "custom": return selectedPenghuni;
      default: return [];
    }
  };

  const isTargetValid = () => {
    if (targetType === "all") return true;
    if (targetType === "tower") return selectedTowers.length > 0;
    if (targetType === "unit") return selectedUnits.length > 0;
    if (targetType === "custom") return selectedPenghuni.length > 0;
    return false;
  };

  const handleSend = async () => {
    if (!title.trim() || !content.trim() || !isTargetValid()) return;
    await sendMessage.mutateAsync({
      title: title.trim(),
      content: content.trim(),
      targetType,
      targetValue: getTargetValue(),
    });
    setTitle("");
    setContent("");
    setTargetType("all");
    setSelectedTowers([]);
    setSelectedUnits([]);
    setSelectedPenghuni([]);
  };

  const filteredPenghuni = penghuniList.filter(
    (p) =>
      p.full_name.toLowerCase().includes(penghuniSearch.toLowerCase()) ||
      (p.unit_number || "").toLowerCase().includes(penghuniSearch.toLowerCase())
  );

  const getTargetBadge = (msg: { target_type: string; target_value: string[] }) => {
    if (msg.target_type === "all") return "Semua";
    if (msg.target_type === "tower") return msg.target_value.join(", ");
    if (msg.target_type === "unit") return `${msg.target_value.length} unit`;
    if (msg.target_type === "custom") return `${msg.target_value.length} penghuni`;
    return "—";
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Broadcast Pesan Penghuni</h1>
            <p className="text-muted-foreground">Kirim pengumuman ke penghuni</p>
          </div>
        </div>

        {/* Send Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kirim Pesan Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="msg-title">Judul Pesan</Label>
              <Input
                id="msg-title"
                placeholder="Masukkan judul pesan..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg-content">Isi Pesan</Label>
              <Textarea
                id="msg-content"
                placeholder="Tulis isi pesan pengumuman..."
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={5000}
              />
            </div>

            {/* Target Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Pilihan Target Pengiriman</Label>
              <RadioGroup
                value={targetType}
                onValueChange={(v) => setTargetType(v as TargetType)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {(["all", "tower", "unit", "custom"] as TargetType[]).map((type) => {
                  const icons = { all: Users, tower: Building2, unit: Home, custom: UserCheck };
                  const Icon = icons[type];
                  return (
                    <label
                      key={type}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        targetType === type
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <RadioGroupItem value={type} id={`target-${type}`} />
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">{targetLabels[type]}</span>
                    </label>
                  );
                })}
              </RadioGroup>

              {/* Tower Selection */}
              {targetType === "tower" && (
                <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                  <Label className="text-sm">Pilih Tower:</Label>
                  <div className="flex flex-wrap gap-3">
                    {TOWERS.map((tower) => (
                      <label key={tower} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedTowers.includes(tower)}
                          onCheckedChange={() => toggleTower(tower)}
                        />
                        <span className="text-sm">{tower}</span>
                      </label>
                    ))}
                  </div>
                  {selectedTowers.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Dipilih: {selectedTowers.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {/* Unit Selection */}
              {targetType === "unit" && (
                <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                  <Label className="text-sm">Tambahkan No. Unit:</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Contoh: A-01-01"
                      value={unitInput}
                      onChange={(e) => setUnitInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddUnit())}
                      className="flex-1"
                    />
                    <Button type="button" variant="secondary" onClick={handleAddUnit} size="sm">
                      Tambah
                    </Button>
                  </div>
                  {selectedUnits.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedUnits.map((unit) => (
                        <Badge key={unit} variant="secondary" className="gap-1 pr-1">
                          {unit}
                          <button
                            onClick={() => handleRemoveUnit(unit)}
                            className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Custom Penghuni Selection */}
              {targetType === "custom" && (
                <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                  <Label className="text-sm">Pilih Penghuni:</Label>
                  <Input
                    placeholder="Cari nama atau unit..."
                    value={penghuniSearch}
                    onChange={(e) => setPenghuniSearch(e.target.value)}
                  />
                  {selectedPenghuni.length > 0 && (
                    <p className="text-xs text-primary font-medium">
                      {selectedPenghuni.length} penghuni dipilih
                    </p>
                  )}
                  <ScrollArea className="h-48 border rounded-md">
                    {loadingPenghuni ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Memuat...</p>
                    ) : filteredPenghuni.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Tidak ditemukan</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {filteredPenghuni.map((p) => (
                          <label
                            key={p.user_id}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-accent/50 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedPenghuni.includes(p.user_id)}
                              onCheckedChange={() => togglePenghuni(p.user_id)}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{p.full_name}</p>
                              {p.unit_number && (
                                <p className="text-xs text-muted-foreground">Unit {p.unit_number}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>

            <Button
              onClick={handleSend}
              disabled={!title.trim() || !content.trim() || !isTargetValid() || sendMessage.isPending}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {sendMessage.isPending ? "Mengirim..." : "Kirim Pesan"}
            </Button>
          </CardContent>
        </Card>

        {/* Message History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Riwayat Pesan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Memuat...</p>
            ) : messages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Belum ada pesan broadcast</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{msg.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), "dd MMM yyyy, HH:mm", { locale: localeId })}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {msg.sender_name || "Admin"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Target: {getTargetBadge(msg)}
                        </Badge>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Pesan?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Pesan ini akan dihapus permanen dan tidak bisa dikembalikan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMessage.mutate(msg.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
