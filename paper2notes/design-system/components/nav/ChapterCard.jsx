import React from "react";
import { Icon } from "../core/Icon.jsx";
import { ProgressRing } from "../core/ProgressRing.jsx";
export function ChapterCard({ label, title, sub, icon, iconSrc, progress = 0, tone = "var(--teal-600)", ...rest }) {
  return (
    <button type="button" className="p2n-cc" style={{ "--tone": tone }} {...rest}>
      <span className="p2n-cc-ic"><ProgressRing value={progress} size={68} color={tone} /><span className="in"><Icon name={icon} src={iconSrc} size={32} /></span></span>
      <span className="p2n-cc-t">{label && <span className="p2n-label">{label}</span>}<b>{title}</b>{sub && <small>{sub}</small>}</span>
      <Icon name="chevron-right" style={{ color: "var(--ink-3)" }} />
    </button>
  );
}
