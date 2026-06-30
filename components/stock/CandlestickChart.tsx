"use client";

import { useEffect, useRef, useState } from "react";
import type { Candle } from "@/lib/mockChart";
import { formatPrice } from "@/lib/format";

const UP = "#c8a45d";
const DOWN = "#cb7e68";
const HEIGHT = 360;
const PAD = { top: 16, right: 56, bottom: 28, left: 8 };

export default function CandlestickChart({
  data,
  currency,
}: {
  data: Candle[];
  currency: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const innerW = Math.max(width - PAD.left - PAD.right, 10);
  const innerH = HEIGHT - PAD.top - PAD.bottom;

  const highs = data.map((d) => d.high);
  const lows = data.map((d) => d.low);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const range = max - min || 1;
  const padY = range * 0.08;
  const yMax = max + padY;
  const yMin = min - padY;

  const x = (i: number) => PAD.left + (i + 0.5) * (innerW / data.length);
  const y = (price: number) =>
    PAD.top + innerH - ((price - yMin) / (yMax - yMin)) * innerH;

  const slot = innerW / data.length;
  const candleW = Math.max(Math.min(slot * 0.62, 14), 1.5);

  const gridLines = 5;
  const priceTicks = Array.from({ length: gridLines + 1 }, (_, i) => {
    const price = yMin + ((yMax - yMin) * i) / gridLines;
    return { price, yPos: y(price) };
  });

  // X-axis labels: show ~6 evenly spaced.
  const labelStep = Math.max(Math.floor(data.length / 6), 1);

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const idx = Math.round((relX - PAD.left) / slot - 0.5);
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  }

  const hovered = hover !== null ? data[hover] : null;

  return (
    <div ref={ref} className="relative w-full select-none">
      <svg
        width={width}
        height={HEIGHT}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        className="block"
      >
        {/* Horizontal gridlines + price labels */}
        {priceTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={PAD.left + innerW}
              y1={t.yPos}
              y2={t.yPos}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
            <text
              x={PAD.left + innerW + 8}
              y={t.yPos + 3}
              fill="rgba(255,255,255,0.4)"
              fontSize={10}
              fontFamily="ui-monospace, monospace"
            >
              {formatPrice(t.price, currency)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) =>
          i % labelStep === 0 ? (
            <text
              key={i}
              x={x(i)}
              y={HEIGHT - 8}
              fill="rgba(255,255,255,0.4)"
              fontSize={10}
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
            >
              {d.label}
            </text>
          ) : null
        )}

        {/* Candles */}
        {data.map((d, i) => {
          const up = d.close >= d.open;
          const color = up ? UP : DOWN;
          const cx = x(i);
          const bodyTop = y(Math.max(d.open, d.close));
          const bodyBottom = y(Math.min(d.open, d.close));
          const bodyH = Math.max(bodyBottom - bodyTop, 1);
          return (
            <g key={i} opacity={hover === null || hover === i ? 1 : 0.55}>
              {/* Wick */}
              <line
                x1={cx}
                x2={cx}
                y1={y(d.high)}
                y2={y(d.low)}
                stroke={color}
                strokeWidth={1}
              />
              {/* Body */}
              <rect
                x={cx - candleW / 2}
                y={bodyTop}
                width={candleW}
                height={bodyH}
                fill={color}
                rx={1}
              />
            </g>
          );
        })}

        {/* Crosshair */}
        {hovered && hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD.top}
            y2={PAD.top + innerH}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
      </svg>

      {/* Tooltip */}
      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-lg border border-[#ece6d9]/[0.08] bg-black/80 px-3 py-2 text-xs backdrop-blur-xl"
          style={{
            left: Math.min(Math.max(x(hover) - 70, 0), width - 150),
          }}
        >
          <p className="mb-1 font-medium text-zinc-300">{hovered.fullLabel}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-[11px]">
            <span className="text-zinc-500">O</span>
            <span className="text-right text-zinc-200">{formatPrice(hovered.open, currency)}</span>
            <span className="text-zinc-500">H</span>
            <span className="text-right text-zinc-200">{formatPrice(hovered.high, currency)}</span>
            <span className="text-zinc-500">L</span>
            <span className="text-right text-zinc-200">{formatPrice(hovered.low, currency)}</span>
            <span className="text-zinc-500">C</span>
            <span
              className="text-right font-medium"
              style={{ color: hovered.close >= hovered.open ? UP : DOWN }}
            >
              {formatPrice(hovered.close, currency)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
