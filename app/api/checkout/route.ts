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

    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event_id)
      .eq("status", "confirmed");

    const confirmedCount = count ?? 0;
    if (confirmedCount >= event.capacity) {
      return NextResponse.json({ error: "Event is full" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

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
      success_url: `${baseUrl}/${community.slug}/${event.slug}/confirmed?name=${encodeURIComponent(member_name)}`,
      cancel_url: `${baseUrl}/${community.slug}/${event.slug}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
