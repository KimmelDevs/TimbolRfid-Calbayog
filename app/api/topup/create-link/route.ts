// app/api/topup/create-link/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET_KEY!;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").trim();

export async function POST(req: NextRequest) {
  try {
    const { userId, amount } = await req.json();

    const pesos = Number(amount);
    if (!userId || isNaN(pesos) || pesos < 50 || pesos > 5000) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const centavos = Math.round(pesos * 100);

    // Create a PayMongo Checkout Session locked to GCash only
    const pmRes = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: {
              // PayMongo requires a name on checkout sessions
              name: "Timbol RFID Rider",
            },
            line_items: [
              {
                currency:   "PHP",
                amount:     centavos,
                name:       "Timbol RFID Wallet Top-up",
                description: `Load ₱${pesos.toFixed(2)} to your RFID wallet`,
                quantity:   1,
              },
            ],
            payment_method_types: ["gcash"],  // GCash only
            success_url: `${SITE_URL}/topup/success?userId=${userId}&amount=${pesos}`,
            cancel_url:  `${SITE_URL}/dashboard/topup?cancelled=1`,
            description: `Timbol RFID Top-up — ₱${pesos.toFixed(2)}`,
            // Store userId in metadata so webhook can read it
            metadata: { userId, amount: String(pesos) },
          },
        },
      }),
    });

    if (!pmRes.ok) {
      const err = await pmRes.json();
      console.error("[topup] PayMongo error:", JSON.stringify(err));
      return NextResponse.json({ error: "Payment provider error." }, { status: 502 });
    }

    const pmData = await pmRes.json();
    const session      = pmData.data;
    const checkoutUrl: string = session.attributes.checkout_url;
    const sessionId:   string = session.id;

    // Record the pending top-up
    const { error: dbErr } = await supabaseAdmin.from("topups").insert({
      user_id:    userId,
      amount:     pesos,
      status:     "pending",
      link_id:    sessionId,   // reuse link_id column for session id
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