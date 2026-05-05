"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { CheckCircle2, Wallet, ArrowRight, Zap } from "lucide-react";

export default function TopUpSuccessPage() {
  const router             = useRouter();
  const params             = useSearchParams();
  const { refreshProfile } = useAuth();
  const refreshed          = useRef(false);

  const amount = params.get("amount");

  useEffect(() => {
    if (refreshed.current) return;
    refreshed.current = true;
    // Fire and forget — refresh balance in background
    refreshProfile().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight: "100vh", background: "#0c0f14",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      {/* Brand top-left */}
      <div style={{ position: "fixed", top: 24, left: 28, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "linear-gradient(135deg,#f5a623,#e8813a)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Zap size={18} color="#fff" fill="#fff" />
        </div>
        <div>
          <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: "-0.5px" }}>Timbol RFID</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>CALBAYOG CITY</div>
        </div>
      </div>

      <div style={{
        width: "100%", maxWidth: 480,
        background: "#181d2a",
        border: "1px solid rgba(34,197,94,0.2)",
        borderRadius: 20,
        padding: "52px 40px",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", gap: 22,
      }}>
        {/* Success icon */}
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: "rgba(34,197,94,0.12)",
          border: "1px solid rgba(34,197,94,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CheckCircle2 size={40} color="#22c55e" />
        </div>

        <div>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
            Payment Successful!
          </div>
          {amount && (
            <div style={{
              fontFamily: "Syne,sans-serif", fontSize: 36, fontWeight: 800,
              color: "#22c55e", marginBottom: 10, lineHeight: 1,
            }}>
              ₱{Number(amount).toFixed(2)}
            </div>
          )}
          <div style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.7 }}>
            Your GCash payment was confirmed.<br />
            Your RFID wallet has been credited instantly.
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(34,197,94,0.06)",
          border: "1px solid rgba(34,197,94,0.18)",
          borderRadius: 12, padding: "14px 22px",
          fontSize: 13, color: "#22c55e", width: "100%",
          justifyContent: "center",
        }}>
          <Wallet size={16} color="#22c55e" />
          Balance updated — ready to ride!
        </div>

        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <button
            onClick={() => router.push("/dashboard/topup")}
            style={{
              flex: 1, padding: "13px",
              background: "#1a1f2e",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              color: "#9ca3af", fontSize: 14,
              fontFamily: "Syne,sans-serif",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            Top up again
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              flex: 1, padding: "13px",
              background: "linear-gradient(135deg,#f5a623,#e8813a)",
              border: "none", borderRadius: 12,
              color: "#fff", fontSize: 14, fontWeight: 700,
              fontFamily: "Syne,sans-serif", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(245,166,35,0.3)",
            }}
          >
            Dashboard <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}