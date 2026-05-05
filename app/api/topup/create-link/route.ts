// app/api/topup/create-link/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for server-side DB writes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET_KEY!;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").trim();

export async function POST(req: NextRequest) {
  try {
    const { userId, amount } = await req.json();

    // Validate amount: ₱50 – ₱5,000
    const pesos = Number(amount);
    if (!userId || isNaN(pesos) || pesos < 50 || pesos > 5000) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const centavos = Math.round(pesos * 100);

    // Create a PayMongo Payment Link
    const pmRes = await fetch("https://api.paymongo.com/v1/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: centavos,
            description: `Timbol RFID Top-up — ₱${pesos.toFixed(2)}`,
            remarks: userId, // store userId here so webhook can read it
          },
        },
      }),
    });

    if (!pmRes.ok) {
      const err = await pmRes.json();
      console.error("[topup] PayMongo error:", err);
      return NextResponse.json({ error: "Payment provider error." }, { status: 502 });
    }

    const pmData = await pmRes.json();
    const link = pmData.data;
    const checkoutUrl: string = link.attributes.checkout_url;
    const linkId: string = link.id;

    // Record the pending top-up in Supabase
    const { error: dbErr } = await supabaseAdmin.from("topups").insert({
      user_id:    userId,
      amount:     pesos,
      status:     "pending",
      link_id:    linkId,
      created_at: new Date().toISOString(),
    });

    if (dbErr) {
      console.error("[topup] DB insert error:", dbErr.message);
      // Non-fatal — webhook will still credit the user
    }

    return NextResponse.json({ checkoutUrl });
  } catch (e: unknown) {
    console.error("[topup] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
