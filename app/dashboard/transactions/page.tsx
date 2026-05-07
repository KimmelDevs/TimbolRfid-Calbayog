"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { MapPin, ExternalLink, Search, AlertCircle, CreditCard, TrendingUp, CheckCircle2, XCircle } from "lucide-react";

interface Transaction {
  id: string;
  rfid_uid: string;
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

function osmUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=17`;
}

function LocationCell({ lat, lng }: { lat: number | null; lng: number | null }) {
  if (!lat || !lng) {
    return <span style={{ fontSize: 12, color: "#4b5563" }}>—</span>;
  }
  return (
    
      href={osmUrl(lat, lng)}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#3b82f6", textDecoration: "none" }}
    >
      <MapPin size={13} /> Map <ExternalLink size={11} />
    </a>
  );
}

function StatusBadge({ status }: { status: "PAID" | "FAILED" }) {
  const paid = status === "PAID";
  return (
    <span style={{
      padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
      background: paid ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
      color: paid ? "#22c55e" : "#ef4444",
      border: `1px solid ${paid ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
      fontFamily: "Syne,sans-serif",
    }}>
      {status}
    </span>
  );
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PAID" | "FAILED">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  useEffect(() => {
    if (!user?.rfidUid) { setLoading(false); return; }
    (async () => {
      const { data, error: dbErr } = await supabase
        .from("fare")
        .select("id, rfid_uid, amount, status, lat, lng, created_at, route")
        .eq("rfid_uid", user.rfidUid)
        .order("created_at", { ascending: false });
      if (dbErr) setError(dbErr.message);
      else setTransactions(data ?? []);
      setLoading(false);
    })();
  }, [user?.rfidUid]);

  const paid    = transactions.filter(t => t.status === "PAID");
  const failed  = transactions.filter(t => t.status === "FAILED");
  const revenue = paid.reduce((s, t) => s + t.amount, 0);

  const filtered = transactions.filter(t => {
    const matchStatus = filter === "ALL" || t.status === filter;
    const matchSearch =
      t.route?.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(0); };
  const handleFilter = (f: "ALL" | "PAID" | "FAILED") => { setFilter(f); setPage(0); };

  const stats = [
    { label: "Total Spent", value: `₱${revenue.toFixed(2)}`, color: "#f5a623", icon: <TrendingUp size={14} /> },
    { label: "Paid",        value: String(paid.length),       color: "#22c55e", icon: <CheckCircle2 size={14} /> },
    { label: "Failed",      value: String(failed.length),     color: "#ef4444", icon: <XCircle size={14} /> },
  ];

  const TABLE_HEADERS = ["ID", "Route", "Fare", "Status", "Date/Time", "Location"];

  return (
    <div style={{ padding: "36px 40px" }}>

      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
          My Transactions
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          {loading
            ? "Loading…"
            : `${transactions.length} total taps · ${paid.length} paid · ₱${revenue.toFixed(2)} spent`}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="fade-up" style={{
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 10, padding: "14px 18px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <AlertCircle size={17} color="#ef4444" />
          <span style={{ fontSize: 14, color: "#ef4444" }}>{error}</span>
        </div>
      )}

      {/* No RFID warning */}
      {!user?.rfidUid && !loading && (
        <div style={{
          background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.18)",
          borderRadius: 12, padding: "20px 24px", display: "flex", gap: 16, alignItems: "center",
        }}>
          <AlertCircle size={22} color="#f5a623" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>No RFID card linked</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Register your card on the Overview page to track transactions.
            </div>
          </div>
        </div>
      )}

      {user?.rfidUid && (
        <>
          {/* Stats */}
          <div className="fade-up delay-1" style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            {stats.map(s => (
              <div key={s.label} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 18px", borderRadius: 10,
                background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ color: s.color }}>{s.icon}</span>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>{s.label}</span>
                <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, color: s.color }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="fade-up delay-1" style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={15} style={{
                position: "absolute", left: 14, top: "50%",
                transform: "translateY(-50%)", color: "#6b7280",
              }} />
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by route or ID…"
                style={{
                  width: "100%", padding: "10px 14px 10px 38px",
                  background: "#181d2a", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 9, color: "#f0f2f5", fontSize: 14,
                  outline: "none", fontFamily: "inherit",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["ALL", "PAID", "FAILED"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => handleFilter(f)}
                  style={{
                    padding: "10px 18px", borderRadius: 9,
                    border: "1px solid rgba(255,255,255,0.07)",
                    background: filter === f ? "rgba(245,166,35,0.1)" : "#181d2a",
                    color: filter === f ? "#f5a623" : "#9ca3af",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: "Syne,sans-serif", transition: "all 0.15s",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="fade-up delay-2" style={{
            background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, overflow: "hidden",
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                    {TABLE_HEADERS.map(h => (
                      <th key={h} style={{
                        padding: "13px 16px", fontSize: 12,
                        color: "#6b7280", textAlign: "left", fontWeight: 500,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} style={{ padding: "14px 16px" }}>
                          <div style={{
                            height: 14, background: "rgba(255,255,255,0.05)",
                            borderRadius: 4, animation: "pulse 1.5s ease infinite",
                          }} />
                        </td>
                      ))}
                    </tr>
                  ))}

                  {!loading && paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 60, textAlign: "center" }}>
                        <CreditCard size={36} color="#374151" style={{ display: "block", margin: "0 auto 12px" }} />
                        <div style={{ fontSize: 14, color: "#6b7280" }}>
                          {transactions.length === 0
                            ? "No transactions yet."
                            : "No results match your filter."}
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading && paginated.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#6b7280", fontFamily: "monospace" }}>
                        {tx.id.slice(0, 8)}…
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13 }}>
                        {tx.route}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, fontFamily: "Syne,sans-serif" }}>
                        ₱{Number(tx.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <StatusBadge status={tx.status} />
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#6b7280" }}>
                        {formatDateTime(tx.created_at)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <LocationCell lat={tx.lat} lng={tx.lng} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    style={{
                      padding: "7px 14px", borderRadius: 7,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "none", color: page === 0 ? "#4b5563" : "#9ca3af",
                      fontSize: 13, cursor: page === 0 ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    style={{
                      padding: "7px 14px", borderRadius: 7,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "none", color: page >= totalPages - 1 ? "#4b5563" : "#9ca3af",
                      fontSize: 13, cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}