import React from "react";
export function ProgressRing({ value = 0, size = 64, stroke = 6, color = "var(--teal-500)", children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <span style={{ position: "relative", display: "inline-grid", placeItems: "center", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-soft)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))} style={{ transition: "stroke-dashoffset var(--dur-slow) var(--ease-out)" }} />
      </svg>
      <span style={{ position: "relative" }}>{children}</span>
    </span>
  );
}
