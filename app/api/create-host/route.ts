import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { id, email } = await req.json();
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("hosts")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("hosts").insert({
      id,
      email,
      name: email.split("@")[0],
    });
  }

  return NextResponse.json({ success: true });
}
