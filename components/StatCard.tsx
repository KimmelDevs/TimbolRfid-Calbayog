"use client";
interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  icon?: React.ReactNode;
  delay?: number;
}

export default function StatCard({ label, value, sub, accent, icon, delay = 0 }: StatCardProps) {
  return (
    <div className={`fade-up delay-${delay}`} style={{
      background:"#181d2a", border:"1px solid rgba(255,255,255,0.06)",
      borderRadius:14, padding:"22px 24px",
      borderLeft: accent ? "3px solid #f5a623" : "1px solid rgba(255,255,255,0.06)"
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <span style={{ fontSize:13, color:"#6b7280" }}>{label}</span>
        {icon && <span style={{ color:"#6b7280" }}>{icon}</span>}
      </div>
      <div style={{ fontFamily:"Syne,sans-serif", fontSize:28, fontWeight:700, marginBottom:4, color: accent?"#f5a623":"#f0f2f5" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize:12, color:"#6b7280" }}>{sub}</div>}
    </div>
  );
}
