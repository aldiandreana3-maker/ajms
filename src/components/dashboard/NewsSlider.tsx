import { useState } from "react";
import { Calendar, ArrowRight, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsDetailDialog, type NewsDetailItem } from "./NewsDetailDialog";

interface NewsItem {
  id: string | number;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  content?: string;
  image_url?: string | null;
  published_at?: string | null;
  scheduled_at?: string | null;
}

interface NewsSliderProps {
  news: NewsItem[];
}

export function NewsSlider({ news }: NewsSliderProps) {
  const [selected, setSelected] = useState<NewsDetailItem | null>(null);
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);

  const openDetail = (item: NewsItem) => {
    if (!item.content) return;
    setSelected({
      id: item.id,
      title: item.title,
      content: item.content,
      image_url: item.image_url,
      date: item.date,
      category: item.category,
      published_at: item.published_at,
      scheduled_at: item.scheduled_at,
    });
    setOpen(true);
  };

  const shouldAnimate = news.length > 1 && !open && !paused;
  // 3 detik per kartu agar semua berita bergantian maju ke kiri
  const durationSeconds = Math.max(news.length * 3, 6);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-foreground">Berita Terbaru</h2>
        <button className="text-sm font-semibold text-accent hover:underline flex items-center gap-1">
          Lihat Semua <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div
        className="overflow-hidden pb-2"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <div
          className={cn(
            "flex gap-4 w-max",
            shouldAnimate && "news-marquee",
            paused && "is-paused"
          )}
          style={
            {
              "--marquee-duration": `${durationSeconds}s`,
            } as React.CSSProperties
          }
        >
          {/* Duplikat konten untuk loop seamless */}
          {[...news, ...news].map((item, idx) => (
            <article
              key={`${item.id}-${idx}`}
              onClick={() => openDetail(item)}
              className="flex-shrink-0 w-[320px] sm:w-[380px] lg:w-[440px] rounded-2xl overflow-hidden bg-card border border-border shadow-card cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Banner image — BCA-style 16:9 */}
              <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-primary/20 to-info/20 overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary/40">
                    <Newspaper className="w-12 h-12" />
                  </div>
                )}
                <span className="absolute top-3 left-3 inline-block px-3 py-1 text-xs font-semibold bg-background/90 backdrop-blur text-primary rounded-full shadow-sm">
                  {item.category}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-foreground text-base leading-snug line-clamp-2 mb-1.5">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {item.excerpt}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <NewsDetailDialog news={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
