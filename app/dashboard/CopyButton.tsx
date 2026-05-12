"use client";

import { useState } from "react";

export default function CopyButton({ path, className }: { path: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const fullUrl = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className={className ?? "w-full bg-charcoal text-cream rounded-lg px-4 py-2 text-xs font-medium hover:bg-charcoal/90 transition-colors"}
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
