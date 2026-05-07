"use client";
import { useState, useEffect } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { Search, MapPin, ExternalLink, TrendingUp, CheckCircle2, XCircle, Download } from "lucide-react";

interface Transaction {
  id: string;
  rfid_uid: string;
  passenger_name: string;
  amount: number;
  status: "PAID" | "FAILED";
  lat: number | null;
  lng: number | null;
  created_at: string;
  route: string;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<"ALL" | "PAID" | "FAILED">("ALL");
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(0);
  const PAGE_SIZE = 25;

  useEffect(() => {
    (async () => {
      const { data, error } = await supabaseAdmin
        .from("fare")
        .select("id, rfid_uid, passenger_name, amount, status, lat, lng, created_at, route")
        .order("created_at", { ascending: false });
      if (error) console.error(error);
      if (data) setTransactions(data);
      setLoading(false);
    })();
  }, []);

  const paid    = transactions.filter(t => t.status === "PAID");
  const failed  = transactions.filter(t => t.status === "FAILED");
  const revenue = paid.reduce((s, t) => s + t.amount, 0);

  const filtered = transactions.filter(t => {
    const mS = filter === "ALL" || t.status === filter;
    const q  = search.toLowerCase();
    const mQ = t.passenger_name?.toLowerCase().includes(q) ||
               t.rfid_uid?.toLowerCase().includes(q) ||
               t.route?.toLowerCase().includes(q) ||
               t.id.toLowerCase().includes(q);
    return mS && mQ;
  });

  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(0); };
  const handleFilter = (f: "ALL" | "PAID" | "FAILED") => { setFilter(f); setPage(0); };

  const exportCSV = () => {
    const headers = ["ID", "RFID UID", "Passenger", "Route", "Amount", "Status", "Timestamp", "Lat", "Lng"];
    const rows = filtered.map(t => [t.id, t.rfid_uid, t.passenger_name, t.route, t.amount, t.status, t.created_at, t.lat ?? "", t.lng ?? ""]);
    const csv  = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "timbol_transactions.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "36px 40px" }}>
      <div className="fade-up" style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>All Transactions</h1>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            {loading ? "Loading…" : `${transactions.length} total taps · ${paid.length} paid · ₱${revenue.toFixed(2)} collected`}
          </p>
        </div>
        <button onClick={exportCSV} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 9,
          background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
          color: "#3b82f6", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
        }}>
          <Download size={14}/> Export CSV
        </button>
      </div>

      <div className="fade-up delay-1" style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Revenue", value: `₱${revenue.toFixed(2)}`, color: "#f5a623", icon: <TrendingUp size={14}/> },
          { label: "Paid",    value: String(paid.length),       color: "#22c55e", icon: <CheckCircle2 size={14}/> },
          { label: "Failed",  value: String(failed.length),     color: "#ef4444", icon: <XCircle size={14}/> },
        ].map(s => (
          <div key={s.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 18px", borderRadius: 10,
            background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{ color: s.color }}>{s.icon}</span>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>{s.label}</span>
            <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="fade-up delay-1" style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }}/>
          <input
            value={search} onChange={e => handleSearch(e.target.value)}
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
            <button key={f} onClick={() => handleFilter(f)} style={{
              padding: "10px 18px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.07)",
              background: filter === f ? "rgba(245,166,35,0.1)" : "#181d2a",
              color: filter === f ? "#f5a623" : "#9ca3af",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Syne,sans-serif", transition: "all 0.15s",
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div className="fade-up delay-2" style={{
        background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                {["RFID UID", "Passenger", "Route", "Fare", "Status", "Date/Time", "Location"].map(h => (
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
                : paginated.length === 0
                  ? <tr><td colSpan={7} style={{ padding: 48, textAlign: "center", color: "#6b7280", fontSize: 14 }}>No results found.</td></tr>
                  : paginated.map(tx => (
                      <tr key={tx.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "14px 16px", fontSize: 12, fontFamily: "monospace", color: "#9ca3af" }}>{tx.rfid_uid}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13 }}>{tx.passenger_name}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13 }}>{tx.route}</td>
                        <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, fontFamily: "Syne,sans-serif" }}>₱{Number(tx.amount).toFixed(2)}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                            background: tx.status === "PAID" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                            color: tx.status === "PAID" ? "#22c55e" : "#ef4444",
                            border: `1px solid ${tx.status === "PAID" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                            fontFamily: "Syne,sans-serif",
                          }}>{tx.status}</span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#6b7280" }}>{formatDateTime(tx.created_at)}</td>
                        <td style={{ padding: "14px 16px" }}>
                          {tx.lat && tx.lng
                            ? <a href={`https://www.google.com/maps?q=${tx.lat},${tx.lng}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#3b82f6", textDecoration: "none" }}>
                                <MapPin size={13}/> Map <ExternalLink size={11}/>
                              </a>
                            : <span style={{ fontSize: 12, color: "#4b5563" }}>—</span>
                          }
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{
                padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)",
                background: "none", color: page === 0 ? "#4b5563" : "#9ca3af", fontSize: 13, cursor: page === 0 ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}>← Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{
                padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)",
                background: "none", color: page >= totalPages - 1 ? "#4b5563" : "#9ca3af", fontSize: 13, cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}