import React from "react";
import { Icon } from "../core/Icon.jsx";
export function HelpBubble({ locations = [], label = "Stuck?", defaultOpen = false, onPick }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <span className="p2n-help">
      {open && <div className="p2n-bubble" role="dialog" aria-label="Where to look">
        <span className="p2n-label">Read these, in order</span>
        <ol>{locations.map((l, i) => (
          <li key={i}><a href={l.href || "#"} onClick={(e) => { if (!l.href) e.preventDefault(); onPick && onPick(l, i); }}>
            <span className="n">{i + 1}</span><span style={{ flex: 1 }}>{l.title}<small>{l.where}</small></span><Icon name="chevron-right" />
          </a></li>))}</ol>
      </div>}
      <button type="button" className="p2n-fab" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name={open ? "x" : "circle-help"} size={22} />{label}
      </button>
    </span>
  );
}
