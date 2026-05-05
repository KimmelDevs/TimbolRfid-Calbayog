"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Search, UserPlus, X, CheckCircle2, AlertCircle, ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";

interface Resident {
  id: string;
  full_name: string;
  email: string;
  rfid_uid: string | null;
  balance: number;
  role: string;
  created_at: string;
}

type SortKey = "full_name" | "balance" | "created_at";
type SortDir = "asc" | "desc";
type SaveState = "idle" | "saving" | "success" | "error";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export default function ResidentsPage() {
  const [residents, setResidents]   = useState<Resident[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [sortKey, setSortKey]       = useState<SortKey>("full_name");
  const [sortDir, setSortDir]       = useState<SortDir>("asc");

  // Top-up modal
  const [topupTarget, setTopupTarget] = useState<Resident | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupState, setTopupState]   = useState<SaveState>("idle");
  const [topupMsg, setTopupMsg]       = useState("");

  // Edit balance modal (direct set)
  const [editTarget, setEditTarget]   = useState<Resident | null>(null);
  const [editBalance, setEditBalance] = useState("");
  const [editState, setEditState]     = useState<SaveState>("idle");
  const [editMsg, setEditMsg]         = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Resident | null>(null);
  const [deleteState, setDeleteState]   = useState<SaveState>("idle");

  const fetchResidents = async () => {
    const { data } = await supabase
      .from("jeepneyriders")
      .select("id, full_name, email, rfid_uid, balance, role, created_at")
      .eq("role", "resident")
      .order("full_name");
    if (data) setResidents(data);
    setLoading(false);
  };

  useEffect(() => { fetchResidents(); }, []);

  const sorted = [...residents]
    .filter(r =>
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.rfid_uid ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = sortKey === "balance" ? a.balance : sortKey === "created_at" ? a.created_at : a.full_name;
      const bv = sortKey === "balance" ? b.balance : sortKey === "created_at" ? b.created_at : b.full_name;
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? (sortDir === "asc" ? <ChevronUp size={12} style={{ display: "inline" }}/> : <ChevronDown size={12} style={{ display: "inline" }}/>)
      : <ChevronUp size={12} style={{ display: "inline", opacity: 0.3 }}/>;

  // Top-up handler
  const handleTopup = async () => {
    if (!topupTarget) return;
    const amt = parseFloat(topupAmount);
    if (isNaN(amt) || amt <= 0) { setTopupState("error"); setTopupMsg("Enter a valid amount."); return; }
    setTopupState("saving");
    const { error } = await supabase
      .from("jeepneyriders")
      .update({ balance: topupTarget.balance + amt })
      .eq("id", topupTarget.id);
    if (error) { setTopupState("error"); setTopupMsg(error.message); return; }
    setTopupState("success");
    setTopupMsg(`₱${amt.toFixed(2)} added to ${topupTarget.full_name}'s balance.`);
    await fetchResidents();
    setTimeout(() => { setTopupTarget(null); setTopupState("idle"); setTopupAmount(""); setTopupMsg(""); }, 1400);
  };

  // Edit balance handler
  const handleEditBalance = async () => {
    if (!editTarget) return;
    const val = parseFloat(editBalance);
    if (isNaN(val) || val < 0) { setEditState("error"); setEditMsg("Enter a valid balance."); return; }
    setEditState("saving");
    const { error } = await supabase
      .from("jeepneyriders")
      .update({ balance: val })
      .eq("id", editTarget.id);
    if (error) { setEditState("error"); setEditMsg(error.message); return; }
    setEditState("success");
    setEditMsg("Balance updated.");
    await fetchResidents();
    setTimeout(() => { setEditTarget(null); setEditState("idle"); setEditBalance(""); setEditMsg(""); }, 1200);
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteState("saving");
    const { error } = await supabase.from("jeepneyriders").delete().eq("id", deleteTarget.id);
    if (error) { setDeleteState("error"); return; }
    await fetchResidents();
    setDeleteTarget(null);
    setDeleteState("idle");
  };

  const overlay = {
    position: "fixed" as const, inset: 0,
    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  };
  const modal = {
    background: "#181d2a", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16, padding: "28px 30px", width: 400, maxWidth: "90vw",
  };
  const inputStyle = {
    width: "100%", padding: "10px 14px",
    background: "#0f1320", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 9, color: "#f0f2f5", fontSize: 14, outline: "none", fontFamily: "inherit",
  };

  return (
    <div style={{ padding: "36px 40px" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Residents</h1>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            {loading ? "Loading…" : `${residents.length} registered RFID cardholders`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="fade-up delay-1" style={{ position: "relative", marginBottom: 20, maxWidth: 420 }}>
        <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }}/>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or UID…"
          style={{ ...inputStyle, paddingLeft: 38 }}
        />
      </div>

      {/* Table */}
      <div className="fade-up delay-2" style={{
        background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                <th onClick={() => toggleSort("full_name")} style={{ padding: "13px 16px", fontSize: 12, color: "#6b7280", textAlign: "left", fontWeight: 500, cursor: "pointer", userSelect: "none" }}>
                  Name <SortIcon k="full_name"/>
                </th>
                <th style={{ padding: "13px 16px", fontSize: 12, color: "#6b7280", textAlign: "left", fontWeight: 500 }}>Email</th>
                <th style={{ padding: "13px 16px", fontSize: 12, color: "#6b7280", textAlign: "left", fontWeight: 500 }}>RFID UID</th>
                <th onClick={() => toggleSort("balance")} style={{ padding: "13px 16px", fontSize: 12, color: "#6b7280", textAlign: "left", fontWeight: 500, cursor: "pointer", userSelect: "none" }}>
                  Balance <SortIcon k="balance"/>
                </th>
                <th style={{ padding: "13px 16px", fontSize: 12, color: "#6b7280", textAlign: "left", fontWeight: 500 }}>Status</th>
                <th onClick={() => toggleSort("created_at")} style={{ padding: "13px 16px", fontSize: 12, color: "#6b7280", textAlign: "left", fontWeight: 500, cursor: "pointer", userSelect: "none" }}>
                  Joined <SortIcon k="created_at"/>
                </th>
                <th style={{ padding: "13px 16px", fontSize: 12, color: "#6b7280", textAlign: "left", fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} style={{ padding: "14px 16px" }}>
                          <div style={{ height: 13, background: "rgba(255,255,255,0.05)", borderRadius: 4, animation: "pulse 1.5s ease infinite" }}/>
                        </td>
                      ))}
                    </tr>
                  ))
                : sorted.length === 0
                  ? <tr><td colSpan={7} style={{ padding: 48, textAlign: "center", color: "#6b7280", fontSize: 14 }}>No residents found.</td></tr>
                  : sorted.map(r => {
                      const status = !r.rfid_uid ? "inactive" : r.balance < 20 ? "low" : "active";
                      return (
                        <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "14px 16px", fontWeight: 500, fontSize: 14 }}>{r.full_name}</td>
                          <td style={{ padding: "14px 16px", fontSize: 13, color: "#9ca3af" }}>{r.email}</td>
                          <td style={{ padding: "14px 16px", fontSize: 12, fontFamily: "monospace", color: r.rfid_uid ? "#f5a623" : "#4b5563" }}>
                            {r.rfid_uid ?? "—"}
                          </td>
                          <td style={{ padding: "14px 16px", fontFamily: "Syne,sans-serif", fontSize: 14, fontWeight: 600, color: r.balance < 20 ? "#ef4444" : "#f0f2f5" }}>
                            ₱{r.balance.toFixed(2)}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{
                              padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                              fontFamily: "Syne,sans-serif", textTransform: "uppercase",
                              background: status === "active" ? "rgba(34,197,94,0.1)" : status === "low" ? "rgba(245,166,35,0.1)" : "rgba(239,68,68,0.1)",
                              color: status === "active" ? "#22c55e" : status === "low" ? "#f5a623" : "#ef4444",
                            }}>{status}</span>
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: 12, color: "#6b7280" }}>{formatDate(r.created_at)}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => { setTopupTarget(r); setTopupAmount(""); setTopupState("idle"); setTopupMsg(""); }} style={{
                                padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(34,197,94,0.25)",
                                background: "rgba(34,197,94,0.08)", color: "#22c55e", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                              }}>Top Up</button>
                              <button onClick={() => { setEditTarget(r); setEditBalance(String(r.balance)); setEditState("idle"); setEditMsg(""); }} style={{
                                padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)",
                                background: "none", color: "#9ca3af", fontSize: 12, cursor: "pointer",
                              }}><Pencil size={13}/></button>
                              <button onClick={() => { setDeleteTarget(r); setDeleteState("idle"); }} style={{
                                padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.15)",
                                background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 12, cursor: "pointer",
                              }}><Trash2 size={13}/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Top-up Modal ── */}
      {topupTarget && (
        <div style={overlay} onClick={() => setTopupTarget(null)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 700 }}>Top Up Balance</h2>
              <button onClick={() => setTopupTarget(null)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}><X size={18}/></button>
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
              Adding funds to <strong style={{ color: "#f0f2f5" }}>{topupTarget.full_name}</strong><br/>
              Current balance: <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, color: "#22c55e" }}>₱{topupTarget.balance.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {[20, 50, 100, 200].map(amt => (
                <button key={amt} onClick={() => setTopupAmount(String(amt))} style={{
                  padding: "7px 14px", borderRadius: 7, border: `1px solid ${topupAmount === String(amt) ? "rgba(245,166,35,0.5)" : "rgba(255,255,255,0.08)"}`,
                  background: topupAmount === String(amt) ? "rgba(245,166,35,0.1)" : "#0f1320",
                  color: topupAmount === String(amt) ? "#f5a623" : "#9ca3af", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}>₱{amt}</button>
              ))}
            </div>
            <input
              type="number" min="1" value={topupAmount}
              onChange={e => setTopupAmount(e.target.value)}
              placeholder="Or enter custom amount…"
              style={{ ...inputStyle, marginBottom: 14 }}
            />
            {topupState !== "idle" && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 12px", borderRadius: 8,
                background: topupState === "success" ? "rgba(34,197,94,0.08)" : topupState === "error" ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${topupState === "success" ? "rgba(34,197,94,0.2)" : topupState === "error" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
              }}>
                {topupState === "saving" && <div style={{ width: 13, height: 13, border: "2px solid #9ca3af", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/>}
                {topupState === "success" && <CheckCircle2 size={13} color="#22c55e"/>}
                {topupState === "error"   && <AlertCircle  size={13} color="#ef4444"/>}
                <span style={{ fontSize: 13, color: topupState === "success" ? "#22c55e" : topupState === "error" ? "#ef4444" : "#9ca3af" }}>{topupMsg}</span>
              </div>
            )}
            <button onClick={handleTopup} disabled={topupState === "saving" || topupState === "success"} style={{
              width: "100%", padding: "11px", borderRadius: 9,
              background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              opacity: topupState === "saving" || topupState === "success" ? 0.6 : 1,
            }}>
              {topupState === "saving" ? "Adding…" : topupState === "success" ? "Done!" : "Add Funds"}
            </button>
          </div>
        </div>
      )}

      {/* ── Edit Balance Modal ── */}
      {editTarget && (
        <div style={overlay} onClick={() => setEditTarget(null)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 700 }}>Set Balance</h2>
              <button onClick={() => setEditTarget(null)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}><X size={18}/></button>
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 14 }}>
              Editing balance for <strong style={{ color: "#f0f2f5" }}>{editTarget.full_name}</strong>
            </div>
            <input
              type="number" min="0" value={editBalance}
              onChange={e => setEditBalance(e.target.value)}
              placeholder="New balance amount"
              style={{ ...inputStyle, marginBottom: 14 }}
            />
            {editState !== "idle" && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 12px", borderRadius: 8,
                background: editState === "success" ? "rgba(34,197,94,0.08)" : editState === "error" ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${editState === "success" ? "rgba(34,197,94,0.2)" : editState === "error" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
              }}>
                {editState === "saving" && <div style={{ width: 13, height: 13, border: "2px solid #9ca3af", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/>}
                {editState === "success" && <CheckCircle2 size={13} color="#22c55e"/>}
                {editState === "error"   && <AlertCircle  size={13} color="#ef4444"/>}
                <span style={{ fontSize: 13, color: editState === "success" ? "#22c55e" : editState === "error" ? "#ef4444" : "#9ca3af" }}>{editMsg}</span>
              </div>
            )}
            <button onClick={handleEditBalance} disabled={editState === "saving" || editState === "success"} style={{
              width: "100%", padding: "11px", borderRadius: 9,
              background: "#3b82f6", border: "none",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              opacity: editState === "saving" || editState === "success" ? 0.6 : 1,
            }}>
              {editState === "saving" ? "Saving…" : editState === "success" ? "Saved!" : "Update Balance"}
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div style={overlay} onClick={() => setDeleteTarget(null)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Trash2 size={20} color="#ef4444"/>
              </div>
              <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Remove Resident</h2>
              <p style={{ fontSize: 14, color: "#9ca3af" }}>
                Are you sure you want to remove <strong style={{ color: "#f0f2f5" }}>{deleteTarget.full_name}</strong>? This will delete their account and cannot be undone.
              </p>
            </div>
            {deleteState === "error" && (
              <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 14, fontSize: 13, color: "#ef4444" }}>
                Failed to delete. Try again.
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{
                flex: 1, padding: "11px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.08)",
                background: "none", color: "#9ca3af", fontSize: 14, cursor: "pointer", fontFamily: "inherit",
              }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleteState === "saving"} style={{
                flex: 1, padding: "11px", borderRadius: 9, border: "none",
                background: "#ef4444", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                opacity: deleteState === "saving" ? 0.6 : 1,
              }}>
                {deleteState === "saving" ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
