"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Search, AlertCircle, CreditCard, TrendingUp, CheckCircle2, XCircle, MapPin, ExternalLink } from "lucide-react";

interface Transaction {
  id: string;
  rfid_uid: string;
  amount: number;
  status: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
  route: string;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  useEffect(() => {
    if (!user?.rfidUid) {
      setLoading(false);
      return;
    }
    supabase
      .from("fare")
      .select("id, rfid_uid, amount, status, lat, lng, created_at, route")
      .eq("rfid_uid", user.rfidUid)
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setTransactions(data ?? []);
        setLoading(false);
      });
  }, [user?.rfidUid]);

  const paid = transactions.filter(t => t.status === "PAID");
  const failed = transactions.filter(t => t.status === "FAILED");
  const revenue = paid.reduce((sum, t) => sum + t.amount, 0);

  const filtered = transactions.filter(t => {
    if (filter !== "ALL" && t.status !== filter) return false;
    if (search && !t.route?.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function getMapUrl(lat: number | null, lng: number | null): string | null {
    if (!lat || !lng) return null;
    return "https://www.openstreetmap.org/?mlat=" + lat + "&mlon=" + lng + "&zoom=17";
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("en-PH", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  const cellStyle = { padding: "14px 16px" } as const;
  const rowStyle = { borderBottom: "1px solid rgba(255,255,255,0.04)" } as const;

  return (
    <div style={{ padding: "36px 40px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
          My Transactions
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          {loading ? "Loading…" : transactions.length + " total taps · " + paid.length + " paid · ₱" + revenue.toFixed(2) + " spent"}
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <AlertCircle size={17} color="#ef4444" />
          <span style={{ fontSize: 14, color: "#ef4444" }}>{error}</span>
        </div>
      )}

      {/* ── No RFID ── */}
      {!loading && !user?.rfidUid && (
        <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.18)", borderRadius: 12, padding: "20px 24px", display: "flex", gap: 16, alignItems: "center" }}>
          <AlertCircle size={22} color="#f5a623" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>No RFID card linked</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Register your card on the Overview page to track transactions.</div>
          </div>
        </div>
      )}

      {/* ── Main content (only if RFID exists) ── */}
      {user?.rfidUid && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Stats */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 10, background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <TrendingUp size={14} color="#f5a623" />
              <span style={{ fontSize: 13, color: "#9ca3af" }}>Total Spent</span>
              <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, color: "#f5a623" }}>{"₱" + revenue.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 10, background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <CheckCircle2 size={14} color="#22c55e" />
              <span style={{ fontSize: 13, color: "#9ca3af" }}>Paid</span>
              <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, color: "#22c55e" }}>{paid.length}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 10, background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <XCircle size={14} color="#ef4444" />
              <span style={{ fontSize: 13, color: "#9ca3af" }}>Failed</span>
              <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, color: "#ef4444" }}>{failed.length}</span>
            </div>
          </div>

          {/* Search + Filter */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search by route or ID…"
                style={{ width: "100%", padding: "10px 14px 10px 38px", background: "#181d2a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, color: "#f0f2f5", fontSize: 14, outline: "none", fontFamily: "inherit" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["ALL", "PAID", "FAILED"].map(f => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setPage(0); }}
                  style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.07)", background: filter === f ? "rgba(245,166,35,0.1)" : "#181d2a", color: filter === f ? "#f5a623" : "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Syne,sans-serif" }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                    {["ID", "Route", "Fare", "Status", "Date / Time", "Location"].map(h => (
                      <th key={h} style={{ padding: "13px 16px", fontSize: 12, color: "#6b7280", textAlign: "left", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>

                  {/* Skeleton rows */}
                  {loading && [0, 1, 2].map(i => (
                    <tr key={i}>
                      {[0, 1, 2, 3, 4, 5].map(j => (
                        <td key={j} style={cellStyle}>
                          <div style={{ height: 13, borderRadius: 4, background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s ease infinite" }} />
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Empty */}
                  {!loading && paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 60, textAlign: "center" }}>
                        <CreditCard size={36} color="#374151" style={{ display: "block", margin: "0 auto 12px" }} />
                        <div style={{ fontSize: 14, color: "#6b7280" }}>
                          {transactions.length === 0 ? "No transactions yet." : "No results match your filter."}
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Data rows */}
                  {!loading && paginated.map(tx => {
                    const isPaid = tx.status === "PAID";
                    const mapUrl = getMapUrl(tx.lat, tx.lng);
                    return (
                      <tr key={tx.id} style={rowStyle}>
                        <td style={{ ...cellStyle, fontSize: 12, color: "#6b7280", fontFamily: "monospace" }}>
                          {tx.id.slice(0, 8)}…
                        </td>
                        <td style={{ ...cellStyle, fontSize: 13 }}>
                          {tx.route}
                        </td>
                        <td style={{ ...cellStyle, fontSize: 14, fontWeight: 600, fontFamily: "Syne,sans-serif" }}>
                          {"₱" + Number(tx.amount).toFixed(2)}
                        </td>
                        <td style={cellStyle}>
                          <span style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            fontFamily: "Syne,sans-serif",
                            background: isPaid ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                            color: isPaid ? "#22c55e" : "#ef4444",
                            border: isPaid ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(239,68,68,0.2)",
                          }}>
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ ...cellStyle, fontSize: 12, color: "#6b7280" }}>
                          {formatDate(tx.created_at)}
                        </td>
                        <td style={cellStyle}>
                          {mapUrl && (
                            <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#3b82f6", textDecoration: "none" }}>
                              <MapPin size={13} />
                              Map
                              <ExternalLink size={11} />
                            </a>
                          )}
                          {!mapUrl && <span style={{ fontSize: 12, color: "#4b5563" }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}

                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  {"Showing " + (page * PAGE_SIZE + 1) + "–" + Math.min((page + 1) * PAGE_SIZE, filtered.length) + " of " + filtered.length}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "none", color: page === 0 ? "#4b5563" : "#9ca3af", fontSize: 13, cursor: page === 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "none", color: page >= totalPages - 1 ? "#4b5563" : "#9ca3af", fontSize: 13, cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}