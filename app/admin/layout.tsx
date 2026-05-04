"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace("/login");
    else if (user.role !== "admin") router.replace("/dashboard");
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      <Sidebar/>
      <main style={{ flex:1, overflow:"auto", background:"#0c0f14" }}>
        {children}
      </main>
    </div>
  );
}
