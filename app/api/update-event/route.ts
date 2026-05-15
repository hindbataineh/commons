import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const svc = createServiceClient();
    const { data: community } = await svc
      .from("communities")
      .select("id")
      .eq("host_id", user.id)
      .single();
    if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });

    const body = await req.json();
    const { eventId, name, date, time, location, locationUrl, description, capacity, priceAed } = body;

    if (!eventId || !name || !date || !time || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const priceFils = Math.round(Math.max(0, parseFloat(priceAed || "0")) * 100);

    const { error: updateError } = await svc
      .from("events")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        name,
        event_date: date,
        event_time: time,
        location,
        location_url: locationUrl || null,
        description: description || null,
        capacity: parseInt(capacity, 10) || 20,
        price: priceFils,
      } as any)
      .eq("id", eventId)
      .eq("community_id", community.id);

    if (updateError) {
      console.error("Event update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("update-event error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
