import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useKeluhan, useCreateKeluhan, useUpdateKeluhanStatus } from "@/hooks/useKeluhan";
import { UnitSelector } from "@/components/shared/UnitSelector";
import { PermissionButton } from "@/components/ui/permission-button";
import { LoginPromptButton } from "@/components/shared/LoginPromptButton";
import { usePermissions } from "@/hooks/usePermissions";
import { MessageSquareWarning, Plus, Loader2, Upload, ImageIcon, Video } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-warning/20 text-warning border-warning/30",
  proses: "bg-info/20 text-info border-info/30",
  selesai: "bg-success/20 text-success border-success/30",
};

export default function KeluhanPenghuni() {
  const { getFeaturePermission, isAuthenticated } = usePermissions();
  const permission = getFeaturePermission("keluhan");
  const { data: keluhan, isLoading } = useKeluhan();
  const createMutation = useCreateKeluhan();
  const updateStatusMutation = useUpdateKeluhanStatus();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedKeluhan, setSelectedKeluhan] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<"pending" | "proses" | "selesai">("pending");
  const [response, setResponse] = useState("");

  const [form, setForm] = useState({
    penghuni_name: "",
    penghuni_type: "",
    unit_number: "",
    subject: "",
    description: "",
    media_file: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      subject: form.subject,
      description: form.description,
    });
    setIsOpen(false);
    setForm({ penghuni_name: "", penghuni_type: "", unit_number: "", subject: "", description: "", media_file: null });
  };

  const handleUpdateStatus = async () => {
    if (selectedKeluhan) {
      await updateStatusMutation.mutateAsync({
        id: selectedKeluhan,
        status: newStatus,
        response: response || undefined,
      });
      setSelectedKeluhan(null);
      setResponse("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, media_file: file });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-warning/10 rounded-xl">
              <MessageSquareWarning className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Keluhan Penghuni</h1>
              <p className="text-muted-foreground">Kelola keluhan dan tanggapi penghuni</p>
            </div>
          </div>

          {!isAuthenticated ? (
            <LoginPromptButton />
          ) : (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <PermissionButton
                  hasPermission={permission.canCreate}
                  tooltip={permission.tooltip}
                  category="blue"
                  className="ring-2 ring-user-blue"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Input Keluhan
                </PermissionButton>
              </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Input Keluhan Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Penghuni</Label>
                  <Input
                    value={form.penghuni_name}
                    onChange={(e) => setForm({ ...form, penghuni_name: e.target.value })}
                    placeholder="Masukkan nama penghuni"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status Penghuni</Label>
                  <Select value={form.penghuni_type} onValueChange={(v) => setForm({ ...form, penghuni_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pemilik">Pemilik</SelectItem>
                      <SelectItem value="penyewa">Penyewa</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <UnitSelector
                  value={form.unit_number}
                  onChange={(v) => setForm({ ...form, unit_number: v })}
                />

                <div className="space-y-2">
                  <Label>Subjek Keluhan</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Contoh: AC tidak dingin"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Jelaskan detail keluhan..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload Foto/Video</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="media-upload"
                    />
                    <label htmlFor="media-upload" className="cursor-pointer">
                      {form.media_file ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                          {form.media_file.type.startsWith("video") ? (
                            <Video className="w-5 h-5" />
                          ) : (
                            <ImageIcon className="w-5 h-5" />
                          )}
                          {form.media_file.name}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Upload className="w-8 h-8" />
                          <span className="text-sm">Klik untuk upload foto atau video</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Simpan
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Keluhan</CardTitle>
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
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Penghuni</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Subjek</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keluhan?.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell>{format(new Date(k.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{k.penghuni?.full_name || "-"}</TableCell>
                      <TableCell>{k.units?.unit_number || "-"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{k.subject}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{k.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[k.status]}>
                          {k.status === "pending" ? "Pending" : k.status === "proses" ? "Proses" : "Selesai"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog open={selectedKeluhan === k.id} onOpenChange={(open) => !open && setSelectedKeluhan(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedKeluhan(k.id);
                                setNewStatus(k.status);
                                setResponse(k.response || "");
                              }}
                            >
                              Update Status
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Status Keluhan</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as "pending" | "proses" | "selesai")}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="proses">Proses</SelectItem>
                                    <SelectItem value="selesai">Selesai</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Respons/Catatan</Label>
                                <Textarea
                                  value={response}
                                  onChange={(e) => setResponse(e.target.value)}
                                  placeholder="Tambahkan respons atau catatan..."
                                  rows={3}
                                />
                              </div>
                              <Button onClick={handleUpdateStatus} disabled={updateStatusMutation.isPending} className="w-full">
                                {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Simpan
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {keluhan?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Belum ada keluhan
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
