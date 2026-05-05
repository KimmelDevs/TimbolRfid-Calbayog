"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Activity, RefreshCw, Filter } from "lucide-react";

interface LogEntry {
  id: string;
  uid: string;
  event: string;
  timestamp: string;
  status: "success" | "error" | "info";
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

const DOT_COLOR: Record<string, string> = {
  success: "#22c55e",
  error:   "#ef4444",
  info:    "#3b82f6",
};

const TEXT_COLOR: Record<string, string> = {
  success: "#d1fae5",
  error:   "#fee2e2",
  info:    "#dbeafe",
};

export default function LogsPage() {
  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<"all" | "success" | "error" | "info">("all");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const { data } = await supabase
      .from("rfid_logs")
      .select("id, uid, event, timestamp, status")
      .order("timestamp", { ascending: false })
      .limit(200);
    if (data) setLogs(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchLogs(true), 3000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("rfid_logs_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rfid_logs" }, payload => {
        setLogs(prev => [payload.new as LogEntry, ...prev].slice(0, 200));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = filter === "all" ? logs : logs.filter(l => l.status === filter);

  const counts = {
    success: logs.filter(l => l.status === "success").length,
    error:   logs.filter(l => l.status === "error").length,
    info:    logs.filter(l => l.status === "info").length,
  };

  return (
    <div style={{ padding: "36px 40px" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>RFID Logs</h1>
          <p style={{ color: "#6b7280", fontSize: 14 }}>Real-time event log from the ESP32 system.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {/* Auto-refresh toggle */}
          <button onClick={() => setAutoRefresh(v => !v)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 9,
            background: autoRefresh ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${autoRefresh ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"}`,
            color: autoRefresh ? "#22c55e" : "#9ca3af", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: autoRefresh ? "#22c55e" : "#4b5563",
              animation: autoRefresh ? "pulse-dot 1.5s ease infinite" : "none",
            }}/>
            {autoRefresh ? "Live" : "Paused"}
          </button>
          <button onClick={() => fetchLogs(true)} disabled={refreshing} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 9,
            background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)",
            color: "#f5a623", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            opacity: refreshing ? 0.6 : 1,
          }}>
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}/>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats + filter row */}
      <div className="fade-up delay-1" style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        {(["all", "success", "error", "info"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 8,
            border: `1px solid ${filter === f ? (f === "all" ? "rgba(245,166,35,0.3)" : DOT_COLOR[f] + "44") : "rgba(255,255,255,0.07)"}`,
            background: filter === f ? (f === "all" ? "rgba(245,166,35,0.08)" : DOT_COLOR[f] + "14") : "#181d2a",
            color: filter === f ? (f === "all" ? "#f5a623" : DOT_COLOR[f]) : "#6b7280",
            fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}>
            {f !== "all" && <span style={{ width: 8, height: 8, borderRadius: "50%", background: DOT_COLOR[f], flexShrink: 0 }}/>}
            <span style={{ textTransform: "capitalize" }}>{f}</span>
            {f !== "all" && <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 13 }}>{counts[f]}</span>}
          </button>
        ))}
        <span style={{ fontSize: 13, color: "#6b7280", marginLeft: "auto" }}>{filtered.length} entries</span>
      </div>

      {/* Terminal window */}
      <div className="fade-up delay-2" style={{
        background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden",
      }}>
        {/* Terminal titlebar */}
        <div style={{
          padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", gap: 10,
          background: "#0c0f14",
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }}/>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f5a623" }}/>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }}/>
          </div>
          <span style={{ fontSize: 12, color: "#6b7280", fontFamily: "monospace", marginLeft: 8 }}>
            timbol-esp32 — event stream
          </span>
          {autoRefresh && (
            <span style={{
              marginLeft: "auto", fontSize: 11, color: "#22c55e", fontFamily: "monospace",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse-dot 1.5s ease infinite", display: "inline-block" }}/>
              LIVE
            </span>
          )}
        </div>

        {/* Log entries */}
        <div style={{ fontFamily: "monospace", maxHeight: 600, overflowY: "auto" }}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)", display: "flex", gap: 16 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.06)", marginTop: 3, flexShrink: 0 }}/>
                  <div style={{ flex: 1, height: 13, background: "rgba(255,255,255,0.04)", borderRadius: 4, animation: "pulse 1.5s ease infinite" }}/>
                </div>
              ))
            : filtered.length === 0
              ? <div style={{ padding: "48px 20px", textAlign: "center", color: "#6b7280", fontSize: 13 }}>
                  <Activity size={32} style={{ display: "block", margin: "0 auto 12px", opacity: 0.3 }}/>
                  No log entries yet.
                </div>
              : filtered.map((log, i) => (
                  <div key={log.id} style={{
                    padding: "12px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.025)",
                    display: "flex", gap: 16, alignItems: "flex-start",
                    background: i === 0 && autoRefresh ? "rgba(255,255,255,0.015)" : "transparent",
                    transition: "background 0.5s",
                  }}>
                    <div style={{
                      width: 9, height: 9, borderRadius: "50%", marginTop: 4, flexShrink: 0,
                      background: DOT_COLOR[log.status],
                      boxShadow: `0 0 6px ${DOT_COLOR[log.status]}88`,
                    }}/>
                    <span style={{ fontSize: 11, color: "#4b5563", flexShrink: 0, width: 170 }}>
                      {formatDateTime(log.timestamp)}
                    </span>
                    <span style={{ fontSize: 12, flexShrink: 0, width: 100, color: log.uid === "SYSTEM" ? "#3b82f6" : "#f5a623" }}>
                      {log.uid}
                    </span>
                    <span style={{ fontSize: 13, flex: 1, color: TEXT_COLOR[log.status], lineHeight: 1.4 }}>
                      {log.event}
                    </span>
                  </div>
                ))
          }
          <div ref={bottomRef}/>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes pulse-dot {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          70%  { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
      `}</style>
    </div>
  );
}
