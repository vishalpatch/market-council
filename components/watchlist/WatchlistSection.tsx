"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";

interface WatchlistItem {
  id: string;
  ticker: string;
  added_at: string;
}

interface TickerData {
  name: string;
  price: number;
  changePercent: number;
}

export default function WatchlistSection({ userId }: { userId: string }) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [tickerData, setTickerData] = useState<Record<string, TickerData | null>>({});
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const fetchedRef = useRef<Set<string>>(new Set());
  const supabase = createClient();

  const loadWatchlist = useCallback(async () => {
    const { data } = await supabase
      .from("watchlist_items")
      .select("id, ticker, added_at")
      .order("added_at", { ascending: false });
    setItems((data as WatchlistItem[]) ?? []);
  }, [supabase]);

  useEffect(() => { loadWatchlist(); }, [loadWatchlist]);

  // fetch prices for new tickers only
  useEffect(() => {
    const toFetch = items.filter((i) => !fetchedRef.current.has(i.ticker));
    if (toFetch.length === 0) return;
    toFetch.forEach((i) => fetchedRef.current.add(i.ticker));

    Promise.all(
      toFetch.map(async (i) => {
        try {
          const res = await fetch(`/api/stock/${i.ticker}`);
          if (!res.ok) return [i.ticker, null] as const;
          const json = await res.json();
          return [
            i.ticker,
            {
              name: json.profile?.name ?? i.ticker,
              price: json.quote?.price ?? 0,
              changePercent: json.quote?.percentChange ?? 0,
            },
          ] as const;
        } catch {
          return [i.ticker, null] as const;
        }
      })
    ).then((results) => {
      setTickerData((prev) => {
        const next = { ...prev };
        for (const [ticker, data] of results) next[ticker] = data;
        return next;
      });
    });
  }, [items]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const ticker = input.trim().toUpperCase();
    if (!ticker) return;
    setAdding(true);
    setAddError("");
    const { error } = await supabase
      .from("watchlist_items")
      .insert({ user_id: userId, ticker });
    setAdding(false);
    if (error) {
      setAddError(
        error.code === "23505"
          ? `${ticker} is already in your watchlist.`
          : error.message
      );
      return;
    }
    setInput("");
    loadWatchlist();
  }

  async function handleRemove(id: string, ticker: string) {
    await supabase.from("watchlist_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    fetchedRef.current.delete(ticker);
    setTickerData((prev) => {
      const next = { ...prev };
      delete next[ticker];
      return next;
    });
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="Add ticker (e.g. AAPL)"
          maxLength={10}
          className="flex-1 rounded-xl border border-[#ece6d9]/[0.08] bg-[#ece6d9]/[0.02] px-4 py-2.5 text-sm text-zinc-50 placeholder-zinc-600 focus:border-[#ece6d9]/[0.2] focus:outline-none"
        />
        <button
          type="submit"
          disabled={adding || !input.trim()}
          className="rounded-xl bg-[#ece6d9]/[0.06] px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-[#ece6d9]/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {adding ? "Adding…" : "Add"}
        </button>
      </form>

      {addError && <p className="mb-3 text-xs text-[#cb7e68]">{addError}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-zinc-600">
          No tickers yet. Add one above to start tracking.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const data = tickerData[item.ticker];
            const isLoading = data === undefined;
            const isUp = data && data.changePercent >= 0;
            const changeColor = isUp ? "#c8a45d" : "#cb7e68";

            return (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-[#ece6d9]/[0.08] bg-[#ece6d9]/[0.02] p-4 backdrop-blur-xl transition-colors hover:border-[#ece6d9]/[0.16]"
              >
                <button
                  onClick={() => handleRemove(item.id, item.ticker)}
                  className="absolute right-3 top-3 text-zinc-600 opacity-0 transition-opacity hover:text-[#cb7e68] group-hover:opacity-100"
                  aria-label="Remove"
                >
                  ✕
                </button>

                <span className="mb-1 block font-mono text-sm font-bold text-zinc-50">
                  {item.ticker}
                </span>

                {isLoading ? (
                  <div className="space-y-1.5">
                    <div className="h-3 w-28 animate-pulse rounded bg-[#ece6d9]/[0.06]" />
                    <div className="h-5 w-16 animate-pulse rounded bg-[#ece6d9]/[0.06]" />
                  </div>
                ) : data ? (
                  <>
                    <p className="mb-2 truncate text-xs text-zinc-500">{data.name}</p>
                    <div className="flex items-end justify-between">
                      <span className="font-mono text-lg font-semibold text-zinc-50">
                        {formatPrice(data.price)}
                      </span>
                      <span
                        className="font-mono text-xs font-semibold"
                        style={{ color: changeColor }}
                      >
                        {isUp ? "+" : ""}
                        {data.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-zinc-600">Data unavailable</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
