import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as mqtt from "mqtt";

// Service role key — bypasses RLS, safe for server-side only
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FARE = 10;

const MQTT_BROKER    = "mqtt://broker.hivemq.com:1883";
const TOPIC_RESPONSE = "esp32/rfid/response";

/** Publish a single message to the ESP32 and disconnect cleanly. */
async function publishToEsp32(message: "PAID" | "FAILED"): Promise<void> {
  return new Promise((resolve) => {
    const client = mqtt.connect(MQTT_BROKER, {
      clientId: `nextjs-fare-${Math.random().toString(16).slice(2, 8)}`,
      clean:    true,
    });

    let timer: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timer);
      try { client.end(true); } catch { /* ignore */ }
    };

    // Give up after 4 s so we never block the HTTP response indefinitely
    timer = setTimeout(() => {
      console.warn("[fare] MQTT connect timeout — skipping publish");
      cleanup();
      resolve();
    }, 4000);

    client.once("connect", () => {
      clearTimeout(timer);
      client.publish(TOPIC_RESPONSE, message, { qos: 1 }, (err) => {
        if (err) console.error("[fare] MQTT publish error:", err.message);
        cleanup();
        resolve();
      });
    });

    client.once("error", (err) => {
      console.error("[fare] MQTT connect error:", err.message);
      cleanup();
      resolve();
    });
  });
}

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
      await publishToEsp32("FAILED");
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

      await publishToEsp32("FAILED");
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

      await publishToEsp32("FAILED");
      return NextResponse.json({ status: "FAILED", reason: "LOW_BALANCE", rider });
    }

    // Deduct ₱10 and record transaction
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

    // Tell the ESP32 → green LED lights up
    await publishToEsp32("PAID");

    return NextResponse.json({
      status: "PAID",
      rider:  { ...rider, balance: newBalance },
    });

  } catch (e: unknown) {
    console.error("[fare] unexpected error:", e);
    await publishToEsp32("FAILED").catch(() => {});
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}