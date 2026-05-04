"use client";

import { useState } from "react";

export default function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="w-full bg-charcoal text-cream rounded-lg px-4 py-2 text-xs font-medium hover:bg-charcoal/90 transition-colors"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
