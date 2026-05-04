"use client";
import { useAuth } from "@/lib/auth";
import StatCard from "@/components/StatCard";
import TxRow from "@/components/TxRow";
import { MOCK_TRANSACTIONS, formatDateTime } from "@/lib/data";
import { CreditCard, MapPin, History, Wallet, CheckCircle2, XCircle } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const myTx = MOCK_TRANSACTIONS.filter(t => t.uid === "A3F209B1");
  const paid  = myTx.filter(t => t.status === "PAID");
  const spent = paid.reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ padding:"36px 40px" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom:36 }}>
        <div style={{ fontSize:13, color:"#6b7280", marginBottom:6 }}>
          {new Date().toLocaleDateString("en-PH", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
        </div>
        <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:28, fontWeight:700, marginBottom:4 }}>
          Good day, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p style={{ color:"#6b7280", fontSize:14 }}>Here&apos;s your Timbol RFID activity overview.</p>
      </div>

      {/* RFID card */}
      <div className="fade-up delay-1" style={{
        marginBottom:32,
        background:"linear-gradient(135deg,#1e2435,#252d40)",
        border:"1px solid rgba(245,166,35,0.15)",
        borderRadius:16, padding:"24px 28px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"relative", overflow:"hidden"
      }}>
        <div style={{
          position:"absolute", right:-40, top:-40,
          width:200, height:200, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)"
        }}/>
        <div>
          <div style={{ fontSize:12, color:"#6b7280", marginBottom:8 }}>Your RFID Card</div>
          <div style={{ fontFamily:"monospace", fontSize:22, fontWeight:700, letterSpacing:"0.12em", marginBottom:4 }}>
            {user?.rfidUid ?? "PENDING"}
          </div>
          <div style={{ fontSize:13, color:"#9ca3af" }}>{user?.name}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:12, color:"#6b7280", marginBottom:6 }}>Current Balance</div>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:32, fontWeight:800, color:"#f5a623" }}>
            ₱{user?.balance?.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:36 }}>
        <StatCard label="Total Rides"    value={String(myTx.length)} sub="All time"       icon={<History size={18}/>}      delay={1}/>
        <StatCard label="Amount Spent"   value={`₱${spent}`}          sub="Paid fares"     icon={<Wallet size={18}/>}       delay={2} accent/>
        <StatCard label="Successful"     value={String(paid.length)}  sub="PAID taps"      icon={<CheckCircle2 size={18}/>} delay={3}/>
        <StatCard label="Failed Taps"    value={String(myTx.length - paid.length)} sub="Low balance / error" icon={<XCircle size={18}/>} delay={4}/>
      </div>

      {/* Recent transactions */}
      <div className="fade-up delay-3" style={{
        background:"#181d2a", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, overflow:"hidden"
      }}>
        <div style={{ padding:"20px 24px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h3 style={{ fontFamily:"Syne,sans-serif", fontWeight:600, fontSize:16 }}>Recent Transactions</h3>
          <a href="/dashboard/transactions" style={{ fontSize:13, color:"#f5a623", textDecoration:"none" }}>View all →</a>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"rgba(255,255,255,0.02)" }}>
                {["UID","Passenger","Route","Fare","Status","Date/Time","Location"].map(h=>(
                  <th key={h} style={{ padding:"12px 16px", fontSize:12, color:"#6b7280", textAlign:"left", fontWeight:500, letterSpacing:"0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myTx.slice(0,5).map(tx => <TxRow key={tx.id} tx={tx}/>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
