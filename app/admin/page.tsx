"use client";
import StatCard from "@/components/StatCard";
import TxRow from "@/components/TxRow";
import { MOCK_TRANSACTIONS, MOCK_LOGS, MOCK_RESIDENTS } from "@/lib/data";
import { Users, CreditCard, TrendingUp, Activity, CheckCircle2, XCircle } from "lucide-react";

export default function AdminPage() {
  const paid   = MOCK_TRANSACTIONS.filter(t => t.status === "PAID");
  const failed = MOCK_TRANSACTIONS.filter(t => t.status === "FAILED");
  const total  = paid.reduce((s,t) => s + t.amount, 0);

  return (
    <div style={{ padding:"36px 40px" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom:36 }}>
        <div style={{ fontSize:13, color:"#6b7280", marginBottom:6 }}>
          {new Date().toLocaleDateString("en-PH", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
        </div>
        <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:28, fontWeight:700, marginBottom:4 }}>Admin Dashboard</h1>
        <p style={{ color:"#6b7280", fontSize:14 }}>Timbol RFID system overview — Calbayog City.</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:32 }}>
        <StatCard label="Total Residents" value={String(MOCK_RESIDENTS.length)} sub="Registered cards" icon={<Users size={18}/>} delay={1}/>
        <StatCard label="Revenue Today"   value={`₱${total}`} sub="Collected fares" icon={<TrendingUp size={18}/>} delay={2} accent/>
        <StatCard label="Successful Taps" value={String(paid.length)}   sub="PAID transactions" icon={<CheckCircle2 size={18}/>} delay={3}/>
        <StatCard label="Failed Taps"     value={String(failed.length)} sub="Errors / low balance" icon={<XCircle size={18}/>} delay={4}/>
      </div>

      {/* Live log preview + recent transactions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.8fr", gap:20, marginBottom:24 }}>
        {/* Recent logs */}
        <div className="fade-up delay-2" style={{
          background:"#181d2a", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, overflow:"hidden"
        }}>
          <div style={{ padding:"18px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between" }}>
            <h3 style={{ fontFamily:"Syne,sans-serif", fontWeight:600, fontSize:15 }}>Live Logs</h3>
            <a href="/admin/logs" style={{ fontSize:12, color:"#f5a623", textDecoration:"none" }}>View all →</a>
          </div>
          <div style={{ padding:"8px 0" }}>
            {MOCK_LOGS.slice(0,6).map(log => (
              <div key={log.id} style={{
                padding:"10px 20px", display:"flex", gap:12, alignItems:"flex-start",
                borderBottom:"1px solid rgba(255,255,255,0.03)"
              }}>
                <div style={{
                  width:8, height:8, borderRadius:"50%", marginTop:5, flexShrink:0,
                  background: log.status==="success" ? "#22c55e" : log.status==="error" ? "#ef4444" : "#3b82f6"
                }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:"#9ca3af", marginBottom:2, fontFamily:"monospace" }}>{log.uid}</div>
                  <div style={{ fontSize:13, lineHeight:1.4 }}>{log.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resident status */}
        <div className="fade-up delay-3" style={{
          background:"#181d2a", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, overflow:"hidden"
        }}>
          <div style={{ padding:"18px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between" }}>
            <h3 style={{ fontFamily:"Syne,sans-serif", fontWeight:600, fontSize:15 }}>Resident Balances</h3>
            <a href="/admin/residents" style={{ fontSize:12, color:"#f5a623", textDecoration:"none" }}>View all →</a>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"rgba(255,255,255,0.02)" }}>
                  {["Name","UID","Balance","Status","Rides"].map(h=>(
                    <th key={h} style={{ padding:"11px 16px", fontSize:11, color:"#6b7280", textAlign:"left", fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_RESIDENTS.map(r=>(
                  <tr key={r.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"12px 16px", fontSize:13, fontWeight:500 }}>{r.name}</td>
                    <td style={{ padding:"12px 16px", fontSize:12, fontFamily:"monospace", color:"#9ca3af" }}>{r.uid}</td>
                    <td style={{ padding:"12px 16px", fontSize:13, fontFamily:"Syne,sans-serif", fontWeight:600,
                      color: r.balance < 20 ? "#ef4444" : "#f0f2f5"
                    }}>₱{r.balance.toFixed(2)}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{
                        padding:"3px 9px", borderRadius:5, fontSize:11, fontWeight:600,
                        background: r.status==="active" ? "rgba(34,197,94,0.1)" : r.status==="low" ? "rgba(245,166,35,0.1)" : "rgba(239,68,68,0.1)",
                        color: r.status==="active" ? "#22c55e" : r.status==="low" ? "#f5a623" : "#ef4444",
                        fontFamily:"Syne,sans-serif", textTransform:"uppercase"
                      }}>{r.status}</span>
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:13, color:"#9ca3af" }}>{r.rides}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* All transactions */}
      <div className="fade-up delay-4" style={{
        background:"#181d2a", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, overflow:"hidden"
      }}>
        <div style={{ padding:"18px 24px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between" }}>
          <h3 style={{ fontFamily:"Syne,sans-serif", fontWeight:600, fontSize:15 }}>All Transactions</h3>
          <a href="/admin/transactions" style={{ fontSize:12, color:"#f5a623", textDecoration:"none" }}>View all →</a>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"rgba(255,255,255,0.02)" }}>
                {["UID","Passenger","Route","Fare","Status","Date/Time","Location"].map(h=>(
                  <th key={h} style={{ padding:"12px 16px", fontSize:12, color:"#6b7280", textAlign:"left", fontWeight:500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_TRANSACTIONS.slice(0,6).map(tx => <TxRow key={tx.id} tx={tx}/>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
