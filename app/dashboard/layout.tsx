"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // wait for session restore before redirecting
    if (!user) router.replace("/login");
    else if (user.role === "admin") router.replace("/admin");
  }, [user, loading, router]);

  // Show nothing while auth is initialising — prevents flash-redirect to /login
  if (loading) return null;
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
