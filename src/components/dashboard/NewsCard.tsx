import { Calendar, ArrowRight } from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  category: string;
}

interface NewsCardProps {
  news: NewsItem[];
}

export function NewsCard({ news }: NewsCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-6 animate-slide-up" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-foreground">Berita Terbaru</h2>
        <button className="text-sm font-medium text-accent hover:underline flex items-center gap-1">
          Lihat Semua <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-4">
        {news.map((item, index) => (
          <article
            key={item.id}
            className="group p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/5 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 mt-2 rounded-full bg-accent flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full mb-2">
                  {item.category}
                </span>
                <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {item.excerpt}
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{item.date}</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
