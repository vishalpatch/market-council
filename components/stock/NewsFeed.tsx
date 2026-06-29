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
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center text-sm text-zinc-500 backdrop-blur-xl">
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
          className="group flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00dc82]/40 hover:bg-white/[0.04]"
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
            <div className="mb-1.5 flex items-center gap-2 text-xs text-zinc-500">
              <span className="font-medium text-[#00dc82]">{item.source}</span>
              <span>·</span>
              <span>{formatRelativeDate(item.datetime)}</span>
            </div>
            <h4 className="font-medium leading-snug text-zinc-100 transition-colors group-hover:text-[#00dc82]">
              {item.headline}
            </h4>
            {item.summary && (
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-400">
                {item.summary}
              </p>
            )}
          </div>

          <svg
            className="mt-1 hidden shrink-0 text-zinc-600 transition-colors group-hover:text-[#00dc82] sm:block"
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
