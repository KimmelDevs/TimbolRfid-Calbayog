"use client";
import { MapPin, ExternalLink } from "lucide-react";
import { Transaction, formatDateTime } from "@/lib/data";

export default function TxRow({ tx }: { tx: Transaction }) {
  return (
    <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
      <td style={{ padding:"14px 16px", fontSize:13, color:"#9ca3af", fontFamily:"monospace" }}>{tx.uid}</td>
      <td style={{ padding:"14px 16px", fontSize:13 }}>{tx.passengerName}</td>
      <td style={{ padding:"14px 16px", fontSize:13 }}>{tx.route}</td>
      <td style={{ padding:"14px 16px", fontSize:14, fontWeight:600, fontFamily:"Syne,sans-serif" }}>₱{tx.amount}.00</td>
      <td style={{ padding:"14px 16px" }}>
        <span style={{
          padding:"4px 10px", borderRadius:6, fontSize:12, fontWeight:600,
          background: tx.status==="PAID" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          color: tx.status==="PAID" ? "#22c55e" : "#ef4444",
          border: `1px solid ${tx.status==="PAID" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
          fontFamily:"Syne,sans-serif"
        }}>{tx.status}</span>
      </td>
      <td style={{ padding:"14px 16px", fontSize:12, color:"#6b7280" }}>{formatDateTime(tx.timestamp)}</td>
      <td style={{ padding:"14px 16px" }}>
        <a href={tx.mapLink} target="_blank" rel="noopener noreferrer" style={{
          display:"inline-flex", alignItems:"center", gap:5,
          fontSize:12, color:"#3b82f6", textDecoration:"none"
        }}>
          <MapPin size={13}/> Map <ExternalLink size={11}/>
        </a>
      </td>
    </tr>
  );
}
