import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const svc = createServiceClient();

    const { data: community } = await svc
      .from("communities")
      .select("id, slug")
      .eq("host_id", user.id)
      .single();

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, date, time, location, locationUrl, description, priceAed, capacity, repeat } = body;

    if (!name || !date || !time || !location || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const priceFils = Math.round(Math.max(0, parseFloat(priceAed || "0")) * 100);
    const baseSlug = generateSlug(name);

    // Check for slug collision and append timestamp if needed
    const { data: existing } = await svc
      .from("events")
      .select("id")
      .eq("community_id", community.id)
      .eq("slug", baseSlug)
      .maybeSingle();

    const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

    const { data: newEvent, error: insertError } = await svc
      .from("events")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        community_id: community.id,
        name,
        slug,
        location,
        location_url: locationUrl || null,
        description: description || null,
        event_date: date,
        event_time: time,
        price: priceFils,
        currency: "AED",
        capacity: parseInt(capacity, 10) || 20,
        is_recurring: repeat !== "one-off",
        recurrence_rule: repeat === "one-off" ? null : repeat,
        status: "active",
      } as any)
      .select("id")
      .single();

    if (insertError) {
      console.error("Event insert error:", insertError);
      return NextResponse.json(
        { error: `Failed to create event: ${insertError.message} (code: ${insertError.code})` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      eventId: newEvent.id,
      eventSlug: slug,
      communitySlug: community.slug,
    });
  } catch (err) {
    console.error("create-event route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
