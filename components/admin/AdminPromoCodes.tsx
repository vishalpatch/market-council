"use client";

import { useEffect, useState } from "react";
import { DISCOUNT_TYPE_OPTIONS } from "@/lib/promo";
import { PLANS } from "@/lib/plans";

interface Code {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  applies_to_plans: string[];
  max_uses: number | null;
  uses_so_far: number;
  expires_at: string | null;
  active: boolean;
}

const PAID = PLANS.filter((p) => p.id !== "free");

export default function AdminPromoCodes() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState(DISCOUNT_TYPE_OPTIONS[0].value);
  const [value, setValue] = useState("");
  const [plans, setPlans] = useState<string[]>([]);
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    const res = await fetch("/api/admin/promo");
    if (res.ok) setCodes((await res.json()).codes as Code[]);
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/admin/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        discountType: type,
        discountValue: Number(value) || 0,
        appliesToPlans: plans,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt || null,
      }),
    });
    if (!res.ok) {
      setErr((await res.json()).error ?? "Could not create code.");
      return;
    }
    setCode("");
    setValue("");
    setPlans([]);
    setMaxUses("");
    setExpiresAt("");
    load();
  }

  async function toggle(c: Code) {
    await fetch("/api/admin/promo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    });
    load();
  }

  async function remove(c: Code) {
    await fetch("/api/admin/promo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id }),
    });
    load();
  }

  const inputCls =
    "rounded-xl border border-[var(--edge)] bg-[var(--surface-2)] px-3 py-2 text-sm text-paper placeholder-faint focus:border-gold/50 focus:outline-none";

  return (
    <section>
      <div className="mb-6 flex items-baseline justify-between border-b border-hairline pb-4">
        <h2 className="font-serif text-3xl font-light tracking-editorial">Promo Codes</h2>
        <span className="font-mono text-sm text-faint">{codes.length}</span>
      </div>

      {/* Create */}
      <form onSubmit={create} className="mb-8 grid gap-3 rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-5 sm:grid-cols-2">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE" className={`${inputCls} font-mono`} />
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={`${inputCls} bg-ink-raised`}>
          {DISCOUNT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="numeric" placeholder="Value (% or days)" className={inputCls} />
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="text-faint">Plans:</span>
          {PAID.map((p) => (
            <label key={p.id} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={plans.includes(p.id)}
                onChange={(e) =>
                  setPlans((prev) => (e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id)))
                }
              />
              {p.name}
            </label>
          ))}
        </div>
        <input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} inputMode="numeric" placeholder="Max uses (optional)" className={inputCls} />
        <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputCls} />
        <div className="sm:col-span-2">
          <button type="submit" className="rounded-xl bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-soft">
            Create code
          </button>
          {err && <span className="ml-3 text-xs text-down">{err}</span>}
        </div>
      </form>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left">
              {["Code", "Type", "Value", "Uses", "Expires", "Active", ""].map((h) => (
                <th key={h} className="py-3 pr-4 text-xs font-medium uppercase tracking-[0.15em] text-faint">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-faint">No codes yet.</td>
              </tr>
            ) : (
              codes.map((c) => (
                <tr key={c.id} className="border-b border-hairline/60">
                  <td className="py-3 pr-4 font-mono text-paper">{c.code}</td>
                  <td className="py-3 pr-4 text-muted">{c.discount_type}</td>
                  <td className="py-3 pr-4 font-mono text-muted">{c.discount_value}</td>
                  <td className="py-3 pr-4 font-mono text-muted">
                    {c.uses_so_far}
                    {c.max_uses != null ? `/${c.max_uses}` : ""}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-faint">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => toggle(c)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        c.active ? "bg-[#7ba890]/15 text-[#7ba890]" : "bg-[var(--surface-3)] text-faint"
                      }`}
                    >
                      {c.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="py-3">
                    <button onClick={() => remove(c)} className="text-faint hover:text-[#cb7e68]">✕</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
