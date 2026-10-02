import React from "react";
import { Icon } from "../core/Icon.jsx";
const TIER = { bronze: "var(--tier-bronze)", silver: "var(--tier-silver)", gold: "var(--tier-gold)" };
export function AchievementBadge({ icon = "trophy", title, tier = "gold", progress = 0, goal = 1, unlocked }) {
  const on = unlocked ?? progress >= goal;
  return (
    <div className={`p2n-badge ${on ? "" : "locked"}`} title={title}>
      <span className="p2n-medal" style={{ "--t": TIER[tier] }}><Icon name={on ? icon : "lock"} size={34} /></span>
      <b>{title}</b>
      {!on && goal > 1 && <span className="bar"><i style={{ width: (progress / goal) * 100 + "%" }} /></span>}
    </div>
  );
}
