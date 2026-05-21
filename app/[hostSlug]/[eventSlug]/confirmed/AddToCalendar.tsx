"use client";

export default function AddToCalendar({
  eventName,
  eventDate,
  eventTime,
  eventLocation,
}: {
  eventName: string;
  eventDate: string; // YYYY-MM-DD
  eventTime: string; // HH:MM
  eventLocation: string;
}) {
  function toDt(date: string, time: string) {
    return date.replace(/-/g, "") + "T" + time.replace(/:/g, "").slice(0, 4) + "00";
  }

  function endDt(date: string, time: string) {
    const [h, m] = time.split(":").map(Number);
    const endH = (h + 1) % 24;
    return (
      date.replace(/-/g, "") +
      "T" +
      String(endH).padStart(2, "0") +
      String(m).padStart(2, "0") +
      "00"
    );
  }

  const start = toDt(eventDate, eventTime);
  const end = endDt(eventDate, eventTime);

  const googleUrl =
    `https://www.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(eventName)}` +
    `&dates=${start}/${end}` +
    `&location=${encodeURIComponent(eventLocation)}`;

  function downloadIcs() {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Commons//EN",
      "BEGIN:VEVENT",
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${eventName}`,
      `LOCATION:${eventLocation}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName.replace(/\s+/g, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-3 mb-8">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 border border-sand text-charcoal rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-sand/30 transition-colors text-center"
      >
        + Google Calendar
      </a>
      <button
        onClick={downloadIcs}
        className="flex-1 border border-sand text-charcoal rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-sand/30 transition-colors"
      >
        + Apple Calendar
      </button>
    </div>
  );
}
