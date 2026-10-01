import React from "react";
export function XPBar({ value = 0, max = 100, level = 1 }) {
  return (
    <div className="p2n-xpbar" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <b className="p2n-num" style={{ color: "var(--teal-600)" }}>Lv {level}</b>
      <span className="track"><span className="fill" style={{ display: "block", width: Math.min(100, (value / max) * 100) + "%" }} /></span>
      <span className="p2n-num" style={{ fontSize: 13, color: "var(--ink-2)" }}>{value}/{max}</span>
    </div>
  );
}
