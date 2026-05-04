import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDashboardOverview } from "@/lib/queries";
import { formatPrice, formatShortDate, formatTime } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getDashboardOverview(supabase, user.id);
  if (!data) redirect("/onboarding");

  const { community, stats, quietMembersCount, nextEvents, recentMembers } = data;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-charcoal">Dashboard</h1>
        <p className="text-sm text-muted mt-1">{community.name}</p>
      </div>

      {/* Alert banner */}
      {quietMembersCount > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            <strong>{quietMembersCount} member{quietMembersCount !== 1 ? "s" : ""}</strong>{" "}
            haven&rsquo;t attended in 14+ days.
          </p>
          <Link
            href="/dashboard/members"
            className="text-sm text-amber-700 font-medium hover:underline whitespace-nowrap"
          >
            View members →
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total members" value={stats.totalMembers.toString()} />
        <StatCard
          label="Revenue this month"
          value={stats.revenueThisMonth === 0 ? "—" : formatPrice(stats.revenueThisMonth)}
        />
        <StatCard
          label="Avg fill rate"
          value={nextEvents.length === 0 ? "—" : `${Math.round(stats.avgFillRate * 100)}%`}
        />
        <StatCard
          label="Return rate"
          value={stats.totalMembers === 0 ? "—" : `${Math.round(stats.returnRate * 100)}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Upcoming events */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-charcoal uppercase tracking-wide">Upcoming events</h2>
            <Link href="/dashboard/events" className="text-xs text-terracotta hover:underline">
              All events →
            </Link>
          </div>

          {nextEvents.length === 0 ? (
            <div className="bg-white border border-sand rounded-xl px-5 py-8 text-center">
              <p className="text-sm text-muted">No upcoming events.</p>
              <Link
                href="/dashboard/events/new"
                className="mt-3 inline-block text-sm text-terracotta hover:underline"
              >
                Create one →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {nextEvents.map((event) => {
                const fillPct = Math.min(100, Math.round((event.confirmedCount / event.capacity) * 100));
                return (
                  <div key={event.id} className="bg-white border border-sand rounded-xl px-5 py-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-charcoal text-sm">{event.name}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {formatShortDate(event.event_date)} · {formatTime(event.event_time)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted">Revenue</p>
                        <p className="text-sm font-medium text-charcoal">
                          {event.revenue === 0 ? "—" : formatPrice(event.revenue)}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted mb-1.5">
                      <span>{event.confirmedCount}/{event.capacity} going</span>
                      {event.waitlistedCount > 0 && (
                        <span className="text-terracotta">{event.waitlistedCount} waitlisted</span>
                      )}
                    </div>
                    <div className="h-1 bg-sand rounded-full overflow-hidden">
                      <div className="h-full bg-terracotta rounded-full" style={{ width: `${fillPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Booking link panel */}
        <div>
          <h2 className="text-sm font-medium text-charcoal uppercase tracking-wide mb-4">Booking link</h2>
          <BookingLinkPanel
            slug={community.slug}
            baseUrl={baseUrl}
            bookingsThisMonth={stats.bookingsThisMonth}
          />
        </div>
      </div>

      {/* Recent members */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-charcoal uppercase tracking-wide">Recent members</h2>
          <Link href="/dashboard/members" className="text-xs text-terracotta hover:underline">
            All members →
          </Link>
        </div>

        {recentMembers.length === 0 ? (
          <div className="bg-white border border-sand rounded-xl px-5 py-8 text-center">
            <p className="text-sm text-muted">No members yet. Share your booking link to get started.</p>
          </div>
        ) : (
          <div className="bg-white border border-sand rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand">
                  <th className="text-left px-5 py-3 text-xs text-muted font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-xs text-muted font-medium">Email</th>
                  <th className="text-center px-4 py-3 text-xs text-muted font-medium">Bookings</th>
                  <th className="text-left px-5 py-3 text-xs text-muted font-medium">Last attended</th>
                </tr>
              </thead>
              <tbody>
                {recentMembers.map((m, i) => (
                  <tr key={m.id} className={i < recentMembers.length - 1 ? "border-b border-sand/60" : ""}>
                    <td className="px-5 py-3 font-medium text-charcoal">{m.name}</td>
                    <td className="px-5 py-3 text-muted">{m.email}</td>
                    <td className="px-4 py-3 text-center text-charcoal">{m.total_bookings}</td>
                    <td className="px-5 py-3 text-muted">
                      {m.last_attended ? formatShortDate(m.last_attended) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-sand rounded-xl px-5 py-5">
      <p className="text-xs text-muted mb-2">{label}</p>
      <p className="text-2xl font-semibold text-charcoal">{value}</p>
    </div>
  );
}

function BookingLinkPanel({
  slug,
  baseUrl,
  bookingsThisMonth,
}: {
  slug: string;
  baseUrl: string;
  bookingsThisMonth: number;
}) {
  const url = `${baseUrl}/${slug}`;
  return (
    <div className="bg-white border border-sand rounded-xl px-5 py-5">
      <p className="text-xs font-mono text-charcoal break-all mb-3">{url}</p>
      <p className="text-xs text-muted mb-4">
        <strong className="text-charcoal">{bookingsThisMonth}</strong> booking{bookingsThisMonth !== 1 ? "s" : ""} this month
      </p>
      <CopyButton url={url} />
    </div>
  );
}

// Thin client wrapper just for the copy action
import CopyButton from "./CopyButton";
