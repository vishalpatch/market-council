"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/lib/format";

const GOLD = "#c8a45d";
const UP = "#7ba890";
const DOWN = "#cb7e68";
const MUTED = "#9b9486";
const FAINT = "#6c665b";
const GRID = "rgba(236,230,217,0.07)";

const num = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
};
const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

const inputCls =
  "w-full rounded-xl border border-[#ece6d9]/[0.08] bg-[#ece6d9]/[0.02] px-4 py-2.5 text-sm text-paper placeholder-faint transition-colors focus:border-gold/50 focus:outline-none";
const labelCls = "mb-1.5 block text-xs uppercase tracking-[0.15em] text-faint";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function SectionHeading({ title, note }: { title: string; note: string }) {
  return (
    <div className="mb-8 flex items-baseline justify-between border-b border-hairline pb-4">
      <h2 className="font-serif text-2xl font-light tracking-editorial">{title}</h2>
      <p className="text-xs uppercase tracking-[0.15em] text-faint">{note}</p>
    </div>
  );
}

export default function RiskClient() {
  // ─── Position P&L ───────────────────────────────────────────────
  const [ticker, setTicker] = useState("");
  const [entry, setEntry] = useState("");
  const [shares, setShares] = useState("");
  const [date, setDate] = useState("");
  const [current, setCurrent] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceErr, setPriceErr] = useState("");

  async function fetchPrice(e: React.FormEvent) {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setLoadingPrice(true);
    setPriceErr("");
    setCurrent(null);
    try {
      const res = await fetch(`/api/stock/${t}`);
      const json = await res.json();
      if (!res.ok) {
        setPriceErr(json.error ?? "Could not fetch the current price.");
        return;
      }
      setCurrent(json.quote?.price ?? null);
    } catch {
      setPriceErr("Network error. Please try again.");
    } finally {
      setLoadingPrice(false);
    }
  }

  const entryN = num(entry);
  const sharesN = num(shares);
  const hasPos = current !== null && entryN > 0 && sharesN > 0;
  const thenValue = hasPos ? entryN * sharesN : NaN;
  const nowValue = hasPos ? (current as number) * sharesN : NaN;
  const gain = hasPos ? nowValue - thenValue : NaN;
  const gainPct = hasPos ? ((current as number) / entryN - 1) * 100 : NaN;
  const up = gain >= 0;
  const holdDays =
    date && hasPos
      ? Math.max(
          0,
          Math.round((Date.now() - new Date(date).getTime()) / 86400000)
        )
      : null;

  // ─── Position sizing ────────────────────────────────────────────
  const [account, setAccount] = useState("");
  const [riskPct, setRiskPct] = useState("1");
  const [sEntry, setSEntry] = useState("");
  const [sStop, setSStop] = useState("");
  const accountN = num(account);
  const riskPctN = num(riskPct);
  const sEntryN = num(sEntry);
  const sStopN = num(sStop);
  const riskAmount = accountN > 0 && riskPctN > 0 ? accountN * (riskPctN / 100) : NaN;
  const riskPerShare = sEntryN > 0 && sStopN > 0 ? sEntryN - sStopN : NaN;
  const sizingValid = riskAmount > 0 && riskPerShare > 0;
  const sizeShares = sizingValid ? Math.floor(riskAmount / riskPerShare) : NaN;
  const sizeValue = sizingValid ? sizeShares * sEntryN : NaN;
  const sizePctAccount =
    sizingValid && accountN > 0 ? (sizeValue / accountN) * 100 : NaN;
  const stopTooHigh = sEntryN > 0 && sStopN > 0 && sStopN >= sEntryN;

  // ─── Stress test ────────────────────────────────────────────────
  const stress = hasPos
    ? [10, 20, 30].map((p) => ({
        label: `−${p}%`,
        loss: (nowValue * p) / 100,
        remaining: nowValue * (1 - p / 100),
      }))
    : [];

  return (
    <div className="space-y-20">
      {/* Position P&L */}
      <section>
        <SectionHeading title="Position P&L" note="Then vs. now" />
        <form onSubmit={fetchPrice} className="mb-8 grid gap-4 sm:grid-cols-4">
          <Field label="Ticker">
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="AAPL"
              maxLength={10}
              className={`${inputCls} font-mono`}
            />
          </Field>
          <Field label="Entry price">
            <input
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              inputMode="decimal"
              placeholder="150.00"
              className={inputCls}
            />
          </Field>
          <Field label="Shares">
            <input
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              inputMode="decimal"
              placeholder="100"
              className={inputCls}
            />
          </Field>
          <Field label="Date bought">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={loadingPrice || !ticker.trim()}
              className="rounded-xl bg-gold px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loadingPrice ? "Fetching price…" : "Calculate"}
            </button>
          </div>
        </form>

        {priceErr && <p className="mb-4 text-sm text-[#cb7e68]">{priceErr}</p>}

        {hasPos ? (
          <>
            <div className="grid grid-cols-2 gap-px sm:grid-cols-4">
              <Stat label="Cost basis" value={formatPrice(thenValue)} />
              <Stat
                label="Current value"
                value={formatPrice(nowValue)}
                sub={`${ticker.toUpperCase()} @ ${formatPrice(current as number)}`}
              />
              <Stat
                label="Gain / loss"
                value={`${gain >= 0 ? "+" : "−"}${formatPrice(Math.abs(gain))}`}
                color={up ? UP : DOWN}
              />
              <Stat label="Return" value={pct(gainPct)} color={up ? UP : DOWN} />
            </div>
            <p className="mt-6 text-pretty leading-relaxed text-muted">
              {holdDays !== null ? (
                <>
                  Held for <span className="text-paper">{holdDays}</span> days: your{" "}
                  {formatPrice(thenValue)} position is now worth{" "}
                  <span style={{ color: up ? UP : DOWN }}>{formatPrice(nowValue)}</span>
                  {" — "}a {up ? "gain" : "loss"} of {formatPrice(Math.abs(gain))} (
                  {pct(gainPct)}).
                </>
              ) : (
                <>
                  Had you held, your {formatPrice(thenValue)} position would be worth{" "}
                  <span style={{ color: up ? UP : DOWN }}>{formatPrice(nowValue)}</span>{" "}
                  today.
                </>
              )}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">
            Enter a ticker, entry price, and share count, then Calculate to pull the
            live price and see your position&apos;s performance.
          </p>
        )}
      </section>

      {/* Position sizing */}
      <section>
        <SectionHeading title="Position Sizing" note="Risk per trade" />
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Account size">
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              inputMode="decimal"
              placeholder="25000"
              className={inputCls}
            />
          </Field>
          <Field label="Risk per trade %">
            <input
              value={riskPct}
              onChange={(e) => setRiskPct(e.target.value)}
              inputMode="decimal"
              placeholder="1"
              className={inputCls}
            />
          </Field>
          <Field label="Entry price">
            <input
              value={sEntry}
              onChange={(e) => setSEntry(e.target.value)}
              inputMode="decimal"
              placeholder="150.00"
              className={inputCls}
            />
          </Field>
          <Field label="Stop-loss price">
            <input
              value={sStop}
              onChange={(e) => setSStop(e.target.value)}
              inputMode="decimal"
              placeholder="140.00"
              className={inputCls}
            />
          </Field>
        </div>

        {stopTooHigh && (
          <p className="mt-4 text-sm text-[#cb7e68]">
            Stop-loss must be below the entry price for a long position.
          </p>
        )}

        {sizingValid && (
          <div className="mt-8 grid grid-cols-2 gap-px sm:grid-cols-4">
            <Stat label="Risk amount" value={formatPrice(riskAmount)} />
            <Stat label="Max shares" value={sizeShares.toLocaleString()} color={GOLD} />
            <Stat label="Position size" value={formatPrice(sizeValue)} />
            <Stat
              label="% of account"
              value={`${sizePctAccount.toFixed(1)}%`}
            />
          </div>
        )}
        {!sizingValid && !stopTooHigh && (
          <p className="mt-6 text-sm text-muted">
            Enter your account size, risk tolerance, and entry/stop prices to size the
            trade so a stop-out costs only your chosen risk amount.
          </p>
        )}
      </section>

      {/* Stress test */}
      <section>
        <SectionHeading title="Stress Test" note="Drawdown scenarios" />
        {hasPos ? (
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stress} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: MUTED, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: FAINT, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                    tickFormatter={(v: number) => formatPrice(v)}
                  />
                  <Tooltip cursor={{ fill: "rgba(236,230,217,0.04)" }} content={<StressTooltip />} />
                  <Bar dataKey="loss" fill={DOWN} radius={[4, 4, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="self-center">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left">
                    <th className="py-2 pr-4 text-xs font-medium uppercase tracking-[0.15em] text-faint">
                      Move
                    </th>
                    <th className="py-2 pr-4 text-xs font-medium uppercase tracking-[0.15em] text-faint">
                      Loss
                    </th>
                    <th className="py-2 text-xs font-medium uppercase tracking-[0.15em] text-faint">
                      Remaining
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stress.map((s) => (
                    <tr key={s.label} className="border-b border-hairline/60">
                      <td className="py-3 pr-4 font-mono text-paper">{s.label}</td>
                      <td className="py-3 pr-4 font-mono text-[#cb7e68]">
                        −{formatPrice(s.loss)}
                      </td>
                      <td className="py-3 font-mono text-muted">
                        {formatPrice(s.remaining)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Calculate a position above to stress-test it against −10%, −20%, and −30%
            moves.
          </p>
        )}
      </section>

      <p className="text-[11px] text-faint">
        For informational and educational purposes only — not financial advice.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="border-t border-hairline pt-5 sm:pr-6">
      <p className="text-xs uppercase tracking-[0.15em] text-faint">{label}</p>
      <p
        className="mt-2 font-serif text-3xl font-light"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
      {sub && <p className="mt-1 font-mono text-xs text-muted">{sub}</p>}
    </div>
  );
}

interface StressTooltipProps {
  active?: boolean;
  payload?: { payload: { label: string; loss: number; remaining: number } }[];
}

function StressTooltip({ active, payload }: StressTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#ece6d9]/[0.1] bg-black/80 px-3 py-2 text-xs backdrop-blur-xl">
      <p className="mb-0.5 text-zinc-400">{p.label} move</p>
      <p className="font-mono font-semibold text-[#cb7e68]">−{formatPrice(p.loss)}</p>
      <p className="font-mono text-zinc-400">{formatPrice(p.remaining)} left</p>
    </div>
  );
}
