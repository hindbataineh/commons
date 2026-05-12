"use client";

import { useEffect, useState } from "react";
import CopyButton from "./CopyButton";

export default function BookingLinkPanel({
  path,
  bookingsThisMonth,
}: {
  path: string;
  bookingsThisMonth: number;
}) {
  const [displayUrl, setDisplayUrl] = useState(path);

  useEffect(() => {
    setDisplayUrl(`${window.location.origin}${path}`);
  }, [path]);

  return (
    <div className="bg-white border border-sand rounded-xl px-5 py-5">
      <p className="text-xs font-mono text-charcoal break-all mb-3">{displayUrl}</p>
      <p className="text-xs text-muted mb-4">
        <strong className="text-charcoal">{bookingsThisMonth}</strong>{" "}
        booking{bookingsThisMonth !== 1 ? "s" : ""} this month
      </p>
      <CopyButton path={path} />
    </div>
  );
}
