"use client";
import { useState } from "react";
import TxRow from "@/components/TxRow";
import { MOCK_TRANSACTIONS } from "@/lib/data";
import { Search } from "lucide-react";

export default function TransactionsPage() {
  const [filter, setFilter] = useState<"ALL"|"PAID"|"FAILED">("ALL");
  const [search, setSearch] = useState("");
  const myTx = MOCK_TRANSACTIONS.filter(t => t.uid === "A3F209B1");

  const filtered = myTx.filter(t => {
    const matchStatus = filter === "ALL" || t.status === filter;
    const matchSearch = t.route.toLowerCase().includes(search.toLowerCase()) ||
                        t.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div style={{ padding:"36px 40px" }}>
      <div className="fade-up" style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:26, fontWeight:700, marginBottom:6 }}>My Transactions</h1>
        <p style={{ color:"#6b7280", fontSize:14 }}>All your Timbol fare payments.</p>
      </div>

      {/* Filters */}
      <div className="fade-up delay-1" style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <Search size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#6b7280" }}/>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by route or ID…"
            style={{
              width:"100%", padding:"10px 14px 10px 38px",
              background:"#181d2a", border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:9, color:"#f0f2f5", fontSize:14, outline:"none"
            }}
          />
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {(["ALL","PAID","FAILED"] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              padding:"10px 18px", borderRadius:9, border:"1px solid rgba(255,255,255,0.07)",
              background: filter===f ? "rgba(245,166,35,0.1)" : "#181d2a",
              color: filter===f ? "#f5a623" : "#9ca3af",
              fontSize:13, fontWeight:600, cursor:"pointer",
              fontFamily:"Syne,sans-serif", transition:"all 0.15s"
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div className="fade-up delay-2" style={{
        background:"#181d2a", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, overflow:"hidden"
      }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"rgba(255,255,255,0.02)" }}>
                {["UID","Passenger","Route","Fare","Status","Date/Time","Location"].map(h=>(
                  <th key={h} style={{ padding:"13px 16px", fontSize:12, color:"#6b7280", textAlign:"left", fontWeight:500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={7} style={{ padding:40, textAlign:"center", color:"#6b7280", fontSize:14 }}>No transactions found.</td></tr>
                : filtered.map(tx => <TxRow key={tx.id} tx={tx}/>)
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
