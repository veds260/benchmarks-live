"use client";

import { useEffect, useRef, useState } from "react";

export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (val: string) => {
    setLocal(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(val), 300);
  };

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search models, tools..."
        className="w-full pl-10 pr-4 py-2 bg-bg-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
      />
    </div>
  );
}
