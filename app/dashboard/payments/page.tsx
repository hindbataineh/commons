import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCommunityForHost, getPaymentsData } from "@/lib/queries";
import { formatPrice, formatShortDate } from "@/lib/utils";

export default async function PaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const community = await getCommunityForHost(supabase, user.id);
  if (!community) redirect("/complete-profile");

  const { transactions, stats } = await getPaymentsData(supabase, community.id);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-[34px] font-semibold tracking-tight text-carbon">Payments</h1>
        <p className="text-[15px] text-stone mt-1">{community.name}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Revenue this month"
          value={stats.revenueThisMonth === 0 ? "—" : formatPrice(stats.revenueThisMonth)}
        />
        <StatCard
          label="Total revenue"
          value={stats.totalRevenue === 0 ? "—" : formatPrice(stats.totalRevenue)}
        />
        <StatCard
          label="Avg per booking"
          value={stats.avgPerBooking === 0 ? "—" : formatPrice(stats.avgPerBooking)}
        />
      </div>

      {/* Transactions */}
      <h2 className="text-[13px] text-stone uppercase tracking-wide mb-4">Transactions</h2>

      {transactions.length === 0 ? (
        <div className="bg-white border border-[#D8D2C6] rounded-xl px-6 py-12 text-center">
          <p className="text-stone text-[15px]">No transactions yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#D8D2C6] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#D8D2C6]">
                <th className="text-left px-5 py-3 text-[13px] text-stone font-medium">Member</th>
                <th className="text-left px-5 py-3 text-[13px] text-stone font-medium">Event</th>
                <th className="text-left px-5 py-3 text-[13px] text-stone font-medium">Date</th>
                <th className="text-right px-5 py-3 text-[13px] text-stone font-medium">Amount</th>
                <th className="text-left px-5 py-3 text-[13px] text-stone font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr key={tx.id} className={i < transactions.length - 1 ? "border-b border-[#D8D2C6]/60" : ""}>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-carbon">{tx.memberName}</p>
                    <p className="text-[13px] text-stone">{tx.memberEmail}</p>
                  </td>
                  <td className="px-5 py-3.5 text-stone">{tx.eventName}</td>
                  <td className="px-5 py-3.5 text-stone">
                    {tx.eventDate ? formatShortDate(tx.eventDate) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-carbon">
                    {tx.amount === 0 ? (
                      <span className="text-stone font-normal">Free</span>
                    ) : (
                      formatPrice(tx.amount)
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <PaymentBadge status={tx.paymentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#D8D2C6] rounded-xl px-5 py-5">
      <p className="text-[13px] text-stone mb-2">{label}</p>
      <p className="text-2xl font-semibold text-carbon">{value}</p>
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "text-sea-green bg-mint",
    free: "text-stone bg-[#D8D2C6]/50",
    pending: "text-stone bg-[#D8D2C6]/50",
    refunded: "text-red-600 bg-red-50",
  };
  const labels: Record<string, string> = {
    paid: "Paid",
    free: "Free",
    pending: "Pending",
    refunded: "Refunded",
  };
  const cls = styles[status] ?? "text-stone bg-[#D8D2C6]/50";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {labels[status] ?? status}
    </span>
  );
}
