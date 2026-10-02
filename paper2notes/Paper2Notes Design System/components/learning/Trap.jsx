import React from "react";
import { Icon } from "../core/Icon.jsx";
export function Trap({ children, wrong, right, label = "Exam trap" }) {
  return (
    <aside className="p2n-trap">
      <div className="p2n-trap-h"><Icon name="triangle-alert" /><span className="p2n-label">{label}</span></div>
      {children && <div className="p2n-trap-t">{children}</div>}
      {(wrong || right) && <div className="p2n-trap-pair">
        {wrong && <div className="no"><Icon name="x" /><span>{wrong}</span></div>}
        {right && <div className="yes"><Icon name="check" />{right}</div>}
      </div>}
    </aside>
  );
}
