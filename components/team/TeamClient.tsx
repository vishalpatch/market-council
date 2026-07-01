"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/Spinner";

interface Member {
  userId: string;
  role: string;
  email: string;
  name: string | null;
  joinedAt: string;
}
interface Overview {
  hasTeam: boolean;
  isTeamPlan?: boolean;
  team?: { id: string; name: string; seat_count: number };
  myRole?: string;
  members?: Member[];
}
interface Message {
  id: string;
  user_id: string;
  content: string;
  pinned: boolean;
  created_at: string;
}
interface Activity {
  userId: string;
  role: string;
  email: string;
  name: string | null;
  recentAnalyses: { thesis: string; verdict: string; date: string }[];
  watchlistCount: number;
  trackedTheses: number;
}

export default function TeamClient() {
  const [ov, setOv] = useState<Overview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [announce, setAnnounce] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [activity, setActivity] = useState<Activity[] | null>(null);
  const supabase = useRef(createClient()).current;

  const isManager = ov?.myRole === "owner" || ov?.myRole === "manager";
  const teamId = ov?.team?.id;

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/team/overview");
      if (res.ok) setOv((await res.json()) as Overview);
    })();
  }, []);

  const loadMessages = useCallback(async () => {
    if (!teamId) return;
    const { data } = await supabase
      .from("team_messages")
      .select("id, user_id, content, pinned, created_at")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) ?? []);
  }, [teamId, supabase]);

  useEffect(() => {
    if (!teamId) return;
    loadMessages();
    const id = setInterval(loadMessages, 30000); // poll every 30s
    return () => clearInterval(id);
  }, [teamId, loadMessages]);

  useEffect(() => {
    if (isManager && teamId) {
      (async () => {
        const res = await fetch(`/api/team/activity?teamId=${teamId}`);
        if (res.ok) setActivity((await res.json()).activity as Activity[]);
      })();
    }
  }, [isManager, teamId]);

  async function send() {
    if (!input.trim() || !teamId) return;
    const content = input.trim();
    setInput("");
    await fetch("/api/team/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, content, pinned: announce }),
    });
    setAnnounce(false);
    loadMessages();
  }

  async function invite() {
    if (!inviteEmail.trim() || !teamId) return;
    setInviteMsg("");
    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, email: inviteEmail.trim() }),
    });
    const json = await res.json();
    setInviteMsg(res.ok ? (json.added ? "Added to the team." : "Invite sent.") : json.error);
    if (res.ok) {
      setInviteEmail("");
      const ovRes = await fetch("/api/team/overview");
      if (ovRes.ok) setOv((await ovRes.json()) as Overview);
    }
  }

  if (!ov) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!ov.hasTeam) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--edge-2)] bg-[var(--surface)] p-12 text-center">
        <h2 className="mb-3 font-serif text-2xl font-light">Team workspace</h2>
        <p className="mx-auto mb-8 max-w-md text-pretty leading-relaxed text-muted">
          Collaboration, shared chat, and manager oversight are part of the Team plan.
        </p>
        <Link href="/pricing" className="inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink hover:bg-gold-soft">
          View the Team plan
        </Link>
      </div>
    );
  }

  const nameFor = (uid: string) => {
    const m = ov.members?.find((x) => x.userId === uid);
    return m?.name || m?.email || "Member";
  };
  const pinned = messages.filter((m) => m.pinned);
  const normal = messages.filter((m) => !m.pinned);

  return (
    <div className="space-y-14">
      {/* Overview */}
      <section>
        <div className="mb-6 flex items-baseline justify-between border-b border-hairline pb-4">
          <h2 className="font-serif text-2xl font-light tracking-editorial">{ov.team?.name}</h2>
          <span className="text-xs uppercase tracking-[0.15em] text-faint">
            {ov.members?.length}/{ov.team?.seat_count} seats
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {ov.members?.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 font-serif text-sm text-gold">
                {(m.name || m.email).charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-paper">{m.name || m.email}</p>
                <p className="truncate text-xs text-faint">{m.email}</p>
              </div>
              <span className="rounded-full border border-hairline px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                {m.role}
              </span>
            </div>
          ))}
        </div>

        {isManager && (
          <div className="mt-5 flex flex-wrap gap-2">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="invite@email.com"
              className="min-w-0 flex-1 rounded-xl border border-[var(--edge)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-paper placeholder-faint focus:border-gold/50 focus:outline-none"
            />
            <button onClick={invite} className="rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-soft">
              Invite
            </button>
            {inviteMsg && <span className="w-full text-xs text-muted">{inviteMsg}</span>}
          </div>
        )}
      </section>

      {/* Chat */}
      <section>
        <h2 className="mb-6 border-b border-hairline pb-4 font-serif text-2xl font-light tracking-editorial">
          Team chat
        </h2>

        {pinned.length > 0 && (
          <div className="mb-4 space-y-2">
            {pinned.map((m) => (
              <div key={m.id} className="rounded-2xl border border-gold/30 bg-gold/[0.06] p-4">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gold">
                  📌 Announcement · {nameFor(m.user_id)}
                </p>
                <p className="text-sm text-paper">{m.content}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4 max-h-[420px] space-y-3 overflow-y-auto">
          {normal.length === 0 ? (
            <p className="text-sm text-faint">No messages yet. Say hello.</p>
          ) : (
            normal.map((m) => (
              <div key={m.id} className="rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-4">
                <div className="mb-1 flex items-center gap-2 text-xs text-faint">
                  <span className="font-medium text-muted">{nameFor(m.user_id)}</span>
                  <span>·</span>
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-paper">{m.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            placeholder="Message your team…"
            className="w-full resize-none rounded-xl border border-[var(--edge)] bg-[var(--surface)] px-4 py-3 text-sm text-paper placeholder-faint focus:border-gold/50 focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <button onClick={send} className="rounded-xl bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-soft">
              Send
            </button>
            {isManager && (
              <label className="flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} />
                Post as pinned announcement
              </label>
            )}
          </div>
        </div>
      </section>

      {/* Manager view */}
      {isManager && activity && (
        <section>
          <h2 className="mb-6 border-b border-hairline pb-4 font-serif text-2xl font-light tracking-editorial">
            Member activity
          </h2>
          <div className="space-y-4">
            {activity.map((a) => (
              <div key={a.userId} className="rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-5">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-paper">{a.name || a.email}</span>
                  <span className="rounded-full border border-hairline px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                    {a.role}
                  </span>
                  <span className="ml-auto text-xs text-faint">
                    {a.watchlistCount} watched · {a.trackedTheses} tracked
                  </span>
                </div>
                {a.recentAnalyses.length === 0 ? (
                  <p className="text-xs text-faint">No recent analyses.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {a.recentAnalyses.map((r, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-gold">{r.verdict}</span>
                        <span className="min-w-0 flex-1 truncate text-muted">{r.thesis}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
