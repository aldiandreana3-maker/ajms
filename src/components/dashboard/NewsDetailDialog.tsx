import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Share2 } from "lucide-react";
import { toast } from "sonner";

export interface NewsDetailItem {
  id: string | number;
  title: string;
  content: string;
  image_url?: string | null;
  date: string;
  category: string;
  published_at?: string | null;
  scheduled_at?: string | null;
}

interface NewsDetailDialogProps {
  news: NewsDetailItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewsDetailDialog({ news, open, onOpenChange }: NewsDetailDialogProps) {
  if (!news) return null;

  const handleShare = async () => {
    const shareData = {
      title: news.title,
      text: news.content.substring(0, 120),
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${news.title}\n\n${news.content}\n\n${window.location.href}`);
        toast.success("Berita disalin ke clipboard");
      }
    } catch {
      // user cancelled
    }
  };

  // Build period label like "Berlaku dari ... – ..."
  const periodLabel = (() => {
    if (!news.published_at) return news.date;
    const start = new Date(news.published_at).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    if (news.scheduled_at) {
      const end = new Date(news.scheduled_at).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      return `Berlaku dari ${start} – ${end}`;
    }
    return start;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl w-[95vw] sm:w-full max-h-[92vh] p-0 overflow-hidden gap-0 [&>button]:hidden"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 bg-background/95 backdrop-blur border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Badge variant="secondary" className="font-medium">
            {news.category}
          </Badge>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-4 sm:px-8 py-6 space-y-5">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {news.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{periodLabel}</span>
            </div>
          </div>

          {news.image_url && (
            <div className="rounded-2xl overflow-hidden border border-border bg-muted">
              <img
                src={news.image_url}
                alt={news.title}
                className="w-full h-auto max-h-[420px] object-cover"
                loading="lazy"
              />
            </div>
          )}

          <div className="prose prose-sm sm:prose-base max-w-none text-foreground">
            {news.content.split(/\n+/).map((paragraph, idx) => (
              <p key={idx} className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 px-4 sm:px-6 py-3 bg-background/95 backdrop-blur border-t border-border">
          <Button
            variant="outline"
            className="w-full rounded-full h-12"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Bagikan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
