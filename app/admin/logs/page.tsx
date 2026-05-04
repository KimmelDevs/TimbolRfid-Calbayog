"use client";
import { MOCK_LOGS, formatDateTime } from "@/lib/data";
import { Activity } from "lucide-react";

export default function LogsPage() {
  return (
    <div style={{ padding:"36px 40px" }}>
      <div className="fade-up" style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:26, fontWeight:700, marginBottom:6 }}>RFID Logs</h1>
        <p style={{ color:"#6b7280", fontSize:14 }}>Real-time event log from the ESP32 system.</p>
      </div>

      {/* Legend */}
      <div className="fade-up delay-1" style={{ display:"flex", gap:20, marginBottom:24 }}>
        {[["#22c55e","Success — fare paid"],["#ef4444","Error — tap failed"],["#3b82f6","System event"]].map(([c,l])=>(
          <div key={l} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#9ca3af" }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:c, flexShrink:0 }}/>
            {l}
          </div>
        ))}
      </div>

      <div className="fade-up delay-2" style={{
        background:"#181d2a", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, overflow:"hidden"
      }}>
        {/* Terminal-style header */}
        <div style={{
          padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)",
          display:"flex", alignItems:"center", gap:10,
          background:"#0c0f14"
        }}>
          <div style={{ display:"flex", gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:"50%", background:"#ef4444" }}/>
            <div style={{ width:12, height:12, borderRadius:"50%", background:"#f5a623" }}/>
            <div style={{ width:12, height:12, borderRadius:"50%", background:"#22c55e" }}/>
          </div>
          <span style={{ fontSize:12, color:"#6b7280", fontFamily:"monospace", marginLeft:8 }}>
            timbol-esp32 — live event stream
          </span>
        </div>

        {/* Log entries */}
        <div style={{ fontFamily:"monospace" }}>
          {MOCK_LOGS.map((log, i) => (
            <div key={log.id} className={`fade-up delay-${Math.min(i+1,5)}`} style={{
              padding:"14px 20px",
              borderBottom:"1px solid rgba(255,255,255,0.03)",
              display:"flex", gap:16, alignItems:"flex-start"
            }}>
              {/* Dot */}
              <div style={{
                width:9, height:9, borderRadius:"50%", marginTop:4, flexShrink:0,
                background: log.status==="success"?"#22c55e":log.status==="error"?"#ef4444":"#3b82f6",
                boxShadow: `0 0 6px ${log.status==="success"?"rgba(34,197,94,0.5)":log.status==="error"?"rgba(239,68,68,0.5)":"rgba(59,130,246,0.5)"}`
              }}/>
              {/* Timestamp */}
              <span style={{ fontSize:12, color:"#6b7280", flexShrink:0, width:160 }}>
                {formatDateTime(log.timestamp)}
              </span>
              {/* UID */}
              <span style={{
                fontSize:12, flexShrink:0, width:100,
                color: log.uid==="SYSTEM" ? "#3b82f6" : "#f5a623"
              }}>{log.uid}</span>
              {/* Event */}
              <span style={{
                fontSize:13, flex:1,
                color: log.status==="success"?"#d1fae5":log.status==="error"?"#fee2e2":"#dbeafe"
              }}>{log.event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
