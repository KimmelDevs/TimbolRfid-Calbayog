import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role key — bypasses RLS, safe for server-side only
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FARE = 10;

export async function POST(req: NextRequest) {
  try {
    const { uid, lat, lng } = await req.json();
    if (!uid) return NextResponse.json({ error: "Missing uid" }, { status: 400 });

    const normalizedUid = uid.trim().toUpperCase();

    // Lookup rider
    const { data: rider, error: lookupErr } = await supabaseAdmin
      .from("jeepneyriders")
      .select("id, full_name, email, balance, rfid_uid")
      .eq("rfid_uid", normalizedUid)
      .maybeSingle();

    if (lookupErr) {
      console.error("[fare] lookup error:", lookupErr.message);
      return NextResponse.json({ error: lookupErr.message }, { status: 500 });
    }

    // Card not registered
    if (!rider) {
      const { error: txErr } = await supabaseAdmin.from("fare").insert({
        rfid_uid:       normalizedUid,
        amount:         FARE,
        status:         "FAILED",
        balance_after:  0,
        passenger_name: null,
        lat:            lat ?? null,
        lng:            lng ?? null,
        route:          "Timbol",
      });
      if (txErr) console.error("[fare] insert NOT_FOUND:", txErr.message);
      return NextResponse.json({ status: "FAILED", reason: "NOT_FOUND" });
    }

    // Insufficient balance
    if (rider.balance < FARE) {
      const { error: txErr } = await supabaseAdmin.from("fare").insert({
        rfid_uid:       normalizedUid,
        amount:         FARE,
        status:         "FAILED",
        balance_after:  rider.balance,
        passenger_name: rider.full_name,
        lat:            lat ?? null,
        lng:            lng ?? null,
        route:          "Timbol",
      });
      if (txErr) console.error("[fare] insert LOW_BALANCE:", txErr.message);
      return NextResponse.json({ status: "FAILED", reason: "LOW_BALANCE", rider });
    }

    // Deduct and record
    const newBalance = rider.balance - FARE;

    const [{ error: deductErr }, { error: txErr }] = await Promise.all([
      supabaseAdmin
        .from("jeepneyriders")
        .update({ balance: newBalance })
        .eq("id", rider.id),
      supabaseAdmin.from("fare").insert({
        rfid_uid:       normalizedUid,
        amount:         FARE,
        status:         "PAID",
        balance_after:  newBalance,
        passenger_name: rider.full_name,
        lat:            lat ?? null,
        lng:            lng ?? null,
        route:          "Timbol",
      }),
    ]);

    if (deductErr) console.error("[fare] deduct error:", deductErr.message);
    if (txErr)     console.error("[fare] insert PAID:", txErr.message);

    return NextResponse.json({
      status: "PAID",
      rider:  { ...rider, balance: newBalance },
    });

  } catch (e: unknown) {
    console.error("[fare] unexpected error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}