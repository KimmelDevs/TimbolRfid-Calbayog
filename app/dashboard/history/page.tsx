"use client";
import { MOCK_TRANSACTIONS, formatDateTime } from "@/lib/data";
import { MapPin, CheckCircle2, XCircle } from "lucide-react";

export default function HistoryPage() {
  const myTx = MOCK_TRANSACTIONS.filter(t => t.uid === "A3F209B1");

  return (
    <div style={{ padding:"36px 40px" }}>
      <div className="fade-up" style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:26, fontWeight:700, marginBottom:6 }}>Ride History</h1>
        <p style={{ color:"#6b7280", fontSize:14 }}>All your trips on Timbol vehicles.</p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {myTx.map((tx, i) => (
          <div key={tx.id} className={`fade-up delay-${Math.min(i+1,5)}`} style={{
            background:"#181d2a", border:"1px solid rgba(255,255,255,0.06)",
            borderRadius:12, padding:"18px 22px",
            display:"flex", alignItems:"center", justifyContent:"space-between", gap:16
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{
                width:42, height:42, borderRadius:10,
                background: tx.status==="PAID" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                display:"flex", alignItems:"center", justifyContent:"center"
              }}>
                {tx.status==="PAID"
                  ? <CheckCircle2 size={20} color="#22c55e"/>
                  : <XCircle size={20} color="#ef4444"/>
                }
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:500, marginBottom:3 }}>{tx.route}</div>
                <div style={{ fontSize:12, color:"#6b7280" }}>{formatDateTime(tx.timestamp)}</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:20 }}>
              <a href={tx.mapLink} target="_blank" rel="noopener noreferrer"
                style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#3b82f6", textDecoration:"none" }}>
                <MapPin size={13}/>{tx.lat.toFixed(4)}, {tx.lng.toFixed(4)}
              </a>
              <div style={{
                fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:700,
                color: tx.status==="PAID" ? "#f5a623" : "#ef4444"
              }}>
                {tx.status==="PAID" ? `-₱${tx.amount}` : "FAILED"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
