import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendBookingConfirmation } from "@/lib/resend";
import { formatDate, formatTime } from "@/lib/utils";

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
      .eq("status", "confirmed")
      .maybeSingle();

    if (existingBooking) {
      return NextResponse.json({ error: "You've already booked this event" }, { status: 400 });
    }

    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event_id)
      .in("status", ["confirmed", "waitlisted"]);

    const confirmedCount = count ?? 0;
    const isFull = confirmedCount >= event.capacity;
    const bookingStatus = isFull ? "waitlisted" : "confirmed";

    const { error: bookingError } = await supabase.from("bookings").insert({
      event_id,
      member_name,
      member_email,
      member_whatsapp: member_whatsapp || null,
      status: bookingStatus,
      payment_status: "free",
      amount_paid: 0,
    });

    if (bookingError) {
      console.error("Booking insert error:", bookingError);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    await upsertMember({
      supabase,
      communityId: community.id,
      name: member_name,
      email: member_email,
      whatsapp: member_whatsapp || null,
      eventDate: event.event_date,
      amountSpent: 0,
    });

    sendBookingConfirmation({
      to: member_email,
      memberName: member_name,
      eventName: event.name,
      eventDate: formatDate(event.event_date),
      eventTime: formatTime(event.event_time),
      eventLocation: event.location,
      communityName: community.name,
    }).catch(console.error);

    return NextResponse.json({ success: true, status: bookingStatus });
  } catch (err) {
    console.error("Book route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function upsertMember({
  supabase,
  communityId,
  name,
  email,
  whatsapp,
  eventDate,
  amountSpent,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  communityId: string;
  name: string;
  email: string;
  whatsapp: string | null;
  eventDate: string;
  amountSpent: number;
}) {
  const { data: existing } = await supabase
    .from("members")
    .select("id, total_bookings, total_spent")
    .eq("community_id", communityId)
    .eq("email", email)
    .single();

  if (existing) {
    await supabase
      .from("members")
      .update({
        name,
        whatsapp: whatsapp ?? undefined,
        total_bookings: existing.total_bookings + 1,
        total_spent: existing.total_spent + amountSpent,
        last_attended: eventDate,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("members").insert({
      community_id: communityId,
      name,
      email,
      whatsapp,
      total_bookings: 1,
      total_spent: amountSpent,
      last_attended: eventDate,
      status: "new",
    });
  }
}
