"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff, Zap, User } from "lucide-react";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setLoading(true);

    // Race signup against a 10s timeout
    const timeout = new Promise<false>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 10000)
    );

    let ok: boolean;
    try {
      ok = await Promise.race([signup(name, email, password, "resident"), timeout]);
    } catch (err) {
      setLoading(false);
      if ((err as Error).message === "timeout") {
        setError("Sign up is taking too long. Please check your connection and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }

    setLoading(false);

    if (!ok) {
      setError("Sign up failed. The email may already be in use.");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 1200);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 16px",
    background: "#1a1f2e",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    color: "#f0f2f5",
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "DM Sans, sans-serif",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ── Left panel ── */}
      <div style={{
        width: "46%", background: "#131720", display: "flex",
        flexDirection: "column", justifyContent: "center",
        padding: "60px 56px", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -100, right: -100,
          width: 360, height: 360, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,166,35,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Brand */}
        <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 64 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: "linear-gradient(135deg,#f5a623,#e8813a)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={22} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px" }}>Timbol RFID</div>
            <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: "0.05em" }}>CALBAYOG CITY</div>
          </div>
        </div>

        <h1 className="fade-up delay-1" style={{
          fontFamily: "Syne,sans-serif", fontSize: 34, fontWeight: 800,
          lineHeight: 1.2, marginBottom: 14,
          background: "linear-gradient(135deg,#f0f2f5 40%,#9ca3af)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Join the smart<br />fare network.
        </h1>
        <p className="fade-up delay-2" style={{ color: "#6b7280", fontSize: 15, lineHeight: 1.7, maxWidth: 300 }}>
          Register and start riding Timbol vehicles across Calbayog City with ease.
        </p>

        <div className="fade-up delay-3" style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            ["01", "Create your account"],
            ["02", "Link your RFID card"],
            ["03", "Top up & ride"],
          ].map(([n, t]) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(245,166,35,0.12)",
                border: "1px solid rgba(245,166,35,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#f5a623", fontFamily: "Syne,sans-serif",
              }}>{n}</div>
              <span style={{ fontSize: 14, color: "#9ca3af" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div className="fade-up" style={{ width: "100%", maxWidth: 420 }}>
          <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Create account</h2>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#f5a623", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
          </p>

          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(245,166,35,0.07)",
            border: "1px solid rgba(245,166,35,0.18)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 24,
          }}>
            <User size={18} color="#f5a623" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f5a623", fontFamily: "Syne,sans-serif" }}>Resident</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>All new accounts are registered as residents</div>
            </div>
          </div>

          {success ? (
            <div style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 12, padding: "24px 20px", textAlign: "center",
            }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
              <div style={{ fontFamily: "Syne,sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 6, color: "#22c55e" }}>
                Account created!
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                Redirecting you to your dashboard…
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: "#9ca3af", display: "block", marginBottom: 6 }}>Full name</label>
                <input
                  required value={name} onChange={e => setName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "rgba(245,166,35,0.5)"}
                  onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#9ca3af", display: "block", marginBottom: 6 }}>Email address</label>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "rgba(245,166,35,0.5)"}
                  onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#9ca3af", display: "block", marginBottom: 6 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"} required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    style={{ ...inputStyle, paddingRight: 48 }}
                    onFocus={e => e.target.style.borderColor = "rgba(245,166,35,0.5)"}
                    onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 0,
                  }}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ef4444",
                }}>{error}</div>
              )}

              <button type="submit" disabled={loading} style={{
                marginTop: 8, padding: "14px",
                background: loading ? "#2a2f40" : "linear-gradient(135deg,#f5a623,#e8813a)",
                border: "none", borderRadius: 10,
                color: loading ? "#6b7280" : "#fff",
                fontSize: 15, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "Syne,sans-serif", transition: "all 0.2s",
                boxShadow: loading ? "none" : "0 4px 20px rgba(245,166,35,0.3)",
              }}>
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";