import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatDate, formatTime } from "@/lib/utils";
import AddToCalendar from "./AddToCalendar";

interface Props {
  params: Promise<{ hostSlug: string; eventSlug: string }>;
  searchParams: Promise<{ name?: string; status?: string; email?: string; ref?: string }>;
}

export default async function ConfirmedPage({ params, searchParams }: Props) {
  const { hostSlug, eventSlug } = await params;
  const { name, status, email, ref } = await searchParams;
  const isWaitlisted = status === "waitlisted";

  const supabase = await createClient();

  const { data: community } = await supabase
    .from("communities")
    .select("id, name, slug")
    .eq("slug", hostSlug)
    .single();

  if (!community) notFound();

  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: event } = await (svc.from("events") as any)
    .select("name, event_date, event_time, location, location_url")
    .eq("community_id", community.id)
    .eq("slug", eventSlug)
    .single();

  if (!event) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventData = event as any;
  const locationUrl = eventData.location_url as string | null;

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full mx-auto text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-mint border border-[#2A6B4D]/30 flex items-center justify-center mx-auto mb-8">
          {isWaitlisted ? (
            <svg className="w-8 h-8 text-stone" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-sea-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* Heading */}
        <p className="text-[13px] text-stone mb-2 tracking-wide uppercase">
          {community.name}
        </p>
        <h1 className="font-semibold text-[34px] tracking-tight text-carbon mb-2">
          {isWaitlisted ? "You're on the waitlist." : "You're in."}
        </h1>
        <p className="text-stone mb-10">
          {isWaitlisted
            ? "We'll notify you by email if a spot opens up. You haven't been charged anything."
            : name ? `See you there, ${name}.` : "See you there."}
        </p>

        {/* Event detail card */}
        <div className="bg-white border border-[#D8D2C6] rounded-xl p-6 text-left mb-4">
          <p className="font-semibold text-carbon mb-3">{event.name}</p>
          <div className="flex flex-col gap-2 text-sm text-stone">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-sea-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>{formatDate(event.event_date)} at {formatTime(event.event_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-sea-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {locationUrl ? (
                <a
                  href={locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sea-green underline hover:opacity-80 transition-opacity"
                >
                  {event.location}
                </a>
              ) : (
                <span>{event.location}</span>
              )}
            </div>
          </div>
        </div>

        {/* Booking ref */}
        {ref && (
          <p className="text-[13px] text-stone font-medium mb-6">Booking ref: <span className="font-mono text-carbon">{ref}</span></p>
        )}

        {/* Add to calendar — confirmed only */}
        {!isWaitlisted && (
          <AddToCalendar
            eventName={event.name}
            eventDate={event.event_date}
            eventTime={event.event_time}
            eventLocation={event.location}
          />
        )}

        {/* Confirmation note */}
        {!isWaitlisted && (
          <p className="text-[15px] text-stone mb-8">
            {email
              ? <>A confirmation will be sent to <span className="text-carbon font-medium">{email}</span></>
              : "A confirmation email will be sent to you."}
          </p>
        )}

        {/* Back link */}
        <Link
          href={`/${hostSlug}`}
          className="text-sm text-sea-green underline underline-offset-4 hover:opacity-80 transition-opacity"
        >
          Explore more events &rarr;
        </Link>

        {/* Powered by Commons */}
        <p className="text-[11px] text-stone mt-10">Powered by Commons</p>
      </div>
    </main>
  );
}
