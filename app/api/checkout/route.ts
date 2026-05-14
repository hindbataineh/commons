import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_id, member_name, member_email, member_whatsapp } = body;

    if (!event_id || !member_name || !member_email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.status !== "active") {
      return NextResponse.json({ error: "Event is not active" }, { status: 400 });
    }
    if (event.price === 0) {
      return NextResponse.json({ error: "Use /api/book for free events" }, { status: 400 });
    }

    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("id, name, slug")
      .eq("id", event.community_id)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("event_id", event_id)
      .eq("member_email", member_email)
      .in("status", ["confirmed", "pending"])
      .maybeSingle();

    if (existingBooking) {
      return NextResponse.json({ error: "You've already booked this event" }, { status: 400 });
    }

    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event_id)
      .eq("status", "confirmed");

    const confirmedCount = count ?? 0;
    if (confirmedCount >= event.capacity) {
      return NextResponse.json({ error: "Event is full" }, { status: 400 });
    }

    const origin =
      req.headers.get("origin") ||
      (req.headers.get("x-forwarded-host")
        ? `https://${req.headers.get("x-forwarded-host")}`
        : "https://commons-khaki.vercel.app");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: member_email,
      line_items: [
        {
          price_data: {
            currency: event.currency.toLowerCase(),
            unit_amount: event.price,
            product_data: {
              name: event.name,
              description: `${community.name} — ${event.event_date}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        event_id,
        member_name,
        member_email,
        member_whatsapp: member_whatsapp || "",
        community_id: community.id,
        host_slug: community.slug,
        event_slug: event.slug,
      },
      success_url: `${origin}/${community.slug}/${event.slug}/confirmed?name=${encodeURIComponent(member_name)}`,
      cancel_url: `${origin}/${community.slug}/${event.slug}`,
    });

    // Insert a pending booking immediately so the spot is reserved while
    // the user completes payment. The webhook will promote it to confirmed.
    const { error: bookingError } = await supabase.from("bookings").insert({
      event_id,
      member_name,
      member_email,
      member_whatsapp: member_whatsapp || null,
      status: "pending",
      payment_status: "pending",
      stripe_payment_intent_id: session.id,
      amount_paid: 0,
    });

    if (bookingError && bookingError.code !== "23505") {
      console.error("Pending booking insert error:", bookingError);
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "23505") {
      return NextResponse.json({ error: "You have already booked this event" }, { status: 400 });
    }
    console.error("Checkout route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
