import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useBroadcastMessages } from "@/hooks/useBroadcastMessages";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, Mail, MailOpen, Clock, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function PesanPenghuni() {
  const { user } = useAuth();
  const { inbox, isLoading, markAsRead, unreadCount } = useBroadcastMessages();
  const [selectedMessage, setSelectedMessage] = useState<(typeof inbox)[0] | null>(null);

  const handleOpen = (msg: (typeof inbox)[0]) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      markAsRead.mutate(msg.id);
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Bell className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Silakan Login</h1>
          <p className="text-muted-foreground">Login untuk melihat pesan dari pengelola.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Pesan & Notifikasi
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {unreadCount} baru
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">Pengumuman dari pengelola gedung</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-12">Memuat...</p>
            ) : inbox.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">Belum ada pesan</p>
            ) : (
              <div className="divide-y divide-border">
                {inbox.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => handleOpen(msg)}
                    className={cn(
                      "w-full text-left px-4 py-4 hover:bg-accent/50 transition-colors flex items-start gap-3",
                      !msg.is_read && "bg-primary/5"
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      {msg.is_read ? (
                        <MailOpen className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Mail className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          "text-sm truncate",
                          msg.is_read ? "font-normal text-foreground" : "font-bold text-foreground"
                        )}>
                          {msg.title}
                        </h3>
                        {!msg.is_read && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">
                            Baru
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">
                          {format(new Date(msg.created_at), "dd MMM yyyy, HH:mm", { locale: localeId })}
                        </span>
                        <CheckCheck className={cn(
                          "w-4 h-4 ml-auto shrink-0",
                          msg.is_read ? "text-blue-500" : "text-muted-foreground/50"
                        )} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Detail Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg">{selectedMessage?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {selectedMessage && format(new Date(selectedMessage.created_at), "dd MMMM yyyy, HH:mm", { locale: localeId })}
                <span>•</span>
                <span>Dari: {selectedMessage?.sender_name || "Admin"}</span>
                <CheckCheck className="w-4 h-4 text-blue-500 ml-auto" />
              </div>
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {selectedMessage?.content}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
