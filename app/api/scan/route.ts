import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FARE = 10;

export async function POST(req: NextRequest) {
  try {
    const { uid, lat, lng } = await req.json();

    if (!uid) return NextResponse.json({ error: "Missing uid" }, { status: 400 });

    // Look up resident by RFID uid
    const { data: resident, error: lookupErr } = await supabase
      .from("jeepneyriders")
      .select("id, full_name, balance, rfid_uid")
      .eq("rfid_uid", uid)
      .maybeSingle();

    if (lookupErr) {
      console.error("[scan] lookup error:", lookupErr.message);
      return NextResponse.json({ error: lookupErr.message }, { status: 500 });
    }

    // Not registered
    if (!resident) {
      await supabase.from("transactions").insert({
        rfid_uid:      uid,
        status:        "FAILED",
        amount:        FARE,
        balance_after: 0,
      });
      return NextResponse.json({ status: "FAILED", reason: "NOT_FOUND" });
    }

    // Insufficient balance
    if (resident.balance < FARE) {
      await supabase.from("transactions").insert({
        rfid_uid:      uid,
        status:        "FAILED",
        amount:        FARE,
        balance_after: resident.balance,
      });
      return NextResponse.json({ status: "FAILED", reason: "LOW_BALANCE", resident });
    }

    // Deduct balance
    const newBalance = resident.balance - FARE;
    const { error: deductErr } = await supabase
      .from("jeepneyriders")
      .update({ balance: newBalance })
      .eq("id", resident.id);

    if (deductErr) {
      console.error("[scan] deduct error:", deductErr.message);
      return NextResponse.json({ error: deductErr.message }, { status: 500 });
    }

    // Record transaction
    const { error: txErr } = await supabase.from("transactions").insert({
      rfid_uid:      uid,
      status:        "PAID",
      amount:        FARE,
      balance_after: newBalance,
    });

    if (txErr) {
      console.error("[scan] tx insert error:", txErr.message);
      return NextResponse.json({ error: txErr.message }, { status: 500 });
    }

    return NextResponse.json({
      status:   "PAID",
      resident: { ...resident, balance: newBalance },
      lat,
      lng,
    });

  } catch (e: unknown) {
    console.error("[scan] unexpected error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}