import { useEffect, useRef, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Send, Plus, Trash2, Pencil, MessageSquare, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAdminConversations, useAdminMessages, useAdminReply, useKnowledgeBase } from "@/hooks/useLiveChat";
import { toast } from "sonner";
import { ImportKnowledgeDialog } from "@/components/chat/ImportKnowledgeDialog";
import { useQueryClient } from "@tanstack/react-query";

function ChatInbox() {
  const { data: rawConversations = [] } = useAdminConversations();
  // Hanya tampilkan percakapan yang sudah memiliki pesan (tidak kosong)
  const conversations = rawConversations.filter(
    (c) => !!c.last_message && c.last_message.trim().length > 0
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const { data: messages = [] } = useAdminMessages(activeId);
  const sendReply = useAdminReply();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId && conversations.length) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  // Mark active conversation as read for admin
  useEffect(() => {
    if (!activeId) return;
    const active = conversations.find((c) => c.id === activeId);
    if (active && active.unread_admin_count > 0) {
      import("@/integrations/supabase/client").then(({ supabase }) => {
        supabase
          .from("chat_conversations")
          .update({ unread_admin_count: 0 })
          .eq("id", activeId);
      });
    }
  }, [activeId, conversations]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const active = conversations.find((c) => c.id === activeId);

  const handleSend = async () => {
    const text = reply.trim();
    if (!text || !activeId) return;
    setReply("");
    try {
      await sendReply.mutateAsync({ conversationId: activeId, content: text });
    } catch {
      toast.error("Gagal mengirim balasan");
    }
  };

  const statusBadge = (s: string) => {
    if (s === "dibalas_admin") return <Badge variant="default">Dibalas Admin</Badge>;
    if (s === "menunggu_admin") return <Badge variant="destructive">Menunggu Admin</Badge>;
    return <Badge variant="secondary">Auto Reply</Badge>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-220px)]">
      <Card className="overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b font-semibold text-sm">Percakapan ({conversations.length})</div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-center text-sm text-muted-foreground p-6">Belum ada percakapan</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "w-full text-left px-4 py-3 border-b hover:bg-muted/50 transition-colors",
                activeId === c.id && "bg-muted"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm truncate">{c.user_name || c.user_email}</p>
                {c.unread_admin_count > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{c.unread_admin_count}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message || "—"}</p>
              <div className="flex items-center justify-between mt-1.5">
                {statusBadge(c.status)}
                <span className="text-[10px] text-muted-foreground">
                  {c.last_message_at && format(new Date(c.last_message_at), "dd MMM HH:mm")}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden flex flex-col">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto opacity-40" />
              <p className="mt-2">Pilih percakapan</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b">
              <p className="font-semibold text-sm">{active.user_name || active.user_email}</p>
              <p className="text-xs text-muted-foreground">{active.user_email}</p>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/20">
              {messages.map((m) => {
                const isUser = m.message_type === "user";
                const isSystem = m.message_type === "auto_reply" || m.message_type === "system";
                return (
                  <div key={m.id} className={cn("flex", isUser ? "justify-start" : "justify-end")}>
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-3 py-2 text-sm",
                        isUser
                          ? "bg-card border border-border rounded-bl-sm"
                          : isSystem
                          ? "bg-secondary text-secondary-foreground rounded-br-sm"
                          : "bg-primary text-primary-foreground rounded-br-sm"
                      )}
                    >
                      <p className="text-[10px] font-medium opacity-70 mb-0.5">
                        {m.sender_name || (isUser ? "User" : "Admin")}
                        {isSystem && " · Auto"}
                      </p>
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p className="text-[10px] opacity-60 mt-1">
                        {format(new Date(m.created_at), "dd MMM HH:mm")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t flex gap-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Tulis balasan..."
                rows={2}
                className="resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button onClick={handleSend} disabled={!reply.trim() || sendReply.isPending}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

interface KbForm {
  id?: string;
  question: string;
  answer: string;
  keywords: string;
  is_active: boolean;
}

function KnowledgeBasePanel() {
  const { data: items = [], create, update, remove, removeAll } = useKnowledgeBase();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const qc = useQueryClient();
  const [form, setForm] = useState<KbForm>({ question: "", answer: "", keywords: "", is_active: true });

  const openNew = () => {
    setForm({ question: "", answer: "", keywords: "", is_active: true });
    setOpen(true);
  };

  const openEdit = (it: any) => {
    setForm({
      id: it.id,
      question: it.question,
      answer: it.answer,
      keywords: (it.keywords || []).join(", "),
      is_active: it.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Pertanyaan dan jawaban wajib diisi");
      return;
    }
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      is_active: form.is_active,
    };
    try {
      if (form.id) await update.mutateAsync({ id: form.id, ...payload });
      else await create.mutateAsync(payload);
      toast.success("Tersimpan");
      setOpen(false);
    } catch {
      toast.error("Gagal menyimpan");
    }
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="font-semibold">Knowledge Base</h3>
          <p className="text-sm text-muted-foreground">
            Materi jawaban untuk auto-reply. Tambah satu per satu, tempel artikel panjang, atau upload file.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Tempel / Upload Materi
          </Button>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Manual
          </Button>
          <Button
            variant="destructive"
            disabled={items.length === 0 || removeAll.isPending}
            onClick={async () => {
              if (confirm(`Hapus SEMUA ${items.length} knowledge base? Tindakan ini tidak dapat dibatalkan.`)) {
                try {
                  await removeAll.mutateAsync();
                  toast.success("Semua knowledge base dihapus");
                } catch {
                  toast.error("Gagal menghapus semua");
                }
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Hapus Semua
          </Button>
        </div>
      </div>

      <ImportKnowledgeDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => qc.invalidateQueries({ queryKey: ["chat-kb"] })}
      />

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Belum ada knowledge base</p>
        )}
        {items.map((it: any) => (
          <Card key={it.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">{it.question}</p>
                  {!it.is_active && <Badge variant="outline">Nonaktif</Badge>}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{it.answer}</p>
                {it.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {it.keywords.map((k: string) => (
                      <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(it)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={async () => {
                    if (confirm("Hapus item ini?")) {
                      await remove.mutateAsync(it.id);
                      toast.success("Dihapus");
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit" : "Tambah"} Knowledge Base</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Pertanyaan</label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Jawaban</label>
              <Textarea
                rows={4}
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Keyword (pisahkan dengan koma)</label>
              <Input
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="contoh: tagihan, ipl, bayar"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <span className="text-sm">Aktif</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function LiveChatAdmin() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Live Chat</h1>
            <p className="text-sm text-muted-foreground">Kelola percakapan dan knowledge base</p>
          </div>

          <Tabs defaultValue="inbox">
            <TabsList>
              <TabsTrigger value="inbox">Inbox</TabsTrigger>
              <TabsTrigger value="kb">Knowledge Base</TabsTrigger>
            </TabsList>
            <TabsContent value="inbox" className="mt-4">
              <ChatInbox />
            </TabsContent>
            <TabsContent value="kb" className="mt-4">
              <KnowledgeBasePanel />
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
