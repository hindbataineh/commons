import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendBookingConfirmation } from "@/lib/resend";
import { formatDate, formatTime } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const svc = createServiceClient();
    const { data: community } = await svc
      .from("communities")
      .select("id, name")
      .eq("host_id", user.id)
      .single();
    if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });

    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });

    // Fetch the booking with event info
    const { data: booking } = await svc
      .from("bookings")
      .select("id, event_id, member_name, member_email, status")
      .eq("id", bookingId)
      .eq("status", "waitlisted")
      .single();

    if (!booking) return NextResponse.json({ error: "Waitlisted booking not found" }, { status: 404 });

    // Verify event belongs to this host's community
    const { data: event } = await svc
      .from("events")
      .select("id, name, event_date, event_time, location, capacity")
      .eq("id", booking.event_id)
      .eq("community_id", community.id)
      .single();

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Check capacity
    const { count: confirmedCount } = await svc
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("status", "confirmed");

    if ((confirmedCount ?? 0) >= event.capacity) {
      return NextResponse.json({ error: "Event is still full" }, { status: 400 });
    }

    // Promote
    const { error: updateError } = await svc
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Promote waitlist error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send confirmation email
    sendBookingConfirmation({
      to: booking.member_email,
      memberName: booking.member_name,
      eventName: event.name,
      eventDate: formatDate(event.event_date),
      eventTime: formatTime(event.event_time),
      eventLocation: event.location,
      communityName: community.name,
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("promote-from-waitlist error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
