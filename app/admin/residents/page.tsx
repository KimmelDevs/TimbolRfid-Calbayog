"use client";
import { useState } from "react";
import { MOCK_RESIDENTS } from "@/lib/data";
import { Search, UserPlus } from "lucide-react";

export default function ResidentsPage() {
  const [search, setSearch] = useState("");
  const filtered = MOCK_RESIDENTS.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.uid.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding:"36px 40px" }}>
      <div className="fade-up" style={{ marginBottom:28, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
        <div>
          <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:26, fontWeight:700, marginBottom:6 }}>Residents</h1>
          <p style={{ color:"#6b7280", fontSize:14 }}>{MOCK_RESIDENTS.length} registered RFID cardholders.</p>
        </div>
        <button style={{
          display:"flex", alignItems:"center", gap:8,
          padding:"11px 20px",
          background:"linear-gradient(135deg,#f5a623,#e8813a)",
          border:"none", borderRadius:9, color:"#fff",
          fontSize:14, fontWeight:600, cursor:"pointer",
          fontFamily:"Syne,sans-serif",
          boxShadow:"0 4px 16px rgba(245,166,35,0.3)"
        }}>
          <UserPlus size={16}/> Add Resident
        </button>
      </div>

      {/* Search */}
      <div className="fade-up delay-1" style={{ position:"relative", marginBottom:24 }}>
        <Search size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#6b7280" }}/>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search by name, email, or UID…"
          style={{
            width:"100%", maxWidth:400, padding:"10px 14px 10px 38px",
            background:"#181d2a", border:"1px solid rgba(255,255,255,0.07)",
            borderRadius:9, color:"#f0f2f5", fontSize:14, outline:"none"
          }}
        />
      </div>

      <div className="fade-up delay-2" style={{
        background:"#181d2a", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, overflow:"hidden"
      }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"rgba(255,255,255,0.02)" }}>
                {["Name","Email","RFID UID","Balance","Status","Total Rides","Actions"].map(h=>(
                  <th key={h} style={{ padding:"13px 16px", fontSize:12, color:"#6b7280", textAlign:"left", fontWeight:500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r=>(
                <tr key={r.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding:"14px 16px", fontWeight:500, fontSize:14 }}>{r.name}</td>
                  <td style={{ padding:"14px 16px", fontSize:13, color:"#9ca3af" }}>{r.email}</td>
                  <td style={{ padding:"14px 16px", fontSize:12, fontFamily:"monospace", color:"#f5a623" }}>{r.uid}</td>
                  <td style={{ padding:"14px 16px", fontFamily:"Syne,sans-serif", fontSize:14, fontWeight:600,
                    color: r.balance < 20 ? "#ef4444" : "#f0f2f5"
                  }}>₱{r.balance.toFixed(2)}</td>
                  <td style={{ padding:"14px 16px" }}>
                    <span style={{
                      padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:700,
                      fontFamily:"Syne,sans-serif", textTransform:"uppercase",
                      background: r.status==="active" ? "rgba(34,197,94,0.1)" : r.status==="low" ? "rgba(245,166,35,0.1)" : "rgba(239,68,68,0.1)",
                      color: r.status==="active" ? "#22c55e" : r.status==="low" ? "#f5a623" : "#ef4444",
                    }}>{r.status}</span>
                  </td>
                  <td style={{ padding:"14px 16px", fontSize:13, color:"#9ca3af" }}>{r.rides}</td>
                  <td style={{ padding:"14px 16px" }}>
                    <button style={{
                      padding:"6px 14px", borderRadius:6, border:"1px solid rgba(255,255,255,0.08)",
                      background:"none", color:"#9ca3af", fontSize:12, cursor:"pointer"
                    }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
