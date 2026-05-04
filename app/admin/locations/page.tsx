"use client";
import { MOCK_TRANSACTIONS, formatDateTime } from "@/lib/data";
import { MapPin, ExternalLink } from "lucide-react";

export default function AdminLocationsPage() {
  const paid = MOCK_TRANSACTIONS.filter(t => t.status === "PAID");
  const failed = MOCK_TRANSACTIONS.filter(t => t.status === "FAILED");

  return (
    <div style={{ padding:"36px 40px" }}>
      <div className="fade-up" style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:26, fontWeight:700, marginBottom:6 }}>GPS Locations</h1>
        <p style={{ color:"#6b7280", fontSize:14 }}>All tap locations recorded by the ESP32 GPS module.</p>
      </div>

      {/* Stats */}
      <div className="fade-up delay-1" style={{ display:"flex", gap:14, marginBottom:28 }}>
        {[
          ["All taps",String(MOCK_TRANSACTIONS.length),"#f5a623"],
          ["PAID",String(paid.length),"#22c55e"],
          ["FAILED",String(failed.length),"#ef4444"],
        ].map(([l,v,c])=>(
          <div key={l} style={{
            background:"#181d2a", border:"1px solid rgba(255,255,255,0.06)",
            borderRadius:10, padding:"14px 20px", display:"flex", gap:14, alignItems:"center"
          }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:c }}/>
            <span style={{ fontSize:13, color:"#9ca3af" }}>{l}</span>
            <span style={{ fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:18, color:c }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Location cards grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:16 }}>
        {MOCK_TRANSACTIONS.map((tx, i) => (
          <div key={tx.id} className={`fade-up delay-${Math.min(i+1,5)}`} style={{
            background:"#181d2a", border:"1px solid rgba(255,255,255,0.06)",
            borderRadius:12, overflow:"hidden"
          }}>
            {/* Map tile placeholder */}
            <div style={{
              height:130, position:"relative", overflow:"hidden",
              background:"linear-gradient(135deg,#1e2435,#252d40)"
            }}>
              <div style={{
                position:"absolute", inset:0,
                background:`url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}/>
              <div style={{
                position:"absolute", top:10, right:10, padding:"4px 10px",
                background: tx.status==="PAID" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                border: `1px solid ${tx.status==="PAID" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                borderRadius:6, fontSize:11, fontWeight:700,
                color: tx.status==="PAID" ? "#22c55e" : "#ef4444", fontFamily:"Syne,sans-serif"
              }}>{tx.status}</div>
              <div style={{ position:"absolute", bottom:12, left:"50%", transform:"translateX(-50%)" }}>
                <MapPin size={28} color={tx.status==="PAID" ? "#f5a623" : "#ef4444"} style={{ opacity:0.8 }}/>
              </div>
            </div>
            <div style={{ padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>{tx.passengerName}</div>
                <div style={{ fontFamily:"Syne,sans-serif", fontSize:13, fontWeight:700, color:"#f5a623" }}>₱{tx.amount}</div>
              </div>
              <div style={{ fontSize:12, color:"#9ca3af", fontFamily:"monospace", marginBottom:4 }}>
                {tx.uid}
              </div>
              <div style={{ fontSize:11, color:"#6b7280", marginBottom:10 }}>
                {tx.lat.toFixed(6)}, {tx.lng.toFixed(6)}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:11, color:"#6b7280" }}>{formatDateTime(tx.timestamp)}</div>
                <a href={tx.mapLink} target="_blank" rel="noopener noreferrer" style={{
                  display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#3b82f6",
                  textDecoration:"none", padding:"4px 8px", background:"rgba(59,130,246,0.1)", borderRadius:5
                }}>
                  <MapPin size={10}/> Open <ExternalLink size={9}/>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
