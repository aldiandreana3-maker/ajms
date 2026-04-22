import { useRef, useState, useEffect } from "react";
import { Calendar, ArrowRight } from "lucide-react";
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

const cardColors = [
  "from-primary/20 to-info/20",
  "from-warning/20 to-primary/20",
  "from-success/20 to-info/20",
  "from-info/20 to-warning/20",
];

export function NewsSlider({ news }: NewsSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<NewsDetailItem | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardWidth = el.firstElementChild?.clientWidth || 280;
      setActiveIndex(Math.round(scrollLeft / (cardWidth + 16)));
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const openDetail = (item: NewsItem) => {
    if (!item.content) return; // skip placeholder
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-foreground">Berita Terbaru</h2>
        <button className="text-sm font-semibold text-accent hover:underline flex items-center gap-1">
          Lihat Semua <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {news.map((item, index) => (
          <article
            key={item.id}
            onClick={() => openDetail(item)}
            className={cn(
              "flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[360px] rounded-2xl p-5 bg-gradient-to-br border border-border shadow-card cursor-pointer snap-start transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
              cardColors[index % cardColors.length]
            )}
          >
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary/20 text-primary rounded-full mb-3">
              {item.category}
            </span>
            <h3 className="font-bold text-foreground text-base leading-snug line-clamp-2 mb-2">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {item.excerpt}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{item.date}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Dot indicators */}
      {news.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {news.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                i === activeIndex ? "bg-foreground w-5" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
