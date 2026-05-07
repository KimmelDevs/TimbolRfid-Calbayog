"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { MapPin, ExternalLink, AlertCircle, Navigation } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  status: "PAID" | "FAILED";
  lat: number;
  lng: number;
  created_at: string;
  route: string;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function LocationsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.rfidUid) { setLoading(false); return; }
    (async () => {
      const { data, error: dbErr } = await supabaseAdmin
        .from("fare")
        .select("id, amount, status, lat, lng, created_at, route")
        .eq("rfid_uid", user.rfidUid)
        .not("lat", "is", null)
        .not("lng", "is", null)
        .order("created_at", { ascending: false });
      if (dbErr) setError(dbErr.message);
      else setTransactions(data ?? []);
      setLoading(false);
    })();
  }, [user?.rfidUid]);

  return (
    <div style={{ padding: "36px 40px" }}>
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Tap Locations</h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>GPS coordinates recorded when you tapped your card.</p>
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
            <div style={{ fontSize: 13, color: "#6b7280" }}>Register your card on the Overview page to track tap locations.</div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ height: 140, background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s ease infinite" }} />
              <div style={{ padding: "16px 18px" }}>
                <div style={{ height: 14, background: "rgba(255,255,255,0.05)", borderRadius: 4, marginBottom: 8, animation: "pulse 1.5s ease infinite" }} />
                <div style={{ height: 12, background: "rgba(255,255,255,0.03)", borderRadius: 4, width: "60%", animation: "pulse 1.5s ease infinite" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && transactions.length === 0 && user?.rfidUid && (
        <div style={{
          background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12, padding: "60px 24px", textAlign: "center",
        }}>
          <Navigation size={40} color="#374151" style={{ marginBottom: 14 }} />
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>No GPS data yet</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Location data from your taps will appear here.</div>
        </div>
      )}

      {!loading && transactions.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {transactions.map((tx, i) => (
            <div key={tx.id} className={`fade-up delay-${Math.min(i + 1, 5)}`} style={{
              background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, overflow: "hidden",
            }}>
              <div style={{ height: 140, position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#1e2435,#252d40)" }}>
                <iframe
                  title={`map-${tx.id}`}
                  width="100%" height="140"
                  style={{ border: "none", display: "block", opacity: 0.85 }}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${tx.lng - 0.005},${tx.lat - 0.005},${tx.lng + 0.005},${tx.lat + 0.005}&layer=mapnik&marker=${tx.lat},${tx.lng}`}
                  loading="lazy"
                />
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: tx.status === "PAID" ? "rgba(34,197,94,0.85)" : "rgba(239,68,68,0.85)",
                  color: "#fff", fontFamily: "Syne,sans-serif", backdropFilter: "blur(4px)",
                }}>
                  {tx.status}
                </div>
              </div>
              <div style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{tx.route}</div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
                  {tx.lat.toFixed(6)}, {tx.lng.toFixed(6)}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{formatDateTime(tx.created_at)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 700, fontFamily: "Syne,sans-serif",
                      color: tx.status === "PAID" ? "#f5a623" : "#ef4444",
                    }}>
                      {tx.status === "PAID" ? `₱${tx.amount}` : "FAILED"}
                    </span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${tx.lat}&mlon=${tx.lng}#map=15/${tx.lat}/${tx.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        fontSize: 12, color: "#3b82f6", textDecoration: "none",
                        padding: "5px 10px", background: "rgba(59,130,246,0.1)", borderRadius: 6,
                      }}
                    >
                      <MapPin size={11} /> Open <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}