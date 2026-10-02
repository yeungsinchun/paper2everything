import React from "react";
import { Icon } from "../core/Icon.jsx";
const ICON = { streak: "flame", xp: "zap", level: "star" };
export function StatPill({ kind = "xp", value }) {
  return <span className={`p2n-pill p2n-pill--${kind}`}><Icon name={ICON[kind]} size={18} />{value}</span>;
}
