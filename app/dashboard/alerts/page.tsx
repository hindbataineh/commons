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
  if (!community) redirect("/onboarding");

  const { quietMembers, newMembers, waitlistEvents } = await getAlertsData(supabase, community.id);

  const totalAlerts =
    (quietMembers.length > 0 ? 1 : 0) +
    (waitlistEvents.length > 0 ? 1 : 0) +
    (newMembers.length > 0 ? 1 : 0);

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-charcoal">Alerts</h1>
        <p className="text-sm text-muted mt-1">
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
          action={quietMembers.length > 0 ? { label: "View all members →", href: "/dashboard/members" } : undefined}
        >
          {quietMembers.length > 0 && (
            <ul className="flex flex-col gap-1 mt-3">
              {quietMembers.slice(0, 8).map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-charcoal">{m.name}</span>
                  <span className="text-muted text-xs">
                    {m.last_attended ? `Last seen ${formatShortDate(m.last_attended)}` : "Never attended"}
                  </span>
                </li>
              ))}
              {quietMembers.length > 8 && (
                <li className="text-xs text-muted pt-1">+{quietMembers.length - 8} more</li>
              )}
            </ul>
          )}
        </AlertCard>

        {/* ── Waitlist demand ── */}
        <AlertCard
          title="Waitlist demand"
          count={waitlistEvents.length}
          emptyMessage="No events have waitlisted members."
          accentColor="terracotta"
          action={undefined}
        >
          {waitlistEvents.length > 0 && (
            <ul className="flex flex-col gap-2 mt-3">
              {waitlistEvents.map((ev) => (
                <li key={ev.eventId} className="flex items-center justify-between text-sm">
                  <span className="text-charcoal">{ev.eventName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-terracotta font-medium text-xs">
                      {ev.count} waiting
                    </span>
                    <Link
                      href={`/dashboard/events`}
                      className="text-xs text-muted hover:text-terracotta transition-colors"
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
                  <span className="text-charcoal">{m.name}</span>
                  <span className="text-muted text-xs">{m.email}</span>
                </li>
              ))}
              {newMembers.length > 8 && (
                <li className="text-xs text-muted pt-1">+{newMembers.length - 8} more</li>
              )}
            </ul>
          )}
        </AlertCard>
      </div>
    </div>
  );
}

type AccentColor = "amber" | "terracotta" | "green";

const accentStyles: Record<AccentColor, { border: string; bg: string; badge: string; count: string }> = {
  amber: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-800",
    count: "text-amber-800",
  },
  terracotta: {
    border: "border-terracotta/30",
    bg: "bg-terracotta/5",
    badge: "bg-terracotta/10 text-terracotta",
    count: "text-terracotta",
  },
  green: {
    border: "border-green-200",
    bg: "bg-green-50",
    badge: "bg-green-100 text-green-800",
    count: "text-green-800",
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
        hasAlert ? `${styles.border} ${styles.bg}` : "border-sand bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-charcoal">{title}</h3>
          {hasAlert && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>
              {count}
            </span>
          )}
        </div>
        {action && hasAlert && (
          <Link href={action.href} className={`text-xs font-medium hover:underline ${styles.count}`}>
            {action.label}
          </Link>
        )}
      </div>

      {!hasAlert && <p className="text-sm text-muted mt-2">{emptyMessage}</p>}
      {children}
    </div>
  );
}
