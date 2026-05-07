"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

const PUBLIC_PATHS = ["/login", "/signup", "/topup/success", "/topup/failed"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [role,   setRole]   = useState<"admin" | "resident" | null>(null);
  const [name,   setName]   = useState("");
  const [email,  setEmail]  = useState("");

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  // Fetch role + profile from DB (source of truth) rather than user_metadata
  async function loadProfile(userId: string, userEmail: string) {
    const { data } = await supabase
      .from("jeepneyriders")
      .select("role, full_name")
      .eq("id", userId)
      .single();

    const userRole = (data?.role ?? "resident") as "admin" | "resident";
    const userName = data?.full_name ?? userEmail.split("@")[0];
    setRole(userRole);
    setName(userName);
    setEmail(userEmail);
    redirectIfWrongRole(userRole);
  }

  useEffect(() => {
    // getSession() reads from localStorage — instant on refresh, no network needed
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (session) {
        setAuthed(true);
        loadProfile(session.user.id, session.user.email ?? "");
      } else {
        setAuthed(false);
        if (!isPublic) router.replace("/login");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthed(true);
        loadProfile(session.user.id, session.user.email ?? "");
      } else {
        setAuthed(false);
        setRole(null);
        if (!isPublic) router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  function redirectIfWrongRole(userRole: string) {
    const onDashboard = pathname.startsWith("/dashboard");
    const onAdmin     = pathname.startsWith("/admin");
    if (onAdmin     && userRole !== "admin")    router.replace("/dashboard");
    if (onDashboard && userRole === "admin")    router.replace("/admin");
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Public pages — no shell at all
  if (isPublic) return <>{children}</>;

  // Still resolving session — show spinner
  if (authed === null) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "#0c0f14", flexDirection: "column", gap: 16,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "3px solid rgba(245,166,35,0.2)",
        borderTopColor: "#f5a623",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // Not logged in — render nothing (redirect already fired)
  if (!authed || !role) return null;

  // Wrong role — render nothing (redirect already fired)
  if (pathname.startsWith("/admin")     && role !== "admin")    return null;
  if (pathname.startsWith("/dashboard") && role === "admin")    return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role={role} name={name} email={email} onLogout={handleLogout} />
      <main style={{ flex: 1, overflow: "auto", background: "#0c0f14" }}>
        {children}
      </main>
    </div>
  );
}