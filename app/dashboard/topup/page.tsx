"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useMqtt } from "@/lib/UseMqtt";
import {
  Wallet, Zap, AlertCircle, ArrowRight, Shield, CheckCircle2,
  Clock, CreditCard, X, Wifi, WifiOff, Loader2,
} from "lucide-react";

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];
const MQTT_TOPIC     = "timbol/rfid/scan";

interface UserSuggestion {
  id:        string;
  full_name: string;
  rfid_uid:  string;
  balance:   number;
}

type Step = "select" | "redirecting";

export default function TopUpPage() {
  const { user } = useAuth();

  // ── Amount state ──────────────────────────────────────────────────────────
  const [amount,      setAmount]      = useState<number | "">("");
  const [customInput, setCustomInput] = useState("");
  const [step,        setStep]        = useState<Step>("select");
  const [error,       setError]       = useState("");

  // ── RFID / user-search state ──────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<UserSuggestion | null>(null);
  const [nameQuery,    setNameQuery]    = useState("");
  const [suggestions,  setSuggestions]  = useState<UserSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scanFlash,    setScanFlash]    = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin    = user?.role === "admin";
  const targetUser = isAdmin ? selectedUser : (user as unknown as UserSuggestion | null);

  // ── MQTT scan ─────────────────────────────────────────────────────────────
  const handleScan = useCallback(async (payload: string) => {
    const uid = payload.replace(/:/g, "").toUpperCase().trim();
    if (!uid) return;
    const { data } = await supabase
      .from("jeepneyriders")
      .select("id, full_name, rfid_uid, balance")
      .eq("rfid_uid", uid)
      .single();
    if (data) {
      setSelectedUser(data as UserSuggestion);
      setNameQuery(data.full_name);
      setScanFlash(true);
      setTimeout(() => setScanFlash(false), 1500);
      setError("");
    } else {
      setError("Card not found. Make sure the resident is registered.");
    }
  }, []);

  const { status: mqttStatus } = useMqtt({
    topic:     MQTT_TOPIC,
    onMessage: handleScan,
    enabled:   isAdmin,
  });

  // ── Name autocomplete (admin only) ────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    const q = nameQuery.trim();
    if (!q || selectedUser) { setSuggestions([]); setShowDropdown(false); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("jeepneyriders")
        .select("id, full_name, rfid_uid, balance")
        .ilike("full_name", `%${q}%`)
        .limit(6);
      if (data && data.length) { setSuggestions(data as UserSuggestion[]); setShowDropdown(true); }
      else { setSuggestions([]); setShowDropdown(false); }
    }, 200);
    return () => clearTimeout(t);
  }, [nameQuery, selectedUser, isAdmin]);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function selectSuggestion(u: UserSuggestion) {
    setSelectedUser(u); setNameQuery(u.full_name); setShowDropdown(false); setError("");
  }
  function clearUser() { setSelectedUser(null); setNameQuery(""); setSuggestions([]); }

  // ── Amount helpers ────────────────────────────────────────────────────────
  const handlePreset = (val: number) => { setAmount(val); setCustomInput(""); setError(""); };
  const handleCustom = (raw: string) => {
    setCustomInput(raw);
    const n = parseFloat(raw);
    setAmount(isNaN(n) ? "" : n);
    setError("");
  };
  const selectedAmount = amount !== "" ? (amount as number) : null;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleTopUp = async () => {
    const pesos = Number(selectedAmount);
    if (!pesos || pesos < 50 || pesos > 5000) {
      setError("Please enter an amount between ₱50 and ₱5,000."); return;
    }
    const uid = isAdmin ? targetUser?.id : user?.id;
    if (!uid) { setError("No user selected."); return; }

    setError(""); setStep("redirecting");
    try {
      const res  = await fetch("/api/topup/create-link", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: uid, amount: pesos }),
      });
      const json = await res.json();
      if (!res.ok || !json.checkoutUrl) {
        setError(json.error ?? "Failed to create payment link."); setStep("select"); return;
      }
      window.location.href = json.checkoutUrl;
    } catch {
      setError("Network error. Please try again."); setStep("select");
    }
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const card = {
    background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "22px 24px",
  } as const;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 16px",
    background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "#f0f2f5", fontSize: 14, outline: "none",
    boxSizing: "border-box", fontFamily: "Syne,sans-serif", transition: "border-color 0.2s",
  };

  const disabledPay =
    !selectedAmount || Number(selectedAmount) < 50 || (isAdmin && !selectedUser);

  // ── Redirecting screen ────────────────────────────────────────────────────
  if (step === "redirecting") {
    return (
      <div style={{ padding: "36px 40px", maxWidth: 520 }}>
        <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "56px 40px", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(245,166,35,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={28} color="#f5a623" fill="#f5a623" />
          </div>
          <div>
            <div style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Redirecting to PayMongo…</div>
            <div style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
              You&apos;re being sent to our secure payment page.<br />Do not close this tab.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, color: "#6b7280", fontSize: 13, alignItems: "center" }}>
            <Shield size={14} color="#22c55e" /> Secured by PayMongo
          </div>
          <Loader2 size={24} color="#f5a623" style={{ animation: "spin 0.8s linear infinite" }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── MQTT status pill vars ─────────────────────────────────────────────────
  const statusColor =
    mqttStatus === "connected" ? "#22c55e" :
    mqttStatus === "error"     ? "#ef4444" : "#f5a623";
  const statusLabel =
    mqttStatus === "connected"  ? "Ready — tap card or search by name" :
    mqttStatus === "connecting" ? "Connecting to scanner…" :
    mqttStatus === "error"      ? "Scanner error" : "Scanner disconnected";

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "36px 40px", maxWidth: 600 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Top Up Balance</h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Add funds to your RFID wallet via PayMongo. Credited instantly after payment.</p>
      </div>

      {/* Current balance */}
      <div style={{ ...card, background: "linear-gradient(135deg,#1a2218,#141d12)", border: "1px solid rgba(34,197,94,0.18)", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Wallet size={20} color="#22c55e" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>
            {isAdmin && selectedUser ? `${selectedUser.full_name}'s Balance` : "Current Balance"}
          </div>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: 28, fontWeight: 800, color: "#22c55e", lineHeight: 1 }}>
            ₱{(isAdmin ? (selectedUser?.balance ?? 0) : (user?.balance ?? 0)).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Admin: RFID scan + user search */}
      {isAdmin && (
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "Syne,sans-serif", marginBottom: 14 }}>Select Resident</div>

          {/* MQTT status bar */}
          <div style={{ marginBottom: 14, padding: "9px 14px", borderRadius: 8, background: mqttStatus === "connected" ? "rgba(34,197,94,0.06)" : "rgba(245,166,35,0.06)", border: `1px solid ${statusColor}30`, fontSize: 12, color: statusColor, display: "flex", alignItems: "center", gap: 7 }}>
            {mqttStatus === "connected" ? <Wifi size={12} color={statusColor} /> : <WifiOff size={12} color={statusColor} />}
            {statusLabel}
          </div>

          {/* Name search */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle, border: scanFlash ? "1px solid rgba(34,197,94,0.6)" : "1px solid rgba(255,255,255,0.08)", background: scanFlash ? "rgba(34,197,94,0.06)" : "#1a1f2e", transition: "all 0.3s", paddingRight: selectedUser ? 38 : 16 }}
                placeholder="Tap RFID card or search by name…"
                value={nameQuery}
                autoComplete="off"
                onChange={e => { setNameQuery(e.target.value); if (selectedUser) setSelectedUser(null); }}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              />
              {selectedUser && (
                <button onClick={clearUser} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }}>
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 4, background: "#181d2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", overflow: "hidden" }}>
                {suggestions.map((u, i) => (
                  <div
                    key={u.id}
                    onMouseDown={() => selectSuggestion(u)}
                    style={{ padding: "11px 14px", cursor: "pointer", borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", flexDirection: "column", gap: 2 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#1a1f2e")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f2f5" }}>{u.full_name}</span>
                    <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>UID: {u.rfid_uid} · ₱{u.balance?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Confirmed badge */}
            {selectedUser && (
              <div style={{ marginTop: 10, padding: "9px 14px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8, fontSize: 12, color: "#22c55e", display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={13} color="#22c55e" />
                <span>
                  <strong>{selectedUser.full_name}</strong>&nbsp;·&nbsp;
                  <span style={{ fontFamily: "monospace", color: "#6b7280" }}>{selectedUser.rfid_uid}</span>
                  {scanFlash && <span style={{ marginLeft: 6, opacity: 0.7 }}> Card scanned!</span>}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Amount selector */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "Syne,sans-serif", marginBottom: 16 }}>Select Amount</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 }}>
          {PRESET_AMOUNTS.map(p => (
            <button key={p} onClick={() => handlePreset(p)} style={{ padding: "12px 0", border: amount === p ? "1px solid rgba(245,166,35,0.6)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 10, background: amount === p ? "rgba(245,166,35,0.12)" : "#1a1f2e", color: amount === p ? "#f5a623" : "#9ca3af", fontSize: 14, fontWeight: amount === p ? 700 : 400, fontFamily: "Syne,sans-serif", cursor: "pointer", transition: "all 0.15s" }}>
              ₱{p}
            </button>
          ))}
        </div>

        <div>
          <label style={{ fontSize: 13, color: "#6b7280", display: "block", marginBottom: 6 }}>Or enter a custom amount (₱50 – ₱5,000)</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#6b7280", pointerEvents: "none" }}>₱</span>
            <input
              type="number" min={50} max={5000}
              value={customInput}
              onChange={e => handleCustom(e.target.value)}
              placeholder="0.00"
              style={{ ...inputStyle, paddingLeft: 30, border: customInput ? "1px solid rgba(245,166,35,0.4)" : "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e  => (e.target.style.borderColor = "rgba(245,166,35,0.5)")}
              onBlur={e   => (e.target.style.borderColor = customInput ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.08)")}
            />
          </div>
        </div>
      </div>

      {/* After top-up preview */}
      {selectedAmount !== null && selectedAmount >= 50 && (
        <div style={{ ...card, background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.18)", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>After top-up, balance will be</div>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 700, color: "#f5a623" }}>
            ₱{((isAdmin ? (selectedUser?.balance ?? 0) : (user?.balance ?? 0)) + selectedAmount).toFixed(2)}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#ef4444" }} role="alert">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleTopUp}
        disabled={disabledPay}
        style={{ width: "100%", padding: "15px", background: disabledPay ? "#1a1f2e" : "linear-gradient(135deg,#f5a623,#e8813a)", border: "none", borderRadius: 12, color: disabledPay ? "#374151" : "#fff", fontSize: 15, fontWeight: 700, fontFamily: "Syne,sans-serif", cursor: disabledPay ? "not-allowed" : "pointer", transition: "all 0.2s", boxShadow: disabledPay ? "none" : "0 4px 24px rgba(245,166,35,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}
      >
        Pay {selectedAmount ? `₱${Number(selectedAmount).toFixed(2)}` : ""} via PayMongo
        <ArrowRight size={18} />
      </button>

      {/* Trust badges */}
      <div style={{ display: "flex", justifyContent: "center", gap: 24, fontSize: 12, color: "#4b5563" }}>
        {([
          [Shield, "Secure payment"], [CheckCircle2, "Instant credit"],
          [Clock, "24/7 available"], [CreditCard, "Cards & e-wallets"],
        ] as const).map(([Icon, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Icon size={13} color="#6b7280" />{label}
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}