"use client";
import { useState, useEffect, useRef } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { MapPin, Users, Filter } from "lucide-react";

interface FareRecord {
  id: string;
  rfid_uid: string;
  passenger_name: string;
  lat: number;
  lng: number;
  created_at: string;
  status: string;
  route: string;
}

interface Resident {
  id: string;
  full_name: string;
  rfid_uid: string;
}

const NWSSU = [12.070292499803708, 124.59620098486326] as [number, number];
const PALETTE = ["#f5a623","#3b82f6","#22c55e","#a855f7","#ef4444","#06b6d4","#f43f5e","#84cc16"];

export default function AdminLocationsPage() {
  const mapRef         = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef     = useRef<any[]>([]);
  const LRef           = useRef<any>(null);

  const [fares,     setFares]     = useState<FareRecord[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selected,  setSelected]  = useState<string>("ALL");
  const [loading,   setLoading]   = useState(true);
  const [mapReady,  setMapReady]  = useState(false);

  // Load data
  useEffect(() => {
    (async () => {
      const [fareRes, resRes] = await Promise.all([
        supabaseAdmin.from("fare")
          .select("id, rfid_uid, passenger_name, lat, lng, created_at, status, route")
          .not("lat", "is", null)
          .not("lng", "is", null)
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("jeepneyriders")
          .select("id, full_name, rfid_uid")
          .eq("role", "resident")
          .not("rfid_uid", "is", null),
      ]);
      if (fareRes.data) setFares(fareRes.data);
      if (resRes.data)  setResidents(resRes.data);
      setLoading(false);
    })();
  }, []);

  // Init Leaflet map once
  useEffect(() => {
    if (typeof window === "undefined" || mapInstanceRef.current || !mapRef.current) return;

    if (!document.getElementById("leaflet-css")) {
      const link  = document.createElement("link");
      link.id     = "leaflet-css";
      link.rel    = "stylesheet";
      link.href   = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const script   = document.createElement("script");
    script.src     = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload  = () => {
      const L = (window as any).L;
      LRef.current = L;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, { zoomControl: true })
        .setView(NWSSU, 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Draw markers whenever filter/data/mapReady changes
  useEffect(() => {
    const L   = LRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const filtered = selected === "ALL"
      ? fares
      : fares.filter(f => f.rfid_uid === selected);

    // Assign a color per rfid_uid
    const uidColors: Record<string, string> = {};
    let colorIdx = 0;
    filtered.forEach(f => {
      if (!uidColors[f.rfid_uid]) {
        uidColors[f.rfid_uid] = PALETTE[colorIdx % PALETTE.length];
        colorIdx++;
      }
    });

    filtered.forEach(f => {
      if (!f.lat || !f.lng) return;
      const color = uidColors[f.rfid_uid] ?? "#f5a623";
      const icon  = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 6px ${color}99;"></div>`,
        iconSize:   [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([f.lat, f.lng], { icon }).bindPopup(`
        <div style="font-family:sans-serif;min-width:160px">
          <div style="font-weight:700;margin-bottom:4px">${f.passenger_name ?? f.rfid_uid}</div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:2px">RFID: ${f.rfid_uid}</div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:2px">Route: ${f.route ?? "—"}</div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px">${new Date(f.created_at).toLocaleString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
          <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;background:${f.status==="PAID"?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)"};color:${f.status==="PAID"?"#22c55e":"#ef4444"}">${f.status}</span>
        </div>
      `).addTo(map);

      markersRef.current.push(marker);
    });

    // Never fitBounds — just stay centered on NwSSU
    // fitBounds crashes when all points are identical (fallback coords)
    map.setView(NWSSU, 16);
  }, [fares, selected, mapReady]);

  const filteredFares = selected === "ALL" ? fares : fares.filter(f => f.rfid_uid === selected);

  return (
    <div style={{ padding: "36px 40px", display: "flex", flexDirection: "column", gap: 24, height: "100vh", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>GPS Locations</h1>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            {loading ? "Loading…" : `${filteredFares.length} ride taps plotted · centered on NwSSU`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Filter size={15} color="#6b7280"/>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={{
              background: "#181d2a", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 9, color: "#f0f2f5", fontSize: 13,
              padding: "9px 14px", cursor: "pointer", fontFamily: "inherit", outline: "none",
            }}
          >
            <option value="ALL">All Residents</option>
            {residents.map(r => (
              <option key={r.id} value={r.rfid_uid}>{r.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
        {[
          { label: "Total Taps",  value: filteredFares.length,                               color: "#f5a623", icon: <MapPin size={14}/> },
          { label: "Residents",   value: selected === "ALL" ? residents.length : 1,           color: "#3b82f6", icon: <Users size={14}/> },
          { label: "Paid Rides",  value: filteredFares.filter(f => f.status==="PAID").length, color: "#22c55e", icon: <MapPin size={14}/> },
        ].map(s => (
          <div key={s.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 18px", borderRadius: 10,
            background: "#181d2a", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{ color: s.color }}>{s.icon}</span>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>{s.label}</span>
            <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div style={{
        flex: 1, borderRadius: 14, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)", minHeight: 400, position: "relative",
      }}>
        {loading && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#181d2a", color: "#6b7280", fontSize: 14,
          }}>
            Loading map data…
          </div>
        )}
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}