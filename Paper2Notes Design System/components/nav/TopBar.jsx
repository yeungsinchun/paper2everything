import React from "react";
import { Icon } from "../core/Icon.jsx";
import { StatPill } from "../game/StatPill.jsx";
export function TopBar({ crumbs = [], streak, xp, level, onHome }) {
  return (
    <header className="p2n-top">
      <a className="p2n-top-brand" href="#" onClick={(e) => { e.preventDefault(); onHome && onHome(); }}>paper<i>2</i>notes</a>
      {crumbs.length > 0 && <nav className="p2n-top-crumb">{crumbs.map((c, i) => <React.Fragment key={i}><Icon name="chevron-right" size={16} style={{ color: "var(--ink-3)" }} /><span>{c}</span></React.Fragment>)}</nav>}
      <span className="p2n-top-stats">
        {streak != null && <StatPill kind="streak" value={streak} />}
        {xp != null && <StatPill kind="xp" value={xp} />}
        {level != null && <StatPill kind="level" value={level} />}
      </span>
    </header>
  );
}
