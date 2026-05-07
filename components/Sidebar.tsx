"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap, LayoutDashboard, CreditCard, MapPin, History,
  Users, Activity, LogOut, ChevronRight, Wallet
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  role: "admin" | "resident";
  name: string;
  email: string;
  onLogout: () => void;
}

export default function Sidebar({ role, name, email, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const residentNav: NavItem[] = [
    { href: "/dashboard",              label: "Overview",      icon: <LayoutDashboard size={18} /> },
    { href: "/dashboard/transactions", label: "Transactions",  icon: <CreditCard size={18} /> },
    { href: "/dashboard/history",      label: "Ride History",  icon: <History size={18} /> },
    { href: "/dashboard/locations",    label: "Locations",     icon: <MapPin size={18} /> },
    { href: "/dashboard/balance",      label: "Balance",       icon: <Wallet size={18} /> },
    { href: "/dashboard/topup",        label: "Top Up",        icon: <Zap size={18} /> },
  ];

  const adminNav: NavItem[] = [
    { href: "/admin",                  label: "Overview",      icon: <LayoutDashboard size={18} /> },
    { href: "/admin/residents",        label: "Residents",     icon: <Users size={18} /> },
    { href: "/admin/transactions",     label: "Transactions",  icon: <CreditCard size={18} /> },
    { href: "/admin/logs",             label: "RFID Logs",     icon: <Activity size={18} /> },
    { href: "/admin/locations",        label: "GPS Locations", icon: <MapPin size={18} /> },
  ];

  const nav = role === "admin" ? adminNav : residentNav;

  return (
    <aside style={{
      width: 240, minHeight: "100vh", background: "#131720",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", padding: "28px 0", flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ padding: "0 20px", marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 9,
            background: "linear-gradient(135deg,#f5a623,#e8813a)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={19} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 16 }}>Timbol RFID</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>Calbayog City</div>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ padding: "0 20px", marginBottom: 24 }}>
        <div style={{
          background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.18)",
          borderRadius: 8, padding: "8px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>Logged in as</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#f5a623",
            textTransform: "uppercase", letterSpacing: "0.06em",
            fontFamily: "Syne,sans-serif",
          }}>{role}</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", borderRadius: 9, textDecoration: "none",
              background: active ? "rgba(245,166,35,0.1)" : "transparent",
              color: active ? "#f5a623" : "#9ca3af",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: active ? 500 : 400 }}>
                {item.icon}
                {item.label}
              </div>
              {active && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div style={{ padding: "0 12px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20, marginTop: 16 }}>
        <div style={{ padding: "10px 12px", marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{name}</div>
          <div style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
        </div>
        <button onClick={onLogout} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", borderRadius: 9, background: "none",
          border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14,
          transition: "all 0.15s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.07)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#6b7280"; (e.currentTarget as HTMLElement).style.background = "none"; }}
        >
          <LogOut size={17} /> Sign out
        </button>
      </div>
    </aside>
  );
}
