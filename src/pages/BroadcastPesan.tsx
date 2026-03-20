import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useBroadcastMessages } from "@/hooks/useBroadcastMessages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { ShieldAlert, Megaphone, Send, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function BroadcastPesan() {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const { messages, isLoading, sendMessage, deleteMessage } = useBroadcastMessages();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const canAccess = isSuperAdmin || isAdmin;

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

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) return;
    await sendMessage.mutateAsync({ title: title.trim(), content: content.trim() });
    setTitle("");
    setContent("");
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Broadcast Pesan Penghuni</h1>
            <p className="text-muted-foreground">Kirim pengumuman ke seluruh penghuni</p>
          </div>
        </div>

        {/* Send Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kirim Pesan Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="msg-title">Judul Pesan</Label>
              <Input
                id="msg-title"
                placeholder="Masukkan judul pesan..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!title.trim() || !content.trim() || sendMessage.isPending}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {sendMessage.isPending ? "Mengirim..." : "Kirim ke Semua Penghuni"}
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
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), "dd MMM yyyy, HH:mm", { locale: localeId })}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {msg.sender_name || "Admin"}
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
