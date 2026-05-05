"use client";
import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { User, Mail, CreditCard, Wallet, Camera, CheckCircle2, AlertCircle, Lock, Eye, EyeOff } from "lucide-react";

type SaveState = "idle" | "saving" | "success" | "error";

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();

  // Avatar
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarSave, setAvatarSave] = useState<SaveState>("idle");
  const [avatarMsg, setAvatarMsg] = useState("");

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [pwSave, setPwSave]       = useState<SaveState>("idle");
  const [pwMsg, setPwMsg]         = useState("");

  // ── Avatar upload ────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarSave("saving");
    setAvatarMsg("");

    try {
      // Upload to Supabase Storage bucket "avatars"
      const ext  = file.name.split(".").pop();
      const path = `${user.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw new Error(upErr.message);

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: dbErr } = await supabase
        .from("jeepneyriders")
        .update({ avatar: publicUrl })
        .eq("id", user.id);
      if (dbErr) throw new Error(dbErr.message);

      await refreshProfile();
      setAvatarSave("success");
      setAvatarMsg("Profile photo updated.");
    } catch (err: any) {
      setAvatarSave("error");
      setAvatarMsg(err.message ?? "Upload failed.");
    }
  };

  // ── Password change ──────────────────────────────────────────────────────
  const handlePasswordChange = async () => {
    if (!newPw || newPw !== confirmPw) {
      setPwSave("error");
      setPwMsg("New passwords do not match.");
      return;
    }
    if (newPw.length < 8) {
      setPwSave("error");
      setPwMsg("Password must be at least 8 characters.");
      return;
    }
    setPwSave("saving");
    setPwMsg("");
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw new Error(error.message);
      setPwSave("success");
      setPwMsg("Password updated successfully.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      setPwSave("error");
      setPwMsg(err.message ?? "Failed to update password.");
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────────
  const card = {
    background: "#181d2a",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: "28px 30px",
    marginBottom: 20,
  } as const;

  const inputStyle = {
    width: "100%", padding: "10px 14px",
    background: "#0f1320", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 9, color: "#f0f2f5", fontSize: 14, outline: "none",
    fontFamily: "inherit",
  } as const;

  const labelStyle = { fontSize: 13, color: "#9ca3af", marginBottom: 6, display: "block" } as const;

  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "??";

  return (
    <div style={{ padding: "36px 40px", maxWidth: 680 }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Profile</h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Manage your account details and security.</p>
      </div>

      {/* Avatar + identity card */}
      <div className="fade-up delay-1" style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 28 }}>
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", overflow: "hidden",
              border: "2px solid rgba(245,166,35,0.3)",
              background: "#0f1320", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 22, color: "#f5a623" }}>{initials}</span>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                position: "absolute", bottom: -2, right: -2,
                width: 26, height: 26, borderRadius: "50%",
                background: "#f5a623", border: "2px solid #0c0f14",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Camera size={12} color="#000" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          </div>

          <div>
            <div style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>{user?.email}</div>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#f5a623",
              textTransform: "uppercase", letterSpacing: "0.06em",
              background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)",
              padding: "3px 8px", borderRadius: 6, fontFamily: "Syne,sans-serif",
            }}>{user?.role}</span>
          </div>
        </div>

        {/* Avatar feedback */}
        {avatarSave !== "idle" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
            padding: "10px 14px", borderRadius: 9,
            background: avatarSave === "success" ? "rgba(34,197,94,0.08)" : avatarSave === "error" ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${avatarSave === "success" ? "rgba(34,197,94,0.2)" : avatarSave === "error" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
          }}>
            {avatarSave === "saving" && <div style={{ width: 14, height: 14, border: "2px solid #9ca3af", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
            {avatarSave === "success" && <CheckCircle2 size={14} color="#22c55e" />}
            {avatarSave === "error"   && <AlertCircle  size={14} color="#ef4444" />}
            <span style={{ fontSize: 13, color: avatarSave === "success" ? "#22c55e" : avatarSave === "error" ? "#ef4444" : "#9ca3af" }}>
              {avatarSave === "saving" ? "Uploading…" : avatarMsg}
            </span>
          </div>
        )}

        {/* Read-only info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}><Mail size={12} style={{ display: "inline", marginRight: 6 }} />Email</label>
            <div style={{ ...inputStyle, color: "#6b7280", cursor: "not-allowed" }}>{user?.email}</div>
          </div>
          <div>
            <label style={labelStyle}><User size={12} style={{ display: "inline", marginRight: 6 }} />Full Name</label>
            <div style={{ ...inputStyle, color: "#6b7280", cursor: "not-allowed" }}>{user?.name}</div>
          </div>
          <div>
            <label style={labelStyle}><CreditCard size={12} style={{ display: "inline", marginRight: 6 }} />RFID UID</label>
            <div style={{ ...inputStyle, color: "#9ca3af", fontFamily: "monospace", cursor: "not-allowed" }}>
              {user?.rfidUid ?? "Not registered"}
            </div>
          </div>
          <div>
            <label style={labelStyle}><Wallet size={12} style={{ display: "inline", marginRight: 6 }} />Balance</label>
            <div style={{ ...inputStyle, color: "#22c55e", fontFamily: "Syne,sans-serif", fontWeight: 700, cursor: "not-allowed" }}>
              ₱{user?.balance?.toFixed(2) ?? "0.00"}
            </div>
          </div>
        </div>
      </div>

      {/* Change password card */}
      <div className="fade-up delay-2" style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Lock size={17} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Change Password</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Update your login password.</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ position: "relative" }}>
            <label style={labelStyle}>New Password</label>
            <input
              type={showPw ? "text" : "password"}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="Min. 8 characters"
              style={inputStyle}
            />
            <button onClick={() => setShowPw(v => !v)} style={{
              position: "absolute", right: 12, bottom: 10,
              background: "none", border: "none", cursor: "pointer", color: "#6b7280",
            }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type={showPw ? "text" : "password"}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              style={{
                ...inputStyle,
                borderColor: confirmPw && confirmPw !== newPw ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)",
              }}
            />
          </div>
        </div>

        {/* Password feedback */}
        {pwSave !== "idle" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginTop: 14,
            padding: "10px 14px", borderRadius: 9,
            background: pwSave === "success" ? "rgba(34,197,94,0.08)" : pwSave === "error" ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${pwSave === "success" ? "rgba(34,197,94,0.2)" : pwSave === "error" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
          }}>
            {pwSave === "saving"  && <div style={{ width: 14, height: 14, border: "2px solid #9ca3af", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
            {pwSave === "success" && <CheckCircle2 size={14} color="#22c55e" />}
            {pwSave === "error"   && <AlertCircle  size={14} color="#ef4444" />}
            <span style={{ fontSize: 13, color: pwSave === "success" ? "#22c55e" : pwSave === "error" ? "#ef4444" : "#9ca3af" }}>
              {pwSave === "saving" ? "Updating…" : pwMsg}
            </span>
          </div>
        )}

        <button
          onClick={handlePasswordChange}
          disabled={!newPw || pwSave === "saving"}
          style={{
            marginTop: 18, padding: "11px 24px", borderRadius: 9,
            background: "#3b82f6", border: "none", color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            opacity: !newPw || pwSave === "saving" ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {pwSave === "saving" ? "Updating…" : "Update Password"}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
