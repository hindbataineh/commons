import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { sendBookingConfirmation } from "@/lib/resend";
import { formatDate, formatTime } from "@/lib/utils";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const meta = session.metadata!;

  const {
    event_id,
    member_name,
    member_email,
    member_whatsapp,
    community_id,
    booking_ref,
  } = meta;

  if (!event_id || !member_name || !member_email) {
    console.error("Missing metadata on checkout session:", session.id);
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Idempotency — skip if already booked for this payment intent
  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("stripe_payment_intent_id", session.payment_intent as string)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true });
  }

  // Fetch event for email details
  const { data: eventRow } = await supabase
    .from("events")
    .select("name, event_date, event_time, location, price")
    .eq("id", event_id)
    .single();

  // Fetch community name
  const { data: community } = await supabase
    .from("communities")
    .select("name")
    .eq("id", community_id)
    .single();

  // Create booking
  const { error: insertError } = await supabase.from("bookings").insert({
    event_id,
    member_name,
    member_email,
    member_whatsapp: member_whatsapp || null,
    status: "confirmed",
    payment_status: "paid",
    stripe_payment_intent_id: session.payment_intent as string,
    amount_paid: session.amount_total ?? 0,
    booking_ref: booking_ref || null,
  });

  if (insertError) {
    console.error("[webhook] booking insert error:", insertError);
  }

  // Upsert member
  if (community_id) {
    const { data: existingMember } = await supabase
      .from("members")
      .select("id, total_bookings, total_spent")
      .eq("community_id", community_id)
      .eq("email", member_email)
      .single();

    if (existingMember) {
      await supabase
        .from("members")
        .update({
          name: member_name,
          total_bookings: existingMember.total_bookings + 1,
          total_spent: existingMember.total_spent + (session.amount_total ?? 0),
          last_attended: eventRow?.event_date ?? null,
        })
        .eq("id", existingMember.id);
    } else {
      await supabase.from("members").insert({
        community_id,
        name: member_name,
        email: member_email,
        whatsapp: member_whatsapp || null,
        total_bookings: 1,
        total_spent: session.amount_total ?? 0,
        last_attended: eventRow?.event_date ?? null,
        status: "new",
      });
    }
  }

  // Send confirmation email
  console.log("[webhook] booking confirmed, attempting email");
  console.log("[webhook] member email:", member_email);
  console.log("[webhook] event name:", eventRow?.name);

  if (!eventRow || !community) {
    console.error("[webhook] skipping email — missing data", {
      event_id,
      community_id,
      hasEvent: !!eventRow,
      hasCommunity: !!community,
    });
  } else {
    try {
      const emailResult = await sendBookingConfirmation({
        to: member_email,
        memberName: member_name,
        eventName: eventRow.name,
        eventDate: formatDate(eventRow.event_date),
        eventTime: formatTime(eventRow.event_time),
        eventLocation: eventRow.location,
        communityName: community.name,
        bookingRef: booking_ref || undefined,
      });
      console.log("[webhook] email result:", JSON.stringify(emailResult));
    } catch (emailError) {
      console.error("[webhook] email error:", emailError);
    }
  }

  return NextResponse.json({ received: true });
}
