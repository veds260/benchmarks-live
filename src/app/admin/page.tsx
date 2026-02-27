"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SESSION_KEY = "bml_admin_secret";

interface User {
  id: number;
  email: string;
  created_at: string;
}

interface AnalyticsEvent {
  id: number;
  visitor_id: string;
  email: string | null;
  event_type: string;
  event_data: Record<string, unknown>;
  path: string | null;
  created_at: string;
}

interface AggregateData {
  top_searches: { query: string; count: number }[];
  top_models_viewed: { slug: string; count: number }[];
  event_counts: { event_type: string; count: number }[];
  daily_signups: { date: string; count: number }[];
}

function getSecret(): string {
  try {
    return sessionStorage.getItem(SESSION_KEY) || "";
  } catch {
    return "";
  }
}

function setSecret(s: string) {
  try {
    sessionStorage.setItem(SESSION_KEY, s);
  } catch {
    // ignore
  }
}

async function adminFetch(url: string) {
  const secret = getSecret();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error("failed");
  return res.json();
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [secret, setSecretVal] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!secret.trim()) return;
    setSecret(secret.trim());
    setLoading(true);
    setError("");
    try {
      await adminFetch("/api/admin/users?format=json");
      onLogin();
    } catch {
      setError("Invalid secret");
      setSecret("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="bg-bg-card border border-border rounded-xl p-8 max-w-sm w-full mx-4">
        <h1 className="text-lg font-bold text-text-primary mb-4 text-center">
          Admin Login
        </h1>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecretVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Enter CRON_SECRET"
          className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors mb-3"
        />
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-accent text-bg-primary font-semibold text-sm rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Checking..." : "Login"}
        </button>
      </div>
    </div>
  );
}

function UsersTable({ users }: { users: User[] }) {
  return (
    <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">
          Users ({users.length})
        </h2>
        <a
          href={`/api/admin/users`}
          onClick={(e) => {
            e.preventDefault();
            const secret = getSecret();
            // Download CSV via fetch
            fetch("/api/admin/users", {
              headers: { Authorization: `Bearer ${secret}` },
            })
              .then((r) => r.blob())
              .then((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "users.csv";
                a.click();
                URL.revokeObjectURL(url);
              });
          }}
          className="text-xs text-accent hover:text-accent/80 transition-colors"
        >
          Export CSV
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-left">
              <th className="px-4 py-2 text-text-muted font-medium">ID</th>
              <th className="px-4 py-2 text-text-muted font-medium">Email</th>
              <th className="px-4 py-2 text-text-muted font-medium">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border/30 hover:bg-bg-tertiary transition-colors">
                <td className="px-4 py-2 font-mono-nums text-text-muted">{u.id}</td>
                <td className="px-4 py-2 text-text-primary">{u.email}</td>
                <td className="px-4 py-2 text-text-secondary text-xs">{u.created_at}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-text-muted">
                  No users yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AggregatePanel({ data }: { data: AggregateData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Event counts */}
      <div className="bg-bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Event Breakdown</h3>
        <div className="space-y-1.5">
          {data.event_counts.map((e) => (
            <div key={e.event_type} className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">{e.event_type}</span>
              <span className="font-mono-nums text-xs text-text-primary">{e.count}</span>
            </div>
          ))}
          {data.event_counts.length === 0 && (
            <p className="text-xs text-text-muted">No events yet</p>
          )}
        </div>
      </div>

      {/* Daily signups */}
      <div className="bg-bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Daily Signups</h3>
        <div className="space-y-1.5">
          {data.daily_signups.map((d) => (
            <div key={d.date} className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">{d.date}</span>
              <span className="font-mono-nums text-xs text-text-primary">{d.count}</span>
            </div>
          ))}
          {data.daily_signups.length === 0 && (
            <p className="text-xs text-text-muted">No signups yet</p>
          )}
        </div>
      </div>

      {/* Top searches */}
      <div className="bg-bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Top Searches</h3>
        <div className="space-y-1.5">
          {data.top_searches.slice(0, 15).map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs text-text-secondary truncate mr-2">{s.query}</span>
              <span className="font-mono-nums text-xs text-text-primary shrink-0">{s.count}</span>
            </div>
          ))}
          {data.top_searches.length === 0 && (
            <p className="text-xs text-text-muted">No searches yet</p>
          )}
        </div>
      </div>

      {/* Top models viewed */}
      <div className="bg-bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Top Models Viewed</h3>
        <div className="space-y-1.5">
          {data.top_models_viewed.slice(0, 15).map((m, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs text-text-secondary truncate mr-2">{m.slug}</span>
              <span className="font-mono-nums text-xs text-text-primary shrink-0">{m.count}</span>
            </div>
          ))}
          {data.top_models_viewed.length === 0 && (
            <p className="text-xs text-text-muted">No model views yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RecentEvents({ events }: { events: AnalyticsEvent[] }) {
  return (
    <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">
          Recent Events ({events.length})
        </h2>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            const secret = getSecret();
            fetch("/api/admin/analytics", {
              headers: { Authorization: `Bearer ${secret}` },
            })
              .then((r) => r.blob())
              .then((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "analytics.csv";
                a.click();
                URL.revokeObjectURL(url);
              });
          }}
          className="text-xs text-accent hover:text-accent/80 transition-colors"
        >
          Export CSV
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50 text-left">
              <th className="px-3 py-2 text-text-muted font-medium">Time</th>
              <th className="px-3 py-2 text-text-muted font-medium">Type</th>
              <th className="px-3 py-2 text-text-muted font-medium">Path</th>
              <th className="px-3 py-2 text-text-muted font-medium">Data</th>
              <th className="px-3 py-2 text-text-muted font-medium">Visitor</th>
              <th className="px-3 py-2 text-text-muted font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id} className="border-b border-border/30 hover:bg-bg-tertiary transition-colors">
                <td className="px-3 py-2 text-text-secondary whitespace-nowrap">{ev.created_at}</td>
                <td className="px-3 py-2">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                    ev.event_type === "signup" ? "bg-accent/15 text-accent" :
                    ev.event_type === "search" ? "bg-blue-500/15 text-blue-400" :
                    ev.event_type === "compare" ? "bg-purple-500/15 text-purple-400" :
                    ev.event_type === "recommend" ? "bg-orange-500/15 text-orange-400" :
                    "bg-bg-tertiary text-text-muted"
                  )}>
                    {ev.event_type}
                  </span>
                </td>
                <td className="px-3 py-2 text-text-secondary">{ev.path}</td>
                <td className="px-3 py-2 text-text-muted max-w-[200px] truncate">
                  {Object.keys(ev.event_data).length > 0 ? JSON.stringify(ev.event_data) : "-"}
                </td>
                <td className="px-3 py-2 text-text-muted font-mono-nums">{ev.visitor_id.slice(0, 8)}</td>
                <td className="px-3 py-2 text-text-secondary">{ev.email || "-"}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-text-muted">
                  No events yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"overview" | "users" | "events">("overview");
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [aggregate, setAggregate] = useState<AggregateData | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if already authed from session
  useEffect(() => {
    const s = getSecret();
    if (s) {
      adminFetch("/api/admin/users?format=json&limit=1")
        .then(() => setAuthed(true))
        .catch(() => setSecret(""));
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, eventsRes, aggRes] = await Promise.all([
        adminFetch("/api/admin/users?format=json"),
        adminFetch("/api/admin/analytics?format=json"),
        adminFetch("/api/admin/analytics?aggregate=true"),
      ]);
      setUsers(usersRes.users || []);
      setEvents(eventsRes.events || []);
      setAggregate(aggRes);
    } catch (err) {
      if (err instanceof Error && err.message === "unauthorized") {
        setAuthed(false);
        setSecret("");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [authed, loadData]);

  if (!authed) {
    return <LoginForm onLogin={() => setAuthed(true)} />;
  }

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "users" as const, label: `Users (${users.length})` },
    { key: "events" as const, label: `Events (${events.length})` },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-text-primary">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-1.5 text-xs bg-bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={() => {
                setSecret("");
                setAuthed(false);
              }}
              className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "bg-bg-card text-text-secondary border border-border hover:text-text-primary"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && !aggregate ? (
          <div className="text-center py-12 text-text-muted">Loading...</div>
        ) : (
          <div className="space-y-6">
            {tab === "overview" && aggregate && <AggregatePanel data={aggregate} />}
            {tab === "users" && <UsersTable users={users} />}
            {tab === "events" && <RecentEvents events={events} />}
          </div>
        )}
      </div>
    </div>
  );
}
