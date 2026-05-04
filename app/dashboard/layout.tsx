import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCommunityForHost } from "@/lib/queries";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: host }, community] = await Promise.all([
    supabase.from("hosts").select("name").eq("id", user.id).single(),
    getCommunityForHost(supabase, user.id),
  ]);

  if (!community) redirect("/onboarding");

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar
        hostName={host?.name ?? user.email ?? "Host"}
        communityName={community.name}
      />
      <main className="ml-56 flex-1 min-h-screen">{children}</main>
    </div>
  );
}
