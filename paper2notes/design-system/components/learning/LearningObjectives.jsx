import React from "react";
import { Icon } from "../core/Icon.jsx";
export function LearningObjectives({ items = [], title = "Learning objectives", source = "EDB", defaultOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const n = items.filter((x) => x.done).length;
  return (
    <div className="p2n-lo">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name="target" size={22} style={{ color: "var(--teal-600)" }} />
        <span className="p2n-lo-title">{title}</span>
        <span className="p2n-chip">{source}</span>
        <span className="p2n-num" style={{ fontSize: 13, color: "var(--ink-2)" }}>{n}/{items.length}</span>
        <Icon name="chevron-down" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform var(--dur)" }} />
      </button>
      {open && <ul>{items.map((it, i) => (
        <li key={i} className={it.done ? "done" : ""}>
          <span className="tick">{it.done && <Icon name="check" size={14} />}</span>
          <span className="txt">{it.text}</span>
          {it.ext && <span className="p2n-chip p2n-chip--ext">Ext</span>}
          {it.code && <span className="p2n-chip">{it.code}</span>}
        </li>))}</ul>}
    </div>
  );
}
