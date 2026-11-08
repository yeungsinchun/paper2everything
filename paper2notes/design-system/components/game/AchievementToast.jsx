import React from "react";
import { Icon } from "../core/Icon.jsx";
const TIER = { bronze: "var(--tier-bronze)", silver: "var(--tier-silver)", gold: "var(--tier-gold)" };
export function AchievementToast({ icon = "trophy", title, tier = "gold" }) {
  return (
    <div className="p2n-toast" role="status">
      <span className="p2n-medal" style={{ "--t": TIER[tier] }}><Icon name={icon} size={22} /></span>
      <span><small>Unlocked</small><b>{title}</b></span>
    </div>
  );
}
