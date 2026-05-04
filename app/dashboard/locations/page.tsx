"use client";
import { MOCK_TRANSACTIONS, formatDateTime } from "@/lib/data";
import { MapPin, ExternalLink } from "lucide-react";

export default function LocationsPage() {
  const myTx = MOCK_TRANSACTIONS.filter(t => t.uid === "A3F209B1");

  return (
    <div style={{ padding:"36px 40px" }}>
      <div className="fade-up" style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:26, fontWeight:700, marginBottom:6 }}>Tap Locations</h1>
        <p style={{ color:"#6b7280", fontSize:14 }}>GPS coordinates recorded when you tapped your card.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:16 }}>
        {myTx.map((tx, i) => (
          <div key={tx.id} className={`fade-up delay-${Math.min(i+1,5)}`} style={{
            background:"#181d2a", border:"1px solid rgba(255,255,255,0.06)",
            borderRadius:12, overflow:"hidden"
          }}>
            {/* Map preview placeholder */}
            <div style={{
              height:140, background:"linear-gradient(135deg,#1e2435,#252d40)",
              display:"flex", alignItems:"center", justifyContent:"center",
              position:"relative", overflow:"hidden"
            }}>
              <div style={{
                position:"absolute", inset:0,
                background:`url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}/>
              <MapPin size={32} color="#f5a623" style={{ opacity:0.7 }}/>
            </div>
            <div style={{ padding:"16px 18px" }}>
              <div style={{ fontSize:14, fontWeight:500, marginBottom:4 }}>{tx.route}</div>
              <div style={{ fontFamily:"monospace", fontSize:12, color:"#9ca3af", marginBottom:10 }}>
                {tx.lat.toFixed(6)}, {tx.lng.toFixed(6)}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:12, color:"#6b7280" }}>{formatDateTime(tx.timestamp)}</div>
                <a href={tx.mapLink} target="_blank" rel="noopener noreferrer" style={{
                  display:"flex", alignItems:"center", gap:5,
                  fontSize:12, color:"#3b82f6", textDecoration:"none",
                  padding:"5px 10px", background:"rgba(59,130,246,0.1)", borderRadius:6
                }}>
                  Open map <ExternalLink size={11}/>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
