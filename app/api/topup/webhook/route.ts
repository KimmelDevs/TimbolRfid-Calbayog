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
  const parts = Object.fromEntries(
    sigHeader.split(",").map(p => p.split("=") as [string, string])
  );
  const timestamp = parts["t"];
  const signature = parts["te"] ?? parts["li"]; // te = test, li = live
  if (!timestamp || !signature) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return expected === signature;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody  = await req.text();
    const sigHeader = req.headers.get("paymongo-signature") ?? "";

    if (!verifySignature(rawBody, sigHeader)) {
      console.warn("[webhook] Invalid signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event     = JSON.parse(rawBody);
    const eventType: string = event.data?.attributes?.type ?? "";

    console.log("[webhook] Event type:", eventType);

    // Handle both checkout session paid AND legacy link paid events
    if (
      eventType !== "checkout_session.payment.paid" &&
      eventType !== "link.payment.paid"
    ) {
      return NextResponse.json({ received: true });
    }

    const sessionData = event.data?.attributes?.data;

    let sessionId: string;
    let pesos: number;
    let userId: string;

    if (eventType === "checkout_session.payment.paid") {
      // Checkout session event — userId is in metadata
      sessionId = sessionData?.id ?? "";
      const amountCentavos: number = sessionData?.attributes?.line_items?.[0]?.amount ?? 0;
      pesos     = amountCentavos / 100;
      userId    = sessionData?.attributes?.metadata?.userId ?? "";
    } else {
      // Legacy payment link event — userId is in remarks
      sessionId = sessionData?.id ?? "";
      const amountCentavos: number = sessionData?.attributes?.amount ?? 0;
      pesos     = amountCentavos / 100;
      userId    = sessionData?.attributes?.remarks ?? "";
    }

    if (!sessionId || !userId || pesos <= 0) {
      console.error("[webhook] Missing sessionId, userId, or amount", { sessionId, userId, pesos });
      return NextResponse.json({ error: "Bad payload" }, { status: 400 });
    }

    // Idempotency: skip if already processed
    const { data: existing } = await supabaseAdmin
      .from("topups")
      .select("status")
      .eq("link_id", sessionId)
      .single();

    if (existing?.status === "paid") {
      console.log("[webhook] Already processed:", sessionId);
      return NextResponse.json({ received: true });
    }

    // Credit balance atomically
    const { error: rpcErr } = await supabaseAdmin.rpc("increment_balance", {
      p_user_id: userId,
      p_amount:  pesos,
    });

    if (rpcErr) {
      console.error("[webhook] increment_balance error:", rpcErr.message);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    // Mark as paid
    await supabaseAdmin
      .from("topups")
      .upsert({
        link_id:  sessionId,
        user_id:  userId,
        amount:   pesos,
        status:   "paid",
        paid_at:  new Date().toISOString(),
      }, { onConflict: "link_id" });

    console.log(`[webhook] ✅ Credited ₱${pesos} to user ${userId}`);
    return NextResponse.json({ received: true });

  } catch (e: unknown) {
    console.error("[webhook] Unexpected error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}