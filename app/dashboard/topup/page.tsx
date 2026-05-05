"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  Wallet, Zap, AlertCircle, ArrowRight, CheckCircle2,
  CreditCard, Shield, Clock,
} from "lucide-react";

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];

type Step = "select" | "redirecting";

export default function TopUpPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [amount,      setAmount]      = useState<number | "">("");
  const [customInput, setCustomInput] = useState("");
  const [step,        setStep]        = useState<Step>("select");
  const [error,       setError]       = useState("");

  const selectedAmount = amount !== "" ? amount : null;

  const handlePreset = (val: number) => {
    setAmount(val);
    setCustomInput("");
    setError("");
  };

  const handleCustom = (raw: string) => {
    setCustomInput(raw);
    const n = parseFloat(raw);
    setAmount(isNaN(n) ? "" : n);
    setError("");
  };

  const handleTopUp = async () => {
    const pesos = Number(selectedAmount);
    if (!pesos || pesos < 50 || pesos > 5000) {
      setError("Please enter an amount between ₱50 and ₱5,000.");
      return;
    }
    if (!user?.id) {
      setError("Not logged in.");
      return;
    }

    setError("");
    setStep("redirecting");

    try {
      const res = await fetch("/api/topup/create-link", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: user.id, amount: pesos }),
      });

      const json = await res.json();

      if (!res.ok || !json.checkoutUrl) {
        setError(json.error ?? "Failed to create payment link.");
        setStep("select");
        return;
      }

      // Redirect to PayMongo checkout
      window.location.href = json.checkoutUrl;
    } catch {
      setError("Network error. Please try again.");
      setStep("select");
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const card = {
    background:   "#181d2a",
    border:       "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding:      "22px 24px",
  } as const;

  if (step === "redirecting") {
    return (
      <div style={{ padding: "36px 40px", maxWidth: 520 }}>
        <div style={{
          ...card,
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", padding: "56px 40px", gap: 20,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "rgba(245,166,35,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={28} color="#f5a623" fill="#f5a623" />
          </div>
          <div>
            <div style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Redirecting to PayMongo…
            </div>
            <div style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
              You&apos;re being sent to our secure payment page.<br />
              Do not close this tab.
            </div>
          </div>
          <div style={{
            display: "flex", gap: 8, marginTop: 8,
            color: "#6b7280", fontSize: 13, alignItems: "center",
          }}>
            <Shield size={14} color="#22c55e" />
            Secured by PayMongo
          </div>
          <div className="spinner" style={{
            width: 24, height: 24, borderRadius: "50%",
            border: "2px solid rgba(245,166,35,0.2)",
            borderTopColor: "#f5a623",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "36px 40px", maxWidth: 560 }}>

      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
          Top Up Balance
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          Add funds to your RFID card via PayMongo. Credited instantly after payment.
        </p>
      </div>

      {/* Current balance */}
      <div className="fade-up delay-1" style={{
        ...card,
        background: "linear-gradient(135deg,#1a2218,#141d12)",
        border: "1px solid rgba(34,197,94,0.18)",
        marginBottom: 20, display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "rgba(34,197,94,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Wallet size={20} color="#22c55e" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Current Balance</div>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: 28, fontWeight: 800, color: "#22c55e", lineHeight: 1 }}>
            ₱{user?.balance?.toFixed(2) ?? "0.00"}
          </div>
        </div>
      </div>

      {/* Amount selector */}
      <div className="fade-up delay-2" style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "Syne,sans-serif", marginBottom: 16 }}>
          Select Amount
        </div>

        {/* Preset buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 }}>
          {PRESET_AMOUNTS.map(p => (
            <button
              key={p}
              onClick={() => handlePreset(p)}
              style={{
                padding: "12px 0",
                border:  amount === p
                  ? "1px solid rgba(245,166,35,0.6)"
                  : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                background:   amount === p ? "rgba(245,166,35,0.12)" : "#1a1f2e",
                color:        amount === p ? "#f5a623" : "#9ca3af",
                fontSize:     14,
                fontWeight:   amount === p ? 700 : 400,
                fontFamily:   "Syne,sans-serif",
                cursor:       "pointer",
                transition:   "all 0.15s",
              }}
            >
              ₱{p}
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div>
          <label style={{ fontSize: 13, color: "#6b7280", display: "block", marginBottom: 6 }}>
            Or enter a custom amount (₱50 – ₱5,000)
          </label>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              fontSize: 15, color: "#6b7280", pointerEvents: "none",
            }}>₱</span>
            <input
              type="number"
              min={50}
              max={5000}
              value={customInput}
              onChange={e => handleCustom(e.target.value)}
              placeholder="0.00"
              style={{
                width: "100%", padding: "13px 16px 13px 30px",
                background: "#1a1f2e",
                border: customInput
                  ? "1px solid rgba(245,166,35,0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, color: "#f0f2f5",
                fontSize: 15, outline: "none",
                boxSizing: "border-box",
                fontFamily: "Syne,sans-serif",
                transition: "border-color 0.2s",
              }}
              onFocus={e  => e.target.style.borderColor = "rgba(245,166,35,0.5)"}
              onBlur={e   => e.target.style.borderColor = customInput ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.08)"}
            />
          </div>
        </div>
      </div>

      {/* What you'll get */}
      {selectedAmount !== null && selectedAmount >= 50 && (
        <div className="fade-up" style={{
          ...card,
          background: "rgba(245,166,35,0.05)",
          border: "1px solid rgba(245,166,35,0.18)",
          marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>After top-up your balance will be</div>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 700, color: "#f5a623" }}>
            ₱{((user?.balance ?? 0) + selectedAmount).toFixed(2)}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16,
          fontSize: 13, color: "#ef4444",
        }} role="alert">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleTopUp}
        disabled={!selectedAmount || Number(selectedAmount) < 50}
        style={{
          width: "100%", padding: "15px",
          background: (!selectedAmount || Number(selectedAmount) < 50)
            ? "#1a1f2e"
            : "linear-gradient(135deg,#f5a623,#e8813a)",
          border: "none", borderRadius: 12,
          color: (!selectedAmount || Number(selectedAmount) < 50) ? "#374151" : "#fff",
          fontSize: 15, fontWeight: 700,
          fontFamily: "Syne,sans-serif",
          cursor: (!selectedAmount || Number(selectedAmount) < 50) ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          boxShadow: (!selectedAmount || Number(selectedAmount) < 50)
            ? "none"
            : "0 4px 24px rgba(245,166,35,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          marginBottom: 20,
        }}
      >
        Pay {selectedAmount ? `₱${Number(selectedAmount).toFixed(2)}` : ""} via PayMongo
        <ArrowRight size={18} />
      </button>

      {/* Trust badges */}
      <div style={{
        display: "flex", justifyContent: "center", gap: 24,
        fontSize: 12, color: "#4b5563",
      }}>
        {[
          [Shield,      "Secure payment"],
          [CheckCircle2,"Instant credit"],
          [Clock,       "24/7 available"],
          [CreditCard,  "Cards & e-wallets"],
        ].map(([Icon, label]) => (
          <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {/* @ts-expect-error Icon is a valid component */}
            <Icon size={13} color="#6b7280" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
