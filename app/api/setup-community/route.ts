import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    user_id,
    email,
    name,
    slug,
    type,
    custom_type,
    location,
    description,
    instagram_handle,
    website,
  } = body;

  if (!user_id || !email || !name || !slug || !type || !location || !description || !instagram_handle) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const svc = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: hostError } = await (svc.from("hosts") as any).upsert({
    id: user_id,
    email,
    name,
    onboarding_complete: true,
  });

  if (hostError) {
    return NextResponse.json({ error: hostError.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: communityError } = await (svc.from("communities") as any).insert({
    host_id: user_id,
    name,
    slug,
    type,
    custom_type: type === "other" ? custom_type || null : null,
    location,
    description,
    instagram_handle,
    website: website || null,
  });

  if (communityError) {
    if (communityError.code === "23505" || communityError.message.includes("unique")) {
      return NextResponse.json(
        { error: `The URL "${slug}" is already taken. Please choose another.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: communityError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
