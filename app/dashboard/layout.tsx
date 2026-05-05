"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0f14" }}>
      {/* Sidebar skeleton */}
      <div style={{
        width: 220, flexShrink: 0,
        background: "#131720",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        padding: "24px 16px",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, padding: "0 8px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(245,166,35,0.15)", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 12, borderRadius: 4, background: "rgba(255,255,255,0.07)", marginBottom: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ height: 9, width: "60%", borderRadius: 4, background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
        </div>
        {/* Nav items */}
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ height: 40, borderRadius: 8, background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>

      {/* Main content skeleton */}
      <main style={{ flex: 1, padding: "36px 40px" }}>
        {/* Header */}
        <div style={{ height: 28, width: 200, borderRadius: 6, background: "rgba(255,255,255,0.07)", marginBottom: 10, animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: 14, width: 300, borderRadius: 6, background: "rgba(255,255,255,0.04)", marginBottom: 32, animation: "pulse 1.5s ease-in-out infinite" }} />

        {/* Cards row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 100, borderRadius: 14, background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>

        {/* Content block */}
        <div style={{ height: 280, borderRadius: 14, background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role === "admin") router.replace("/admin");
  }, [user, loading, router]);

  // Show skeleton while auth is restoring — no blank screen on refresh
  if (loading) return <LoadingSkeleton />;
  if (!user || user.role === "admin") return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: "auto", background: "#0c0f14" }}>
        {children}
      </main>
    </div>
  );
}