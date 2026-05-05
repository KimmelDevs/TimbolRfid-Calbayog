"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { CheckCircle2, Wallet, ArrowRight } from "lucide-react";

export default function TopUpSuccessPage() {
  const router       = useRouter();
  const params       = useSearchParams();
  const { refreshProfile } = useAuth();
  const refreshed    = useRef(false);

  const amount = params.get("amount");

  useEffect(() => {
    if (refreshed.current) return;
    refreshed.current = true;
    // Refresh balance so the sidebar/dashboard shows the new amount
    refreshProfile();
  }, [refreshProfile]);

  return (
    <div style={{ padding: "36px 40px", maxWidth: 520 }}>
      <div style={{
        background: "#181d2a",
        border: "1px solid rgba(34,197,94,0.2)",
        borderRadius: 16,
        padding: "56px 40px",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", gap: 20,
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: "rgba(34,197,94,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CheckCircle2 size={36} color="#22c55e" />
        </div>

        {/* Message */}
        <div>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Payment Successful!
          </div>
          {amount && (
            <div style={{
              fontFamily: "Syne,sans-serif", fontSize: 32, fontWeight: 800,
              color: "#22c55e", marginBottom: 8,
            }}>
              ₱{Number(amount).toFixed(2)}
            </div>
          )}
          <div style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
            Your GCash payment was confirmed.<br />
            Your RFID wallet has been credited.
          </div>
        </div>

        {/* Balance note */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(34,197,94,0.06)",
          border: "1px solid rgba(34,197,94,0.18)",
          borderRadius: 10, padding: "12px 20px",
          fontSize: 13, color: "#22c55e",
        }}>
          <Wallet size={16} color="#22c55e" />
          Balance updated — ready to ride!
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, marginTop: 4, width: "100%" }}>
          <button
            onClick={() => router.push("/dashboard/topup")}
            style={{
              flex: 1, padding: "12px",
              background: "#1a1f2e",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              color: "#9ca3af", fontSize: 14,
              fontFamily: "Syne,sans-serif",
              cursor: "pointer",
            }}
          >
            Top up again
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              flex: 1, padding: "12px",
              background: "linear-gradient(135deg,#f5a623,#e8813a)",
              border: "none", borderRadius: 10,
              color: "#fff", fontSize: 14, fontWeight: 700,
              fontFamily: "Syne,sans-serif",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(245,166,35,0.3)",
            }}
          >
            Go to Dashboard <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}