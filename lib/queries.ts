import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createServiceClient } from "@/lib/supabase/server";

type Client = SupabaseClient<Database>;
type MemberRow = Database["public"]["Tables"]["members"]["Row"];

// ─── Community ────────────────────────────────────────────────────────────────

export async function getCommunityForHost(supabase: Client, hostId: string) {
  const { data } = await supabase
    .from("communities")
    .select("*")
    .eq("host_id", hostId)
    .single();
  return data;
}

// ─── Dashboard overview ───────────────────────────────────────────────────────

export async function getDashboardOverview(supabase: Client, hostId: string) {
  const community = await getCommunityForHost(supabase, hostId);
  if (!community) return null;

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [{ data: events }, { data: members }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, slug, event_date, event_time, location, price, currency, capacity, status")
      .eq("community_id", community.id)
      .order("event_date", { ascending: true }),
    supabase
      .from("members")
      .select("id, name, email, total_bookings, last_attended, total_spent, created_at, status")
      .eq("community_id", community.id)
      .order("created_at", { ascending: false }),
  ]);

  const allEvents = events ?? [];
  const allMembers = members ?? [];
  const eventIds = allEvents.map((e) => e.id);

  const svc = createServiceClient();
  const { data: bookings } =
    eventIds.length > 0
      ? await svc
          .from("bookings")
          .select("id, event_id, status, payment_status, amount_paid, created_at")
          .in("event_id", eventIds)
      : { data: [] };

  const allBookings = bookings ?? [];

  // Build per-event booking stats
  const bookingMap: Record<string, { confirmed: number; waitlisted: number; revenue: number }> = {};
  for (const b of allBookings) {
    if (!bookingMap[b.event_id]) bookingMap[b.event_id] = { confirmed: 0, waitlisted: 0, revenue: 0 };
    if (b.status === "confirmed") {
      bookingMap[b.event_id].confirmed++;
      bookingMap[b.event_id].revenue += b.amount_paid;
    }
    if (b.status === "waitlisted") bookingMap[b.event_id].waitlisted++;
  }

  // Stat: revenue this month
  const revenueThisMonth = allBookings
    .filter((b) => b.payment_status === "paid" && b.created_at >= startOfMonth)
    .reduce((sum, b) => sum + b.amount_paid, 0);

  // Stat: bookings this month (for link panel)
  const bookingsThisMonth = allBookings.filter(
    (b) => b.status === "confirmed" && b.created_at >= startOfMonth
  ).length;

  // Stat: avg fill rate across upcoming active events
  const upcomingEvents = allEvents.filter(
    (e) => e.event_date >= todayStr && e.status === "active"
  );
  const fillRates = upcomingEvents.map((e) => {
    const confirmed = bookingMap[e.id]?.confirmed ?? 0;
    return confirmed / e.capacity;
  });
  const avgFillRate =
    fillRates.length > 0 ? fillRates.reduce((s, r) => s + r, 0) / fillRates.length : 0;

  // Stat: return rate
  const totalMembers = allMembers.length;
  const returningCount = allMembers.filter((m) => m.total_bookings > 1).length;
  const returnRate = totalMembers > 0 ? returningCount / totalMembers : 0;

  // Alert: quiet members
  const quietMembersCount = allMembers.filter(
    (m) => !m.last_attended || m.last_attended < fourteenDaysAgo
  ).length;

  // Next 3 upcoming events
  const nextEvents = upcomingEvents.slice(0, 3).map((e) => ({
    ...e,
    confirmedCount: bookingMap[e.id]?.confirmed ?? 0,
    waitlistedCount: bookingMap[e.id]?.waitlisted ?? 0,
    revenue: bookingMap[e.id]?.revenue ?? 0,
  }));

  // Last 5 members
  const recentMembers = allMembers.slice(0, 5);

  return {
    community,
    stats: { totalMembers, revenueThisMonth, avgFillRate, returnRate, bookingsThisMonth },
    quietMembersCount,
    nextEvents,
    recentMembers,
  };
}

// ─── Events page ──────────────────────────────────────────────────────────────

export async function getAllEventsWithStats(supabase: Client, communityId: string) {
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("community_id", communityId);

  if (!events || events.length === 0) return [];

  const eventIds = events.map((e) => e.id);
  const svc = createServiceClient();
  const { data: bookings } = await svc
    .from("bookings")
    .select("event_id, status, amount_paid")
    .in("event_id", eventIds);

  const countMap: Record<string, { confirmed: number; waitlisted: number; revenue: number }> = {};
  for (const b of bookings ?? []) {
    if (!countMap[b.event_id]) countMap[b.event_id] = { confirmed: 0, waitlisted: 0, revenue: 0 };
    if (b.status === "confirmed") {
      countMap[b.event_id].confirmed++;
      countMap[b.event_id].revenue += b.amount_paid;
    }
    if (b.status === "waitlisted") countMap[b.event_id].waitlisted++;
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const withStats = events.map((e) => ({
    ...e,
    confirmedCount: countMap[e.id]?.confirmed ?? 0,
    waitlistedCount: countMap[e.id]?.waitlisted ?? 0,
    revenue: countMap[e.id]?.revenue ?? 0,
    isPast: e.event_date < todayStr,
  }));

  const upcoming = withStats
    .filter((e) => !e.isPast)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const past = withStats
    .filter((e) => e.isPast)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

  return [...upcoming, ...past];
}

// ─── Members page ─────────────────────────────────────────────────────────────

export async function getAllMembers(supabase: Client, communityId: string) {
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export function computeMemberPageStats(members: MemberRow[]) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  return {
    total: members.length,
    regulars: members.filter((m) => m.total_bookings >= 5).length,
    atRisk: members.filter((m) => !m.last_attended || m.last_attended < fourteenDaysAgo).length,
    newThisMonth: members.filter((m) => m.created_at >= thirtyDaysAgo).length,
  };
}

export function getMemberStatusTag(member: MemberRow): { label: string; cls: string } {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  if (!member.last_attended || member.last_attended < fourteenDaysAgo) {
    return { label: "At risk", cls: "text-red-600 bg-red-50" };
  }
  if (member.total_bookings >= 10) return { label: "VIP", cls: "text-amber-700 bg-amber-50" };
  if (member.total_bookings >= 3) return { label: "Regular", cls: "text-green-700 bg-green-50" };
  return { label: "New", cls: "text-blue-600 bg-blue-50" };
}

// ─── Payments page ────────────────────────────────────────────────────────────

export async function getPaymentsData(supabase: Client, communityId: string) {
  const { data: events } = await supabase
    .from("events")
    .select("id, name, event_date")
    .eq("community_id", communityId);

  if (!events || events.length === 0) {
    return { transactions: [], stats: { revenueThisMonth: 0, totalRevenue: 0, avgPerBooking: 0 } };
  }

  const eventIds = events.map((e) => e.id);
  const eventMap: Record<string, { name: string; event_date: string }> = {};
  for (const e of events) eventMap[e.id] = { name: e.name, event_date: e.event_date };

  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();

  const svc = createServiceClient();
  const { data: bookings } = await svc
    .from("bookings")
    .select("id, event_id, member_name, member_email, status, payment_status, amount_paid, created_at")
    .in("event_id", eventIds)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  const allBookings = bookings ?? [];
  const paidBookings = allBookings.filter((b) => b.payment_status === "paid");
  const totalRevenue = paidBookings.reduce((s, b) => s + b.amount_paid, 0);
  const revenueThisMonth = paidBookings
    .filter((b) => b.created_at >= startOfMonth)
    .reduce((s, b) => s + b.amount_paid, 0);
  const avgPerBooking = paidBookings.length > 0 ? Math.round(totalRevenue / paidBookings.length) : 0;

  const transactions = allBookings.map((b) => ({
    id: b.id,
    memberName: b.member_name,
    memberEmail: b.member_email,
    eventName: eventMap[b.event_id]?.name ?? "—",
    eventDate: eventMap[b.event_id]?.event_date ?? "",
    amount: b.amount_paid,
    paymentStatus: b.payment_status,
    createdAt: b.created_at,
  }));

  return { transactions, stats: { revenueThisMonth, totalRevenue, avgPerBooking } };
}

// ─── Alerts page ──────────────────────────────────────────────────────────────

export async function getAlertsData(supabase: Client, communityId: string) {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: quietMembers }, { data: newMembers }, { data: activeEvents }] = await Promise.all([
    supabase
      .from("members")
      .select("id, name, email, last_attended")
      .eq("community_id", communityId)
      .or(`last_attended.lt.${fourteenDaysAgo},last_attended.is.null`),
    supabase
      .from("members")
      .select("id, name, email, created_at")
      .eq("community_id", communityId)
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("events")
      .select("id, name, slug")
      .eq("community_id", communityId)
      .eq("status", "active"),
  ]);

  // Waitlist counts per event
  type WaitlistEvent = { eventId: string; eventName: string; eventSlug: string; count: number };
  let waitlistEvents: WaitlistEvent[] = [];

  if (activeEvents && activeEvents.length > 0) {
    const eventIds = activeEvents.map((e) => e.id);
    const svc = createServiceClient();
    const { data: waitlisted } = await svc
      .from("bookings")
      .select("event_id")
      .in("event_id", eventIds)
      .eq("status", "waitlisted");

    if (waitlisted && waitlisted.length > 0) {
      const countMap: Record<string, number> = {};
      for (const b of waitlisted) countMap[b.event_id] = (countMap[b.event_id] ?? 0) + 1;

      const eventMap: Record<string, { name: string; slug: string }> = {};
      for (const e of activeEvents) eventMap[e.id] = { name: e.name, slug: e.slug };

      waitlistEvents = Object.entries(countMap).map(([eventId, count]) => ({
        eventId,
        eventName: eventMap[eventId]?.name ?? "",
        eventSlug: eventMap[eventId]?.slug ?? "",
        count,
      }));
    }
  }

  return {
    quietMembers: quietMembers ?? [],
    newMembers: newMembers ?? [],
    waitlistEvents,
  };
}
