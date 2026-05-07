"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useMqtt } from "@/lib/UseMqtt";
import {
  Users, TrendingUp, CheckCircle2, XCircle, ArrowRight,
  Wifi, WifiOff, Loader2, Radio, MapPin, CreditCard,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import Link from "next/link";

const RFID_TOPIC = "esp32/rfid/gps";

interface Transaction {
  id: string; uid: string; passenger_name: string; amount: number;
  status: "PAID" | "FAILED"; lat: number; lng: number; timestamp: string; route: string;
}
interface Resident {
  id: string; full_name: string; email: string; rfid_uid: string | null; balance: number;
}
interface LogEntry {
  id: string; uid: string; event: string; timestamp: string; status: "success" | "error" | "info";
}
interface LiveScan {
  uid: string; lat?: number; lng?: number; timestamp: string; resident: Resident | null; status: "PAID" | "FAILED";
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 10)   return "just now";
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function AdminPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [residents,    setResidents]    = useState<Resident[]>([]);
  const [logs,         setLogs]         = useState<LogEntry[]>([]);
  const [dataLoading,  setDataLoading]  = useState(true);

  // Scanner state
  const [scanActive, setScanActive] = useState(false);
  const [liveScans,  setLiveScans]  = useState<LiveScan[]>([]);
  const [lastScan,   setLastScan]   = useState<LiveScan | null>(null);
  const [scanFlash,  setScanFlash]  = useState(false);

  // Tick for time-ago labels
  const [, setTicker] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTicker(v => v + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    (async () => {
      const [txRes, resRes, logRes] = await Promise.all([
        supabase.from("transactions")
          .select("id,uid,passenger_name,amount,status,lat,lng,timestamp,route")
          .order("timestamp", { ascending: false }).limit(50),
        supabase.from("jeepneyriders")
          .select("id,full_name,email,rfid_uid,balance")
          .eq("role", "resident").order("full_name"),
        supabase.from("rfid_logs")
          .select("id,uid,event,timestamp,status")
          .order("timestamp", { ascending: false }).limit(8),
      ]);
      if (txRes.data)  setTransactions(txRes.data);
      if (resRes.data) setResidents(resRes.data);
      if (logRes.data) setLogs(logRes.data);
      setDataLoading(false);
    })();
  }, []);

  // MQTT message handler
  const mqttPublishRef = useRef<((topic: string, msg: string) => void) | null>(null);

  const handleMqttMessage = useCallback(async (payload: string) => {
    let parsed: { uid?: string; lat?: number; lng?: number } = {};
    try { parsed = JSON.parse(payload); } catch { return; }
    const uid = parsed.uid?.trim().toUpperCase();
    if (!uid) return;

    const { data: matched } = await supabase
      .from("jeepneyriders")
      .select("id,full_name,email,rfid_uid,balance")
      .eq("rfid_uid", uid)
      .maybeSingle();

    const now = new Date().toISOString();
    const FARE = 10;
    let status: "PAID" | "FAILED" = "FAILED";
    let updatedResident = matched ?? null;

    if (matched && matched.balance >= FARE) {
      const { error: deductErr } = await supabase
        .from("jeepneyriders")
        .update({ balance: matched.balance - FARE })
        .eq("id", matched.id);

      if (!deductErr) {
        status = "PAID";
        updatedResident = { ...matched, balance: matched.balance - FARE };

        await supabase.from("transactions").insert({
          uid,
          passenger_name: matched.full_name,
          amount:         FARE,
          status:         "PAID",
          lat:            parsed.lat ?? null,
          lng:            parsed.lng ?? null,
          timestamp:      now,
          route:          "Timbol",
        });

        setResidents(prev => prev.map(r =>
          r.id === matched.id ? { ...r, balance: matched.balance - FARE } : r
        ));

        setTransactions(prev => [{
          id:             crypto.randomUUID(),
          uid,
          passenger_name: matched.full_name,
          amount:         FARE,
          status:         "PAID",
          lat:            parsed.lat ?? 0,
          lng:            parsed.lng ?? 0,
          timestamp:      now,
          route:          "Timbol",
        }, ...prev]);
      }
    } else {
      await supabase.from("transactions").insert({
        uid,
        passenger_name: matched?.full_name ?? "Unknown",
        amount:         FARE,
        status:         "FAILED",
        lat:            parsed.lat ?? null,
        lng:            parsed.lng ?? null,
        timestamp:      now,
        route:          "Timbol",
      });
    }

    const scan: LiveScan = {
      uid,
      lat:       parsed.lat,
      lng:       parsed.lng,
      timestamp: now,
      resident:  updatedResident,
      status,
    };

    setLastScan(scan);
    setLiveScans(prev => [scan, ...prev].slice(0, 20));
    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 700);
  }, []);

  // useMqtt now returns real status
  const { status: mqttStatus } = useMqtt({
    topic: RFID_TOPIC,
    onMessage: handleMqttMessage,
    enabled: scanActive,
  });

  // Derived stats
  const paid    = transactions.filter(t => t.status === "PAID");
  const failed  = transactions.filter(t => t.status === "FAILED");
  const revenue = paid.reduce((s, t) => s + t.amount, 0);

  const skeletonRow = (cols: number) => (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div style={{ height: 13, background: "rgba(255,255,255,0.05)", borderRadius: 4, animation: "pulse 1.5s ease infinite" }} />
        </td>
      ))}
    </tr>
  );

  const cardStyle = {
    background: "#181d2a",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
    overflow: "hidden",
  } as const;

  const sectionHead = (title: string, href: string) => (
    <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h3 style={{ fontFamily: "Syne,sans-serif", fontWeight: 600, fontSize: 15 }}>{title}</h3>
      <Link href={href} style={{ fontSize: 12, color: "#f5a623", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
        View all <ArrowRight size={12} />
      </Link>
    </div>
  );

  const mqttDotColor =
    mqttStatus === "connected"   ? "#22c55e" :
    mqttStatus === "connecting"  ? "#f5a623" :
    mqttStatus === "error"       ? "#ef4444" : "#4b5563";

  const mqttLabel =
    mqttStatus === "connected"  ? `Connected · topic: ${RFID_TOPIC}` :
    mqttStatus === "connecting" ? "Connecting to MQTT broker…" :
    mqttStatus === "error"      ? "Connection error — retrying…" :
    "Scanner inactive";

  return (
    <div style={{ padding: "36px 40px" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
          {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Admin Dashboard</h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Timbol RFID system overview — Calbayog City.</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Residents" value={dataLoading ? "—" : String(residents.length)} sub="Registered cardholders" icon={<Users size={18}/>} delay={1}/>
        <StatCard label="Revenue Today"   value={dataLoading ? "—" : `₱${revenue.toFixed(2)}`} sub="Collected fares" icon={<TrendingUp size={18}/>} delay={2} accent/>
        <StatCard label="Successful Taps" value={dataLoading ? "—" : String(paid.length)}   sub="PAID transactions" icon={<CheckCircle2 size={18}/>} delay={3}/>
        <StatCard label="Failed Taps"     value={dataLoading ? "—" : String(failed.length)} sub="Errors / low balance" icon={<XCircle size={18}/>} delay={4}/>
      </div>

      {/* ══ LIVE RFID SCANNER ══════════════════════════════════════════════ */}
      <div className="fade-up delay-1" style={{
        background: scanActive ? "linear-gradient(135deg,#111827,#0d1a12)" : "#181d2a",
        border: `1px solid ${scanActive ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16, marginBottom: 24, overflow: "hidden",
        transition: "border 0.4s, background 0.4s",
        boxShadow: scanActive ? "0 0 40px rgba(34,197,94,0.06)" : "none",
      }}>
        {/* Panel header */}
        <div style={{
          padding: "18px 24px",
          borderBottom: `1px solid ${scanActive ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)"}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: scanActive ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: scanActive && mqttStatus === "connected" ? "pulse-ring-green 2s ease infinite" : "none",
            }}>
              <Radio size={18} color={scanActive ? "#22c55e" : "#4b5563"}/>
            </div>
            <div>
              <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 600, fontSize: 15 }}>Live Card Scanner</div>
              <div style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%", display: "inline-block",
                  background: mqttDotColor,
                  animation: mqttStatus === "connected" ? "pulse-dot 1.8s ease infinite" : "none",
                }}/>
                {mqttLabel}
              </div>
            </div>
          </div>

          <button onClick={() => setScanActive(v => !v)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 9,
            background: scanActive ? "rgba(239,68,68,0.1)" : "linear-gradient(135deg,#22c55e,#16a34a)",
            border: scanActive ? "1px solid rgba(239,68,68,0.25)" : "none",
            color: scanActive ? "#ef4444" : "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            boxShadow: scanActive ? "none" : "0 4px 14px rgba(34,197,94,0.3)",
            transition: "all 0.2s",
          }}>
            {scanActive ? <><WifiOff size={15}/> Stop Scanner</> : <><Wifi size={15}/> Start Scanner</>}
          </button>
        </div>

        {/* Scanner body */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>

          {/* Left — scan result */}
          <div style={{
            padding: "28px",
            borderRight: `1px solid ${scanActive ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)"}`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: 260,
          }}>
            {!scanActive ? (
              <div style={{ textAlign: "center", opacity: 0.45 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  border: "2px dashed rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
                }}>
                  <CreditCard size={28} color="#4b5563"/>
                </div>
                <div style={{ fontSize: 14, color: "#6b7280" }}>Scanner is off</div>
                <div style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}>Press "Start Scanner" to listen for taps</div>
              </div>
            ) : lastScan ? (
              <div style={{ width: "100%", animation: scanFlash ? "flash-in 0.4s ease" : "none" }}>
                {/* UID card */}
                <div style={{
                  background: lastScan.resident
                    ? "linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.04))"
                    : "linear-gradient(135deg,rgba(239,68,68,0.1),rgba(239,68,68,0.04))",
                  border: `1px solid ${lastScan.resident ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                  borderRadius: 12, padding: "18px 20px", marginBottom: 14,
                }}>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Card UID</div>
                  <div style={{
                    fontFamily: "monospace", fontSize: 24, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 8,
                    color: lastScan.resident ? "#22c55e" : "#ef4444",
                  }}>{lastScan.uid}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, fontFamily: "Syne,sans-serif",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      padding: "3px 8px", borderRadius: 5,
                      background: lastScan.status === "PAID" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      color: lastScan.status === "PAID" ? "#22c55e" : "#ef4444",
                    }}>
                      {lastScan.status === "PAID" ? "✓ PAID — ₱10 deducted" : lastScan.resident ? "✗ LOW BALANCE" : "✗ UNREGISTERED"}
                    </span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{timeAgo(lastScan.timestamp)}</span>
                  </div>
                </div>

                {/* Resident detail */}
                {lastScan.resident ? (
                  <div style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10, padding: "14px 16px",
                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>Resident</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{lastScan.resident.full_name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>Balance</div>
                      <div style={{
                        fontFamily: "Syne,sans-serif", fontSize: 16, fontWeight: 700,
                        color: lastScan.resident.balance < 20 ? "#ef4444" : "#22c55e",
                      }}>
                        ₱{lastScan.resident.balance.toFixed(2)}
                        {lastScan.resident.balance < 20 && (
                          <span style={{ fontSize: 11, marginLeft: 6 }}> LOW</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>Email</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>{lastScan.resident.email}</div>
                    </div>
                    {lastScan.lat && lastScan.lng && (
                      <div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>GPS</div>
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${lastScan.lat}&mlon=${lastScan.lng}#map=15/${lastScan.lat}/${lastScan.lng}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, color: "#3b82f6", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <MapPin size={11}/>{lastScan.lat.toFixed(4)}, {lastScan.lng.toFixed(4)}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)",
                    borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#9ca3af",
                  }}>
                    Card not registered. Ask the cardholder to sign up first.
                  </div>
                )}
              </div>
            ) : (
              // Waiting for first tap
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  border: "2px solid rgba(34,197,94,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 18px", position: "relative",
                  animation: "scanner-pulse 2s ease infinite",
                }}>
                  <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "1px solid rgba(34,197,94,0.15)", animation: "scanner-pulse 2s ease infinite 0.4s" }}/>
                  <div style={{ position: "absolute", inset: -16, borderRadius: "50%", border: "1px solid rgba(34,197,94,0.07)", animation: "scanner-pulse 2s ease infinite 0.8s" }}/>
                  <Loader2 size={28} color="#22c55e" style={{ animation: "spin 2s linear infinite" }}/>
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, color: "#22c55e", marginBottom: 6 }}>
                  {mqttStatus === "connecting" ? "Connecting…" : "Listening for card taps…"}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Tap any RFID card on the reader</div>
              </div>
            )}
          </div>

          {/* Right — scan feed */}
          <div>
            <div style={{
              padding: "14px 20px",
              borderBottom: `1px solid ${scanActive ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)"}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#9ca3af" }}>Recent Scans</span>
              {liveScans.length > 0 && (
                <button onClick={() => { setLiveScans([]); setLastScan(null); }} style={{
                  fontSize: 11, color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                }}>Clear</button>
              )}
            </div>
            <div style={{ maxHeight: 242, overflowY: "auto" }}>
              {liveScans.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center", color: "#4b5563", fontSize: 12 }}>
                  {scanActive ? "No scans yet — waiting…" : "Start scanner to see live scans"}
                </div>
              ) : (
                liveScans.map((scan, i) => (
                  <div key={`${scan.uid}-${scan.timestamp}`} style={{
                    padding: "10px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.025)",
                    display: "flex", alignItems: "center", gap: 10,
                    background: i === 0 ? "rgba(34,197,94,0.04)" : "transparent",
                    transition: "background 0.6s",
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: scan.status === "PAID" ? "#22c55e" : "#ef4444" }}/>
                    <span style={{ fontFamily: "monospace", fontSize: 13, color: scan.resident ? "#f5a623" : "#ef4444", letterSpacing: "0.06em", flexShrink: 0 }}>
                      {scan.uid}
                    </span>
                    <span style={{ fontSize: 12, color: "#6b7280", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {scan.resident ? scan.resident.full_name : "Unknown card"}
                    </span>
                    <span style={{ fontSize: 11, color: "#4b5563", flexShrink: 0 }}>{timeAgo(scan.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* ══ END SCANNER ════════════════════════════════════════════════════ */}

      {/* Logs + Residents */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 20, marginBottom: 24 }}>
        <div className="fade-up delay-2" style={cardStyle}>
          {sectionHead("Live Logs", "/admin/logs")}
          {dataLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)", display: "flex", gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.06)", marginTop: 4, flexShrink: 0 }}/>
                  <div style={{ flex: 1, height: 13, background: "rgba(255,255,255,0.04)", borderRadius: 4, animation: "pulse 1.5s ease infinite" }}/>
                </div>
              ))
            : logs.length === 0
              ? <div style={{ padding: "32px 20px", textAlign: "center", color: "#6b7280", fontSize: 13 }}>No logs yet.</div>
              : logs.map(log => (
                  <div key={log.id} style={{ padding: "11px 20px", display: "flex", gap: 12, alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                      background: log.status === "success" ? "#22c55e" : log.status === "error" ? "#ef4444" : "#3b82f6",
                      boxShadow: `0 0 5px ${log.status === "success" ? "rgba(34,197,94,0.5)" : log.status === "error" ? "rgba(239,68,68,0.5)" : "rgba(59,130,246,0.5)"}`,
                    }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>{log.uid}</div>
                      <div style={{
                        fontSize: 12, fontFamily: "monospace", lineHeight: 1.4, wordBreak: "break-word",
                        color: log.status === "success" ? "#d1fae5" : log.status === "error" ? "#fee2e2" : "#dbeafe",
                      }}>{log.event}</div>
                    </div>
                  </div>
                ))
          }
        </div>

        <div className="fade-up delay-3" style={cardStyle}>
          {sectionHead("Resident Balances", "/admin/residents")}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                  {["Name", "RFID UID", "Balance", "Status"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", fontSize: 11, color: "#6b7280", textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataLoading
                  ? Array.from({ length: 5 }).map((_, i) => skeletonRow(4))
                  : residents.slice(0, 8).map(r => {
                      const s = !r.rfid_uid ? "inactive" : r.balance < 20 ? "low" : "active";
                      return (
                        <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500 }}>{r.full_name}</td>
                          <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: r.rfid_uid ? "#f5a623" : "#4b5563" }}>{r.rfid_uid ?? "—"}</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "Syne,sans-serif", fontWeight: 600, color: r.balance < 20 ? "#ef4444" : "#f0f2f5" }}>₱{r.balance.toFixed(2)}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              padding: "3px 9px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                              fontFamily: "Syne,sans-serif", textTransform: "uppercase",
                              background: s === "active" ? "rgba(34,197,94,0.1)" : s === "low" ? "rgba(245,166,35,0.1)" : "rgba(239,68,68,0.1)",
                              color: s === "active" ? "#22c55e" : s === "low" ? "#f5a623" : "#ef4444",
                            }}>{s}</span>
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="fade-up delay-4" style={cardStyle}>
        {sectionHead("Recent Transactions", "/admin/transactions")}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                {["UID", "Passenger", "Route", "Fare", "Status", "Date/Time"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280", textAlign: "left", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataLoading
                ? Array.from({ length: 5 }).map((_, i) => skeletonRow(6))
                : transactions.slice(0, 8).map(tx => (
                    <tr key={tx.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "13px 16px", fontSize: 12, fontFamily: "monospace", color: "#9ca3af" }}>{tx.uid}</td>
                      <td style={{ padding: "13px 16px", fontSize: 13 }}>{tx.passenger_name}</td>
                      <td style={{ padding: "13px 16px", fontSize: 13 }}>{tx.route}</td>
                      <td style={{ padding: "13px 16px", fontSize: 14, fontWeight: 600, fontFamily: "Syne,sans-serif" }}>₱{Number(tx.amount).toFixed(2)}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{
                          padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                          background: tx.status === "PAID" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          color: tx.status === "PAID" ? "#22c55e" : "#ef4444",
                          border: `1px solid ${tx.status === "PAID" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                          fontFamily: "Syne,sans-serif",
                        }}>{tx.status}</span>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "#6b7280" }}>{formatDateTime(tx.timestamp)}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes pulse          { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin           { to{transform:rotate(360deg)} }
        @keyframes flash-in       { 0%{background:rgba(34,197,94,0.18);transform:scale(1.01)} 100%{background:transparent;transform:scale(1)} }
        @keyframes scanner-pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.06)} }
        @keyframes pulse-dot      { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)} 70%{box-shadow:0 0 0 6px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
        @keyframes pulse-ring-green { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.2)} 70%{box-shadow:0 0 0 10px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
      `}</style>
    </div>
  );
}