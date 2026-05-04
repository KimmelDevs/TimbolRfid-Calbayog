"use client";
import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useMqtt } from "@/lib/UseMqtt";
import { supabase } from "@/lib/supabase";
import StatCard from "@/components/StatCard";
import { Wallet, CreditCard, Wifi, CheckCircle2, XCircle, Loader2 } from "lucide-react";

// The topic your ESP32 publishes to
const RFID_TOPIC = "esp32/rfid/gps";

type RegisterState = "idle" | "waiting" | "success" | "error";

export default function DashboardPage() {
  const { user, refreshProfile } = useAuth();

  const [registerState, setRegisterState] = useState<RegisterState>("idle");
  const [registerMsg, setRegisterMsg] = useState("");
  const [scannedUid, setScannedUid] = useState("");

  // Only connect to MQTT while we're actively waiting for a card scan
  const mqttEnabled = registerState === "waiting";

  const handleMqttMessage = useCallback(
    async (payload: string) => {
      // Ignore messages if we're not in waiting state
      if (registerState !== "waiting") return;

      let parsed: { uid?: string } = {};
      try {
        parsed = JSON.parse(payload);
      } catch {
        return; // not our message format
      }

      const uid = parsed.uid?.trim().toUpperCase();
      if (!uid || !user) return;

      setScannedUid(uid);
      setRegisterState("idle"); // stop listening immediately

      // Save UID to the resident's row in Supabase
      const { error } = await supabase
        .from("jeepneyriders")
        .update({ rfid_uid: uid })
        .eq("id", user.id);

      if (error) {
        console.error("[register] update error:", error.message);
        setRegisterMsg("Failed to save card. Please try again.");
        setRegisterState("error");
        return;
      }

      await refreshProfile(); // re-fetch so the header/balance page shows the new UID
      setRegisterMsg(`Card registered! UID: ${uid}`);
      setRegisterState("success");
    },
    [registerState, user, refreshProfile]
  );

  useMqtt({
    topic: RFID_TOPIC,
    onMessage: handleMqttMessage,
    enabled: mqttEnabled,
  });

  const startRegistration = () => {
    setRegisterState("waiting");
    setRegisterMsg("");
    setScannedUid("");
  };

  const cancelRegistration = () => {
    setRegisterState("idle");
    setRegisterMsg("");
    setScannedUid("");
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const card = {
    background: "#181d2a",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: "22px 24px",
  } as const;

  const stateColors: Record<RegisterState, string> = {
    idle: "#3b82f6",
    waiting: "#f5a623",
    success: "#22c55e",
    error: "#ef4444",
  };
  const accent = stateColors[registerState];

  return (
    <div style={{ padding: "36px 40px" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "Syne,sans-serif",
            fontSize: 26,
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          Welcome, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          Your RFID card dashboard for Timbol Jeepney.
        </p>
      </div>

      {/* Stat Cards */}
      <div
        className="fade-up delay-1"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          label="Balance"
          value={`₱${user?.balance?.toFixed(2) ?? "0.00"}`}
          sub="Available for rides"
          accent
          icon={<Wallet size={16} />}
          delay={1}
        />
        <StatCard
          label="RFID Card"
          value={user?.rfidUid ?? "Not registered"}
          sub={user?.rfidUid ? "Card linked" : "No card linked yet"}
          icon={<CreditCard size={16} />}
          delay={2}
        />
      </div>

      {/* Register Card Panel */}
      <div
        className="fade-up delay-2"
        style={{
          ...card,
          borderLeft: `3px solid ${accent}`,
          transition: "border-color 0.3s",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${accent}1a`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.3s",
            }}
          >
            {registerState === "waiting" ? (
              <Loader2 size={20} color={accent} className="spin" />
            ) : registerState === "success" ? (
              <CheckCircle2 size={20} color={accent} />
            ) : registerState === "error" ? (
              <XCircle size={20} color={accent} />
            ) : (
              <CreditCard size={20} color={accent} />
            )}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
              {user?.rfidUid ? "Replace RFID Card" : "Register RFID Card"}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              {user?.rfidUid
                ? `Current: ${user.rfidUid}`
                : "Link a physical card to your account"}
            </div>
          </div>
        </div>

        {/* State-specific message */}
        {registerState === "waiting" && (
          <div
            style={{
              background: "rgba(245,166,35,0.08)",
              border: "1px solid rgba(245,166,35,0.2)",
              borderRadius: 10,
              padding: "14px 18px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Wifi size={18} color="#f5a623" />
            <div>
              <div
                style={{ fontSize: 14, fontWeight: 500, color: "#f5a623", marginBottom: 2 }}
              >
                Waiting for card scan…
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                Tap your RFID card on the scanner now. Listening via MQTT.
              </div>
            </div>
          </div>
        )}

        {registerState === "success" && (
          <div
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 10,
              padding: "14px 18px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <CheckCircle2 size={18} color="#22c55e" />
            <div style={{ fontSize: 14, color: "#22c55e" }}>{registerMsg}</div>
          </div>
        )}

        {registerState === "error" && (
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 10,
              padding: "14px 18px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <XCircle size={18} color="#ef4444" />
            <div style={{ fontSize: 14, color: "#ef4444" }}>{registerMsg}</div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {registerState !== "waiting" ? (
            <button
              onClick={startRegistration}
              style={{
                background: accent,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLButtonElement).style.opacity = "0.85")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLButtonElement).style.opacity = "1")
              }
            >
              {registerState === "success" || registerState === "error"
                ? "Try Again"
                : user?.rfidUid
                ? "Replace Card"
                : "Register Card"}
            </button>
          ) : (
            <button
              onClick={cancelRegistration}
              style={{
                background: "transparent",
                color: "#9ca3af",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Inline spin keyframe — avoids needing a separate CSS file */}
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}