import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCommunityForHost,
  getAllMembers,
  computeMemberPageStats,
  getMemberStatusTag,
  getLapsedRegulars,
} from "@/lib/queries";
import { formatPrice, formatShortDate } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ filter?: string }>;
}

export default async function MembersPage({ searchParams }: Props) {
  const { filter } = await searchParams;
  const isAtRiskFilter = filter === "at-risk";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const community = await getCommunityForHost(supabase, user.id);
  if (!community) redirect("/complete-profile");

  const [members, lapsedMembers] = await Promise.all([
    getAllMembers(supabase, community.id),
    getLapsedRegulars(community.id),
  ]);

  const lapsedIds = new Set(lapsedMembers.map((m) => m.id));
  const stats = computeMemberPageStats(members, lapsedIds);

  const sortedMembers = isAtRiskFilter
    ? [...members].sort((a, b) => {
        const aRisk = lapsedIds.has(a.id) ? 0 : 1;
        const bRisk = lapsedIds.has(b.id) ? 0 : 1;
        return aRisk - bRisk;
      })
    : members;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-charcoal">Members</h1>
        <p className="text-sm text-muted mt-1">{community.name}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={stats.total.toString()} />
        <StatCard label="Regulars" value={stats.regulars.toString()} sub="Members who have booked 5 or more events" />
        <StatCard label="At risk" value={stats.atRisk.toString()} sub="Members who have missed your last 3 or more events" />
        <StatCard label="New this month" value={stats.newThisMonth.toString()} sub="Members who joined in the last 30 days" />
      </div>

      {/* At-risk filter banner */}
      {isAtRiskFilter && lapsedIds.size > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center gap-3">
          <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-amber-800">
            These members have missed your last 3 events — they&apos;re sorted to the top.
          </p>
        </div>
      )}

      {/* Members table */}
      {members.length === 0 ? (
        <div className="bg-white border border-sand rounded-xl px-6 py-12 text-center">
          <p className="text-muted text-sm">No members yet. They&rsquo;ll appear here after their first booking.</p>
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
                <th className="text-left px-5 py-3 text-xs text-muted font-medium">Status</th>
                <th className="text-right px-5 py-3 text-xs text-muted font-medium">Total spent</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((member, i) => {
                const tag = getMemberStatusTag(member, lapsedIds);
                const isHighlighted = isAtRiskFilter && lapsedIds.has(member.id);
                return (
                  <tr
                    key={member.id}
                    className={[
                      i < sortedMembers.length - 1 ? "border-b border-sand/60" : "",
                      isHighlighted ? "bg-amber-50/50" : "",
                    ].join(" ")}
                  >
                    <td className="px-5 py-3.5 font-medium text-charcoal">{member.name}</td>
                    <td className="px-5 py-3.5 text-muted">{member.email}</td>
                    <td className="px-4 py-3.5 text-center text-charcoal">{member.total_bookings}</td>
                    <td className="px-5 py-3.5 text-muted">
                      {member.last_attended ? formatShortDate(member.last_attended) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tag.cls}`}>
                        {tag.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-charcoal">
                      {member.total_spent === 0 ? "—" : formatPrice(member.total_spent)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-sand rounded-xl px-5 py-5">
      <p className="text-xs text-muted mb-2">{label}</p>
      <p className="text-2xl font-semibold text-charcoal">{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}
