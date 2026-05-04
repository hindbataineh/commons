import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime } from "@/lib/utils";

interface Props {
  params: Promise<{ hostSlug: string; eventSlug: string }>;
  searchParams: Promise<{ name?: string }>;
}

export default async function ConfirmedPage({ params, searchParams }: Props) {
  const { hostSlug, eventSlug } = await params;
  const { name } = await searchParams;

  const supabase = await createClient();

  const { data: community } = await supabase
    .from("communities")
    .select("id, name, slug")
    .eq("slug", hostSlug)
    .single();

  if (!community) notFound();

  const { data: event } = await supabase
    .from("events")
    .select("name, event_date, event_time, location")
    .eq("community_id", community.id)
    .eq("slug", eventSlug)
    .single();

  if (!event) notFound();

  return (
    <main className="min-h-screen bg-off-white flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full mx-auto text-center">
        {/* Checkmark */}
        <div className="w-16 h-16 rounded-full bg-charcoal flex items-center justify-center mx-auto mb-8">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Heading */}
        <p className="text-sm text-muted mb-2 tracking-wide uppercase">
          {community.name}
        </p>
        <h1 className="font-display text-5xl font-medium text-charcoal mb-2">
          You&rsquo;re in.
        </h1>
        {name && (
          <p className="text-muted mb-10">See you there, {name}.</p>
        )}

        {/* Event detail card */}
        <div className="bg-cream border border-sand rounded-xl p-6 text-left mb-8">
          <p className="font-medium text-charcoal mb-3">{event.name}</p>
          <div className="flex flex-col gap-2 text-sm text-muted">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>{formatDate(event.event_date)} at {formatTime(event.event_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span>{event.location}</span>
            </div>
          </div>
        </div>

        {/* Reminder note */}
        <p className="text-sm text-muted mb-8">
          You&rsquo;ll receive a reminder email before the event.
        </p>

        {/* Back link */}
        <Link
          href={`/${hostSlug}`}
          className="text-sm text-charcoal underline underline-offset-4 hover:text-terracotta transition-colors"
        >
          Explore more events &rarr;
        </Link>
      </div>
    </main>
  );
}
