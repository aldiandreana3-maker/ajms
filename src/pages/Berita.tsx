import { useState, useRef } from "react";
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
import { useNews, useCreateNews, useUpdateNews, useDeleteNews } from "@/hooks/useNews";
import { useAuth } from "@/contexts/AuthContext";
import { Newspaper, Plus, Loader2, Edit, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/imageCompression";
import { toast } from "sonner";

export default function Berita() {
  const { data: news, isLoading } = useNews();
  const createMutation = useCreateNews();
  const updateMutation = useUpdateNews();
  const deleteMutation = useDeleteNews();
  const { isSuperAdmin } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    content: "",
    image_url: "",
    status: "draft" as "draft" | "published",
    scheduled_at: "",
  });

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      image_url: "",
      status: "draft",
      scheduled_at: "",
    });
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const compressed = await compressImage(file).catch(() => file);
      const ext = (compressed.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("news-images")
        .upload(path, compressed, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("news-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Gambar berhasil diunggah");
    } catch (err: any) {
      toast.error("Gagal unggah gambar: " + (err?.message || "unknown"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        ...form,
        image_url: form.image_url || undefined,
        scheduled_at: form.scheduled_at || undefined,
      });
    } else {
      await createMutation.mutateAsync({
        ...form,
        image_url: form.image_url || undefined,
        scheduled_at: form.scheduled_at || undefined,
      });
    }
    setIsOpen(false);
    setEditingId(null);
    resetForm();
  };

  const handleEdit = (item: typeof news[0]) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      image_url: item.image_url || "",
      status: item.status as "draft" | "published",
      scheduled_at: item.scheduled_at || "",
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus berita ini?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-info/10 rounded-xl">
              <Newspaper className="w-6 h-6 text-info" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isSuperAdmin ? "Manajemen Berita" : "Berita & Pengumuman"}
              </h1>
              <p className="text-muted-foreground">
                {isSuperAdmin ? "Kelola berita dan pengumuman" : "Lihat berita dan pengumuman terbaru"}
              </p>
            </div>
          </div>

          {isSuperAdmin && (
            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) {
                setEditingId(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Berita
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Berita" : "Tambah Berita Baru"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Judul</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Judul berita..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Konten</Label>
                    <Textarea
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="Isi berita..."
                      rows={6}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL Gambar (opsional)</Label>
                    <Input
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "draft" | "published" })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Jadwal Publish (opsional)</Label>
                      <Input
                        type="datetime-local"
                        value={form.scheduled_at}
                        onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {editingId ? "Update" : "Simpan"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Berita</CardTitle>
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
                    <TableHead>Judul</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead>Dipublikasi</TableHead>
                    {isSuperAdmin && <TableHead>Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {news?.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="font-medium">{n.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{n.content}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={n.status === "published" ? "default" : "secondary"}>
                          {n.status === "published" ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(n.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{n.published_at ? format(new Date(n.published_at), "dd/MM/yyyy HH:mm") : "-"}</TableCell>
                      {isSuperAdmin && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(n)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(n.id)} disabled={deleteMutation.isPending}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {news?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">
                        Belum ada berita
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
