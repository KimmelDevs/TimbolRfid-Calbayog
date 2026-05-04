"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff, Zap } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const role = await login(email, password);
    setLoading(false);
    if (!role) {
      setError("Invalid email or password.");
      return;
    }
    router.push(role === "admin" ? "/admin" : "/dashboard");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ── Left panel ── */}
      <div style={{
        width: "46%", background: "#131720", display: "flex",
        flexDirection: "column", justifyContent: "center",
        padding: "60px 56px", position: "relative", overflow: "hidden",
      }}>
        {/* Glow blobs */}
        <div style={{
          position: "absolute", top: -100, right: -100,
          width: 360, height: 360, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,166,35,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -80, left: -80,
          width: 260, height: 260, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,129,58,0.09) 0%, transparent 70%)",
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
          fontFamily: "Syne,sans-serif", fontSize: 38, fontWeight: 800,
          lineHeight: 1.15, marginBottom: 12,
          background: "linear-gradient(135deg,#f0f2f5 40%,#9ca3af)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Cashless.<br />Fast.<br />Reliable.
        </h1>
        <p className="fade-up delay-2" style={{ color: "#6b7280", fontSize: 15, lineHeight: 1.7, maxWidth: 300 }}>
          Tap your RFID card and go — the modern fare system for Timbol
          motorized vehicles across Calbayog City.
        </p>

        {/* Stats */}
        <div className="fade-up delay-3" style={{ display: "flex", gap: 32, marginTop: 48 }}>
          {[["1,240+", "Rides today"], ["₱18,600", "Collected"], ["98%", "Success rate"]].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontFamily: "Syne,sans-serif", fontSize: 22, fontWeight: 700, color: "#f5a623" }}>{v}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div className="fade-up" style={{ width: "100%", maxWidth: 420 }}>
          <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            Welcome back
          </h2>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 36 }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "#f5a623", textDecoration: "none", fontWeight: 500 }}>
              Sign up
            </Link>
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: 13, color: "#9ca3af", display: "block", marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%", padding: "13px 16px",
                  background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, color: "#f0f2f5", fontSize: 15, outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(245,166,35,0.5)"}
                onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 13, color: "#9ca3af" }}>Password</label>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: 13, color: "#f5a623", textDecoration: "none" }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%", padding: "13px 48px 13px 16px",
                    background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, color: "#f0f2f5", fontSize: 15, outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(245,166,35,0.5)"}
                  onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 0,
                  }}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ef4444",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8, padding: "14px",
                background: loading ? "#2a2f40" : "linear-gradient(135deg,#f5a623,#e8813a)",
                border: "none", borderRadius: 10,
                color: loading ? "#6b7280" : "#fff",
                fontSize: 15, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "Syne,sans-serif", transition: "all 0.2s",
                boxShadow: loading ? "none" : "0 4px 20px rgba(245,166,35,0.3)",
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}