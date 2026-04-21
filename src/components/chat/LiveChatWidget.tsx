import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLiveChat } from "@/hooks/useLiveChat";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STORAGE_KEY = "ajms-live-chat-open";

export function LiveChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { conversation, messages, sendMessage } = useLiveChat();

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved === "1") setOpen(true);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  }, [open]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Hide for unlogged users only
  if (!user) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    try {
      await sendMessage.mutateAsync(text);
    } catch (err) {
      console.error(err);
    }
  };

  const statusLabel = (s?: string) =>
    s === "dibalas_admin" ? "Dibalas Admin" : s === "menunggu_admin" ? "Menunggu Admin" : "Auto Reply";

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[100] h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
          aria-label="Buka live chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-[100] w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-2rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div>
              <p className="font-semibold text-sm">Live Chat AJMS</p>
              <p className="text-xs opacity-90">{statusLabel(conversation?.status)}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded" aria-label="Minimize">
                <Minus className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded" aria-label="Tutup">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/30">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground mt-8">
                <p>Halo! Ada yang bisa kami bantu?</p>
                <p className="text-xs mt-1">Ketik pertanyaan Anda di bawah.</p>
              </div>
            )}
            {messages.map((m) => {
              const isMine = m.message_type === "user";
              const isSystem = m.message_type === "auto_reply" || m.message_type === "system";
              return (
                <div key={m.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : isSystem
                        ? "bg-secondary text-secondary-foreground rounded-bl-sm"
                        : "bg-card border border-border rounded-bl-sm"
                    )}
                  >
                    {!isMine && (
                      <p className="text-[10px] font-medium opacity-70 mb-0.5 flex items-center gap-1">
                        {m.sender_name || "Admin"}
                        {isSystem && <Badge variant="outline" className="h-4 text-[9px] px-1">Auto</Badge>}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={cn("text-[10px] opacity-60 mt-1", isMine ? "text-right" : "")}>
                      {format(new Date(m.created_at), "HH:mm")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSend} className="p-2 border-t border-border bg-card flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pesan..."
              className="flex-1"
              disabled={sendMessage.isPending}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || sendMessage.isPending}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
