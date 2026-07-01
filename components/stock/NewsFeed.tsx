"use client";

import { formatRelativeDate } from "@/lib/format";

export interface NewsItem {
  headline: string;
  summary: string;
  url: string;
  datetime: number;
  source: string;
  image: string;
}

export default function NewsFeed({ news }: { news: NewsItem[] }) {
  if (!news.length) {
    return (
      <div className="rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-8 text-center text-sm text-muted backdrop-blur-xl">
        No recent news for this ticker.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {news.map((item, i) => (
        <a
          key={i}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex gap-4 rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c8a45d]/40 hover:bg-[var(--surface-2)]"
        >
          {item.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt=""
              className="hidden h-20 w-28 shrink-0 rounded-lg object-cover sm:block"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2 text-xs text-muted">
              <span className="font-medium text-[#c8a45d]">{item.source}</span>
              <span>·</span>
              <span>{formatRelativeDate(item.datetime)}</span>
            </div>
            <h4 className="font-medium leading-snug text-paper transition-colors group-hover:text-[#c8a45d]">
              {item.headline}
            </h4>
            {item.summary && (
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                {item.summary}
              </p>
            )}
          </div>

          <svg
            className="mt-1 hidden shrink-0 text-faint transition-colors group-hover:text-[#c8a45d] sm:block"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M5 11L11 5M11 5H6M11 5V10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      ))}
    </div>
  );
}
