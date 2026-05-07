"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { MapPin, ExternalLink, Search, CheckCircle2, XCircle } from "lucide-react";

interface Transaction {
  id: string;
  uid: string;
  passenger_name: string;
  amount: number;
  status: "PAID" | "FAILED";
  lat: number;
  lng: number;
  timestamp: string;
  route: string;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminLocationsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<"ALL" | "PAID" | "FAILED">("ALL");
  const [search, setSearch]             = useState("");
  const [view, setView]                 = useState<"grid" | "list">("grid");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("transactions")
        .select("id, uid, passenger_name, amount, status, lat, lng, timestamp, route")
        .not("lat", "is", null)
        .not("lng", "is", null)
        .order("timestamp", { ascending: false });
      if (data) setTransactions(data);
      setLoading(false);
    })();
  }, []);

  const paid   = transactions.filter(t => t.status === "PAID");
  const failed = transactions.filter(t => t.status === "FAILED");

  const filtered = transactions.filter(t => {
    const mS = filter === "ALL" || t.status === filter;
    const q  = search.toLowerCase();
    const mQ = t.passenger_name?.toLowerCase().includes(q) ||
               t.uid.toLowerCase().includes(q) ||
               t.route.toLowerCase().includes(q);
    return mS && mQ;
  });

  return (
    <div style={{ padding: "36px 40px" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>GPS Locations</h1>
          <p style={{ color: "#6b7280", fontSize: 14 }}>All tap locations recorded by the ESP32 GPS module.</p>
        </div>
        {/* View toggle */}
        <div style={{ display: "flex", gap: 4, background: "#181d2a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, padding: 4 }}>
          {(["grid", "list"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "7px 16px", borderRadius: 6,
              background: view === v ? "rgba(245,166,35,0.15)" : "none",
              border: "none", color: view === v ? "#f5a623" : "#6b7280",
              fontSize: 13, fontWeight: 500, cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit",
            }}>{v}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="fade-up delay-1" style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "All taps", value: String(transactions.length), color: "#f5a623" },
          { label: "PAID",     value: String(paid.length),         color: "#22c55e" },
          { label: "FAILED",   value: String(failed.length),       color: "#ef4444" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10, padding: "12px 20px", display: "flex", gap: 12, alignItems: "center",
          }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: s.color }}/>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>{s.label}</span>
            <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 17, color: s.color }}>
              {loading ? "—" : s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="fade-up delay-1" style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }}/>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search passenger, UID, route…"
            style={{
              width: "100%", padding: "10px 14px 10px 38px",
              background: "#181d2a", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 9, color: "#f0f2f5", fontSize: 14, outline: "none", fontFamily: "inherit",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["ALL", "PAID", "FAILED"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "10px 18px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.07)",
              background: filter === f ? "rgba(245,166,35,0.1)" : "#181d2a",
              color: filter === f ? "#f5a623" : "#9ca3af",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Syne,sans-serif", transition: "all 0.15s",
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Grid view */}
      {view === "grid" && (
        loading
          ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ height: 130, background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s ease infinite" }}/>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ height: 13, background: "rgba(255,255,255,0.05)", borderRadius: 4, marginBottom: 8, animation: "pulse 1.5s ease infinite" }}/>
                    <div style={{ height: 11, background: "rgba(255,255,255,0.03)", borderRadius: 4, width: "60%", animation: "pulse 1.5s ease infinite" }}/>
                  </div>
                </div>
              ))}
            </div>
          : filtered.length === 0
            ? <div style={{ padding: "60px 24px", textAlign: "center", background: "#181d2a", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
                <MapPin size={36} color="#374151" style={{ marginBottom: 12 }}/>
                <div style={{ fontSize: 14, color: "#6b7280" }}>No locations found.</div>
              </div>
            : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {filtered.map((tx, i) => (
                  <div key={tx.id} className={`fade-up delay-${Math.min(i + 1, 5)}`} style={{
                    background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12, overflow: "hidden",
                  }}>
                    {/* Embedded map */}
                    <div style={{ height: 130, position: "relative", overflow: "hidden" }}>
                      <iframe
                        title={`map-${tx.id}`}
                        width="100%" height="130"
                        style={{ border: "none", display: "block", opacity: 0.85 }}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${tx.lng - 0.005},${tx.lat - 0.005},${tx.lng + 0.005},${tx.lat + 0.005}&layer=mapnik&marker=${tx.lat},${tx.lng}`}
                        loading="lazy"
                      />
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: tx.status === "PAID" ? "rgba(34,197,94,0.85)" : "rgba(239,68,68,0.85)",
                        color: "#fff", fontFamily: "Syne,sans-serif", backdropFilter: "blur(4px)",
                      }}>{tx.status}</div>
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.passenger_name}</div>
                        <div style={{ fontFamily: "Syne,sans-serif", fontSize: 13, fontWeight: 700, color: "#f5a623" }}>₱{tx.amount}</div>
                      </div>
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: "#9ca3af", marginBottom: 4 }}>{tx.uid}</div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10 }}>{tx.lat.toFixed(6)}, {tx.lng.toFixed(6)}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{formatDateTime(tx.timestamp)}</div>
                        <a href={`https://www.openstreetmap.org/?mlat=${tx.lat}&mlon=${tx.lng}#map=15/${tx.lat}/${tx.lng}`} target="_blank" rel="noopener noreferrer" style={{
                          display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#3b82f6",
                          textDecoration: "none", padding: "4px 8px", background: "rgba(59,130,246,0.1)", borderRadius: 5,
                        }}>
                          <MapPin size={10}/> Open <ExternalLink size={9}/>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="fade-up delay-2" style={{
          background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                  {["Status", "Passenger", "UID", "Route", "Coordinates", "Date/Time", "Map"].map(h => (
                    <th key={h} style={{ padding: "13px 16px", fontSize: 12, color: "#6b7280", textAlign: "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} style={{ padding: "14px 16px" }}>
                            <div style={{ height: 13, background: "rgba(255,255,255,0.05)", borderRadius: 4, animation: "pulse 1.5s ease infinite" }}/>
                          </td>
                        ))}
                      </tr>
                    ))
                  : filtered.length === 0
                    ? <tr><td colSpan={7} style={{ padding: 48, textAlign: "center", color: "#6b7280", fontSize: 14 }}>No locations found.</td></tr>
                    : filtered.map(tx => (
                        <tr key={tx.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "13px 16px" }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                              background: tx.status === "PAID" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                              color: tx.status === "PAID" ? "#22c55e" : "#ef4444",
                              fontFamily: "Syne,sans-serif",
                            }}>
                              {tx.status === "PAID" ? <CheckCircle2 size={10}/> : <XCircle size={10}/>}
                              {tx.status}
                            </span>
                          </td>
                          <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 500 }}>{tx.passenger_name}</td>
                          <td style={{ padding: "13px 16px", fontSize: 12, fontFamily: "monospace", color: "#f5a623" }}>{tx.uid}</td>
                          <td style={{ padding: "13px 16px", fontSize: 13 }}>{tx.route}</td>
                          <td style={{ padding: "13px 16px", fontSize: 12, fontFamily: "monospace", color: "#9ca3af" }}>
                            {tx.lat.toFixed(5)}, {tx.lng.toFixed(5)}
                          </td>
                          <td style={{ padding: "13px 16px", fontSize: 12, color: "#6b7280" }}>{formatDateTime(tx.timestamp)}</td>
                          <td style={{ padding: "13px 16px" }}>
                            <a href={`https://www.openstreetmap.org/?mlat=${tx.lat}&mlon=${tx.lng}#map=15/${tx.lat}/${tx.lng}`} target="_blank" rel="noopener noreferrer" style={{
                              display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#3b82f6", textDecoration: "none",
                            }}>
                              <MapPin size={13}/> Map <ExternalLink size={11}/>
                            </a>
                          </td>
                        </tr>
                      ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}