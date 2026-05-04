"use client";
import { useAuth } from "@/lib/auth";
import { MOCK_TRANSACTIONS } from "@/lib/data";
import { Wallet, TrendingDown, CheckCircle2 } from "lucide-react";

export default function BalancePage() {
  const { user } = useAuth();
  const myTx = MOCK_TRANSACTIONS.filter(t => t.uid === "A3F209B1" && t.status === "PAID");
  const spent = myTx.reduce((s,t) => s + t.amount, 0);

  return (
    <div style={{ padding:"36px 40px" }}>
      <div className="fade-up" style={{ marginBottom:32 }}>
        <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:26, fontWeight:700, marginBottom:6 }}>Balance</h1>
        <p style={{ color:"#6b7280", fontSize:14 }}>Your RFID card balance and payment summary.</p>
      </div>

      {/* Balance card */}
      <div className="fade-up delay-1" style={{
        background:"linear-gradient(135deg,#1e2a1a,#1a2510)",
        border:"1px solid rgba(34,197,94,0.2)", borderRadius:16,
        padding:"32px 36px", marginBottom:24, position:"relative", overflow:"hidden"
      }}>
        <div style={{
          position:"absolute", right:-60, top:-60, width:240, height:240, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)"
        }}/>
        <div style={{ fontSize:13, color:"#6b7280", marginBottom:10 }}>Available Balance</div>
        <div style={{ fontFamily:"Syne,sans-serif", fontSize:52, fontWeight:800, color:"#22c55e", marginBottom:8 }}>
          ₱{user?.balance?.toFixed(2)}
        </div>
        <div style={{ fontSize:13, color:"#6b7280" }}>RFID: <span style={{ fontFamily:"monospace", color:"#9ca3af" }}>{user?.rfidUid}</span></div>
      </div>

      {/* Stats row */}
      <div className="fade-up delay-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:32 }}>
        <div style={{
          background:"#181d2a", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"22px 24px"
        }}>
          <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:12 }}>
            <TrendingDown size={18} color="#ef4444"/>
            <span style={{ fontSize:13, color:"#6b7280" }}>Total Spent</span>
          </div>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:28, fontWeight:700, color:"#ef4444" }}>₱{spent}</div>
          <div style={{ fontSize:12, color:"#6b7280", marginTop:4 }}>{myTx.length} successful rides</div>
        </div>
        <div style={{
          background:"#181d2a", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"22px 24px"
        }}>
          <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:12 }}>
            <CheckCircle2 size={18} color="#22c55e"/>
            <span style={{ fontSize:13, color:"#6b7280" }}>Avg. Fare</span>
          </div>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:28, fontWeight:700 }}>
            ₱{myTx.length ? (spent/myTx.length).toFixed(2) : "0.00"}
          </div>
          <div style={{ fontSize:12, color:"#6b7280", marginTop:4 }}>per ride</div>
        </div>
      </div>

      {/* Top-up notice */}
      <div className="fade-up delay-3" style={{
        background:"rgba(245,166,35,0.06)", border:"1px solid rgba(245,166,35,0.15)",
        borderRadius:12, padding:"20px 24px", display:"flex", gap:16, alignItems:"center"
      }}>
        <Wallet size={22} color="#f5a623"/>
        <div>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:3 }}>Need to top up?</div>
          <div style={{ fontSize:13, color:"#6b7280" }}>
            Visit any authorized Timbol RFID loading station in Calbayog City, or contact your barangay coordinator.
          </div>
        </div>
      </div>
    </div>
  );
}
