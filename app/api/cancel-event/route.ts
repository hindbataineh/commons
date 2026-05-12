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

    const { eventId } = await req.json();
    if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

    const { error: updateError } = await svc
      .from("events")
      .update({ status: "cancelled" })
      .eq("id", eventId)
      .eq("community_id", community.id);

    if (updateError) {
      console.error("Cancel event error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("cancel-event error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
