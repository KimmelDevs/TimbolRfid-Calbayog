"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { MapPin, CheckCircle2, XCircle, AlertCircle, History } from "lucide-react";

interface Transaction {
  id: string;
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

export default function HistoryPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.rfidUid) { setLoading(false); return; }
    (async () => {
      const { data, error: dbErr } = await supabase
        .from("transactions")
        .select("id, amount, status, lat, lng, timestamp, route")
        .eq("uid", user.rfidUid)
        .order("timestamp", { ascending: false });
      if (dbErr) setError(dbErr.message);
      else setTransactions(data ?? []);
      setLoading(false);
    })();
  }, [user?.rfidUid]);

  return (
    <div style={{ padding: "36px 40px" }}>
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Ride History</h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>All your trips on Timbol vehicles.</p>
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
        <div style={{
          background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.18)",
          borderRadius: 12, padding: "20px 24px", display: "flex", gap: 16, alignItems: "center",
        }}>
          <AlertCircle size={22} color="#f5a623" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>No RFID card linked</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Register your card on the Overview page to start tracking rides.</div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, padding: "18px 22px", height: 72,
              animation: "pulse 1.5s ease infinite",
            }} />
          ))}
        </div>
      )}

      {!loading && transactions.length === 0 && user?.rfidUid && (
        <div style={{
          background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12, padding: "60px 24px", textAlign: "center",
        }}>
          <History size={40} color="#374151" style={{ marginBottom: 14 }} />
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>No rides yet</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Your tap history will appear here after your first ride.</div>
        </div>
      )}

      {!loading && transactions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {transactions.map((tx, i) => (
            <div key={tx.id} className={`fade-up delay-${Math.min(i + 1, 5)}`} style={{
              background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, padding: "18px 22px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: tx.status === "PAID" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {tx.status === "PAID"
                    ? <CheckCircle2 size={20} color="#22c55e" />
                    : <XCircle size={20} color="#ef4444" />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{tx.route}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{formatDateTime(tx.timestamp)}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {tx.lat && tx.lng && (
                  <a
                    href={`https://www.google.com/maps?q=${tx.lat},${tx.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#3b82f6", textDecoration: "none" }}
                  >
                    <MapPin size={13} />{tx.lat.toFixed(4)}, {tx.lng.toFixed(4)}
                  </a>
                )}
                <div style={{
                  fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 700,
                  color: tx.status === "PAID" ? "#f5a623" : "#ef4444",
                  minWidth: 72, textAlign: "right",
                }}>
                  {tx.status === "PAID" ? `-₱${tx.amount}` : "FAILED"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
