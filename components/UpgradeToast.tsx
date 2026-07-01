"use client";

import { useEffect, useState } from "react";

export default function UpgradeToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      setShow(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("upgraded");
      window.history.replaceState({}, "", url.toString());
      const t = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!show) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-gold/40 bg-ink-raised px-5 py-3 text-sm text-paper shadow-2xl">
      <span className="mr-2 text-gold">✓</span>You&apos;re upgraded — welcome aboard.
    </div>
  );
}
