// app/api/topup/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET!;

function verifySignature(rawBody: string, sigHeader: string): boolean {
  // PayMongo signature header format: "t=<timestamp>,te=<test_sig>,li=<live_sig>"
  const parts = Object.fromEntries(
    sigHeader.split(",").map(p => p.split("=") as [string, string])
  );
  const timestamp = parts["t"];
  const signature = parts["te"] ?? parts["li"]; // te = test, li = live

  if (!timestamp || !signature) return false;

  const message = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", WEBHOOK_SECRET)
    .update(message)
    .digest("hex");

  return expected === signature;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const sigHeader = req.headers.get("paymongo-signature") ?? "";

    // Verify authenticity
    if (!verifySignature(rawBody, sigHeader)) {
      console.warn("[webhook] Invalid signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event.data?.attributes?.type ?? "";

    // Only process successful payments
    if (eventType !== "link.payment.paid") {
      return NextResponse.json({ received: true });
    }

    const linkData = event.data?.attributes?.data;
    const linkId: string = linkData?.id ?? "";
    const amountCentavos: number = linkData?.attributes?.amount ?? 0;
    const pesos = amountCentavos / 100;
    // userId is stored in `remarks` when the link was created
    const userId: string = linkData?.attributes?.remarks ?? "";

    if (!linkId || !userId || pesos <= 0) {
      console.error("[webhook] Missing linkId, userId, or amount", { linkId, userId, pesos });
      return NextResponse.json({ error: "Bad payload" }, { status: 400 });
    }

    // Idempotency: skip if this link was already processed
    const { data: existing } = await supabaseAdmin
      .from("topups")
      .select("status")
      .eq("link_id", linkId)
      .single();

    if (existing?.status === "paid") {
      console.log("[webhook] Already processed:", linkId);
      return NextResponse.json({ received: true });
    }

    // Credit the user's balance atomically using an RPC function
    const { error: rpcErr } = await supabaseAdmin.rpc("increment_balance", {
      p_user_id: userId,
      p_amount:  pesos,
    });

    if (rpcErr) {
      console.error("[webhook] increment_balance error:", rpcErr.message);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    // Mark topup as paid
    await supabaseAdmin
      .from("topups")
      .upsert({
        link_id:  linkId,
        user_id:  userId,
        amount:   pesos,
        status:   "paid",
        paid_at:  new Date().toISOString(),
      }, { onConflict: "link_id" });

    console.log(`[webhook] Credited ₱${pesos} to user ${userId}`);
    return NextResponse.json({ received: true });
  } catch (e: unknown) {
    console.error("[webhook] Unexpected error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
