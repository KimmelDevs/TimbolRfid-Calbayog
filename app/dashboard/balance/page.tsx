"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Wallet, TrendingDown, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  status: "PAID" | "FAILED";
  timestamp: string;
  route: string;
}

export default function BalancePage() {
  const { user, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user?.rfidUid) { setLoading(false); return; }
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("transactions")
        .select("id, amount, status, timestamp, route")
        .eq("uid", user.rfidUid)
        .order("timestamp", { ascending: false });
      if (dbErr) throw new Error(dbErr.message);
      setTransactions(data ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.rfidUid]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), fetchData()]);
    setRefreshing(false);
  };

  const paidTx  = transactions.filter(t => t.status === "PAID");
  const spent    = paidTx.reduce((s, t) => s + t.amount, 0);
  const avgFare  = paidTx.length ? (spent / paidTx.length) : 0;
  const recent   = transactions.slice(0, 3);

  const card = {
    background: "#181d2a",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: "22px 24px",
  } as const;

  return (
    <div style={{ padding: "36px 40px", maxWidth: 820 }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Balance</h1>
          <p style={{ color: "#6b7280", fontSize: 14 }}>Your RFID card balance and payment summary.</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 16px", borderRadius: 9,
          background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)",
          color: "#f5a623", fontSize: 13, fontWeight: 500, cursor: "pointer",
          opacity: refreshing ? 0.6 : 1, transition: "opacity 0.2s", fontFamily: "inherit",
        }}>
          <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

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

      {!user?.rfidUid && !loading && (
        <div className="fade-up" style={{
          background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.18)",
          borderRadius: 12, padding: "20px 24px", marginBottom: 24,
          display: "flex", gap: 16, alignItems: "center",
        }}>
          <AlertCircle size={22} color="#f5a623" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>No RFID card linked</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Go to Overview to register your RFID card before rides are tracked.</div>
          </div>
        </div>
      )}

      {/* Balance hero */}
      <div className="fade-up delay-1" style={{
        background: "linear-gradient(135deg,#1e2a1a,#1a2510)",
        border: "1px solid rgba(34,197,94,0.2)", borderRadius: 16,
        padding: "32px 36px", marginBottom: 24, position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -60, top: -60, width: 240, height: 240, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)",
        }} />
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>Available Balance</div>
        <div style={{ fontFamily: "Syne,sans-serif", fontSize: 52, fontWeight: 800, color: "#22c55e", lineHeight: 1 }}>
          {loading ? "—" : `₱${user?.balance?.toFixed(2) ?? "0.00"}`}
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 12 }}>
          RFID: <span style={{ fontFamily: "monospace", color: "#9ca3af" }}>{user?.rfidUid ?? "Not registered"}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="fade-up delay-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={card}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <TrendingDown size={17} color="#ef4444" />
            <span style={{ fontSize: 13, color: "#6b7280" }}>Total Spent</span>
          </div>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, color: "#ef4444" }}>
            {loading ? "—" : `₱${spent.toFixed(2)}`}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            {loading ? "" : `${paidTx.length} successful ride${paidTx.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        <div style={card}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <CheckCircle2 size={17} color="#22c55e" />
            <span style={{ fontSize: 13, color: "#6b7280" }}>Avg. Fare</span>
          </div>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700 }}>
            {loading ? "—" : `₱${avgFare.toFixed(2)}`}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>per ride</div>
        </div>

        <div style={card}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <AlertCircle size={17} color="#ef4444" />
            <span style={{ fontSize: 13, color: "#6b7280" }}>Failed Rides</span>
          </div>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, color: "#ef4444" }}>
            {loading ? "—" : transactions.filter(t => t.status === "FAILED").length}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>insufficient balance</div>
        </div>
      </div>

      {/* Recent activity */}
      {!loading && recent.length > 0 && (
        <div className="fade-up delay-3" style={{ ...card, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, fontFamily: "Syne,sans-serif" }}>Recent Activity</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {recent.map((tx, i) => (
              <div key={tx.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 0",
                borderBottom: i < recent.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: tx.status === "PAID" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {tx.status === "PAID"
                      ? <CheckCircle2 size={15} color="#22c55e" />
                      : <AlertCircle size={15} color="#ef4444" />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.route}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {new Date(tx.timestamp).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 700, color: tx.status === "PAID" ? "#f5a623" : "#ef4444" }}>
                  {tx.status === "PAID" ? `-₱${tx.amount}` : "FAILED"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && transactions.length === 0 && user?.rfidUid && (
        <div className="fade-up delay-3" style={{
          ...card, marginBottom: 24, textAlign: "center", padding: "40px 24px",
        }}>
          <Wallet size={36} color="#374151" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: "#6b7280" }}>No rides yet. Start tapping your card to see your history here.</div>
        </div>
      )}

      {/* Top-up notice */}
      <div className="fade-up delay-4" style={{
        background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)",
        borderRadius: 12, padding: "20px 24px", display: "flex", gap: 16, alignItems: "center",
      }}>
        <Wallet size={22} color="#f5a623" />
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>Need to top up?</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            Visit any authorized Timbol RFID loading station in Calbayog City, or contact your barangay coordinator.
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
