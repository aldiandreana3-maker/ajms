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
const POS_KEY = "ajms-live-chat-pos";

type Pos = { x: number; y: number };

function clampPos(p: Pos, w: number, h: number): Pos {
  const maxX = Math.max(0, window.innerWidth - w - 8);
  const maxY = Math.max(0, window.innerHeight - h - 8);
  return {
    x: Math.min(Math.max(8, p.x), maxX),
    y: Math.min(Math.max(8, p.y), maxY),
  };
}

export function LiveChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { conversation, messages, sendMessage } = useLiveChat();

  // Draggable position (bottom-right default)
  const BTN_SIZE = 56;
  const PANEL_W = 360;
  const PANEL_H = 520;
  const [pos, setPos] = useState<Pos>(() => {
    try {
      const saved = localStorage.getItem(POS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: window.innerWidth - BTN_SIZE - 20, y: window.innerHeight - BTN_SIZE - 20 };
  });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

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

  // Reclamp on resize
  useEffect(() => {
    const onResize = () => {
      const size = open ? { w: PANEL_W, h: PANEL_H } : { w: BTN_SIZE, h: BTN_SIZE };
      setPos((p) => clampPos(p, size.w, size.h));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    const size = open ? { w: PANEL_W, h: PANEL_H } : { w: BTN_SIZE, h: BTN_SIZE };
    setPos(clampPos({ x: d.origX + dx, y: d.origY + dy }, size.w, size.h));
  };

  const handlePointerUp = (e: React.PointerEvent, onClick?: () => void) => {
    const target = e.currentTarget as HTMLElement;
    try { target.releasePointerCapture(e.pointerId); } catch {}
    const d = dragRef.current;
    dragRef.current = null;
    if (d) {
      try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch {}
      if (!d.moved && onClick) onClick();
    }
  };

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
      {/* Floating draggable button */}
      {!open && (
        <button
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(e) => handlePointerUp(e, () => setOpen(true))}
          style={{ left: pos.x, top: pos.y, touchAction: "none" }}
          className="fixed z-[100] h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform flex items-center justify-center cursor-grab active:cursor-grabbing"
          aria-label="Buka live chat (geser untuk pindah)"
          title="Geser untuk pindahkan"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel — draggable by header */}
      {open && (
        <div
          style={{ left: pos.x, top: pos.y }}
          className="fixed z-[100] w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-2rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => handlePointerUp(e)}
            style={{ touchAction: "none" }}
            className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground cursor-grab active:cursor-grabbing select-none"
          >
            <div>
              <p className="font-semibold text-sm">Live Chat AJMS</p>
              <p className="text-xs opacity-90">{statusLabel(conversation?.status)}</p>
            </div>
            <div className="flex gap-1">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-white/10 rounded"
                aria-label="Minimize"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-white/10 rounded"
                aria-label="Tutup"
              >
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
              const suggestionLines = isSystem
                ? Array.from(m.content.matchAll(/^\s*\d+\.\s+(.+)$/gm)).map((mt) => mt[1].trim())
                : [];
              const hasSuggestions = suggestionLines.length > 0 && /diteruskan ke admin|yang Anda maksud/i.test(m.content);
              const mainText = hasSuggestions
                ? m.content.split(/\n\n/)[0]
                : m.content;
              return (
                <div key={m.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
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
                    <p className="whitespace-pre-wrap break-words">{mainText}</p>
                    {hasSuggestions && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {suggestionLines.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage.mutate(s)}
                            disabled={sendMessage.isPending}
                            className="text-left text-xs px-2 py-1.5 rounded-lg bg-background hover:bg-muted border border-border transition-colors disabled:opacity-60"
                          >
                            💬 {s}
                          </button>
                        ))}
                      </div>
                    )}
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
