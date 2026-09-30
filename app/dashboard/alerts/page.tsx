import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCommunityForHost, getAlertsData } from "@/lib/queries";
import { formatShortDate } from "@/lib/utils";

export default async function AlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const community = await getCommunityForHost(supabase, user.id);
  if (!community) redirect("/complete-profile");

  const { quietMembers, newMembers, waitlistEvents } = await getAlertsData(supabase, community.id);

  const totalAlerts =
    (quietMembers.length > 0 ? 1 : 0) +
    (waitlistEvents.length > 0 ? 1 : 0) +
    (newMembers.length > 0 ? 1 : 0);

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-[34px] font-semibold tracking-tight text-carbon">Alerts</h1>
        <p className="text-[15px] text-stone mt-1">
          {totalAlerts === 0 ? "Nothing needs attention right now." : `${totalAlerts} thing${totalAlerts !== 1 ? "s" : ""} need your attention.`}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* ── Quiet members ── */}
        <AlertCard
          title="Regulars going quiet"
          count={quietMembers.length}
          emptyMessage="No regulars have gone quiet — everyone's showing up."
          accentColor="amber"
          action={quietMembers.length > 0 ? { label: "View all members →", href: "/dashboard/members?filter=at-risk" } : undefined}
        >
          {quietMembers.length > 0 && (
            <ul className="flex flex-col gap-1 mt-3">
              {quietMembers.slice(0, 8).map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-carbon">{m.name}</span>
                  <span className="text-stone text-[13px]">
                    {m.last_attended ? `Last seen ${formatShortDate(m.last_attended)}` : "Never attended"}
                  </span>
                </li>
              ))}
              {quietMembers.length > 8 && (
                <li className="text-[13px] text-stone pt-1">+{quietMembers.length - 8} more</li>
              )}
            </ul>
          )}
        </AlertCard>

        {/* ── Waitlist demand ── */}
        <AlertCard
          title="Waitlist demand"
          count={waitlistEvents.length}
          emptyMessage="No events have waitlisted members."
          accentColor="carbon"
          action={undefined}
        >
          {waitlistEvents.length > 0 && (
            <ul className="flex flex-col gap-2 mt-3">
              {waitlistEvents.map((ev) => (
                <li key={ev.eventId} className="flex items-center justify-between text-sm">
                  <span className="text-carbon">{ev.eventName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-stone font-medium text-[13px]">
                      {ev.count} waiting
                    </span>
                    <Link
                      href={`/dashboard/events`}
                      className="text-[13px] text-stone hover:text-sea-green transition-colors"
                    >
                      View →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AlertCard>

        {/* ── New members ── */}
        <AlertCard
          title="New members this month"
          count={newMembers.length}
          emptyMessage="No new members in the last 30 days."
          accentColor="green"
          action={newMembers.length > 0 ? { label: "View all members →", href: "/dashboard/members" } : undefined}
        >
          {newMembers.length > 0 && (
            <ul className="flex flex-col gap-1 mt-3">
              {newMembers.slice(0, 8).map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-carbon">{m.name}</span>
                  <span className="text-stone text-[13px]">{m.email}</span>
                </li>
              ))}
              {newMembers.length > 8 && (
                <li className="text-[13px] text-stone pt-1">+{newMembers.length - 8} more</li>
              )}
            </ul>
          )}
        </AlertCard>
      </div>
    </div>
  );
}

type AccentColor = "amber" | "carbon" | "green";

const accentStyles: Record<AccentColor, { border: string; bg: string; badge: string; count: string }> = {
  amber: {
    border: "border-[#2A6B4D]",
    bg: "bg-mint",
    badge: "bg-[#2A6B4D]/10 text-sea-green",
    count: "text-sea-green",
  },
  carbon: {
    border: "border-carbon/20",
    bg: "bg-linen",
    badge: "bg-carbon/10 text-carbon",
    count: "text-carbon",
  },
  green: {
    border: "border-[#2A6B4D]",
    bg: "bg-mint",
    badge: "bg-[#2A6B4D]/10 text-sea-green",
    count: "text-sea-green",
  },
};

function AlertCard({
  title,
  count,
  emptyMessage,
  accentColor,
  action,
  children,
}: {
  title: string;
  count: number;
  emptyMessage: string;
  accentColor: AccentColor;
  action?: { label: string; href: string };
  children?: React.ReactNode;
}) {
  const styles = accentStyles[accentColor];
  const hasAlert = count > 0;

  return (
    <div
      className={`rounded-xl border px-5 py-5 ${
        hasAlert ? `${styles.border} ${styles.bg}` : "border-[#D8D2C6] bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-carbon">{title}</h3>
          {hasAlert && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>
              {count}
            </span>
          )}
        </div>
        {action && hasAlert && (
          <Link href={action.href} className={`text-[13px] font-medium hover:underline ${styles.count}`}>
            {action.label}
          </Link>
        )}
      </div>

      {!hasAlert && <p className="text-[15px] text-stone mt-2">{emptyMessage}</p>}
      {children}
    </div>
  );
}
