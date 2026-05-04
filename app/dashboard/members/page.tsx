import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCommunityForHost,
  getAllMembers,
  computeMemberPageStats,
  getMemberStatusTag,
} from "@/lib/queries";
import { formatPrice, formatShortDate } from "@/lib/utils";

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const community = await getCommunityForHost(supabase, user.id);
  if (!community) redirect("/onboarding");

  const members = await getAllMembers(supabase, community.id);
  const stats = computeMemberPageStats(members);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-charcoal">Members</h1>
        <p className="text-sm text-muted mt-1">{community.name}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={stats.total.toString()} />
        <StatCard label="Regulars (5+ bookings)" value={stats.regulars.toString()} />
        <StatCard label="At risk" value={stats.atRisk.toString()} sub="14+ days inactive" />
        <StatCard label="New this month" value={stats.newThisMonth.toString()} />
      </div>

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
              {members.map((member, i) => {
                const tag = getMemberStatusTag(member);
                return (
                  <tr
                    key={member.id}
                    className={i < members.length - 1 ? "border-b border-sand/60" : ""}
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
