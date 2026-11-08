import React from "react";
export function Formula({ children, terms = [] }) {
  return (
    <div className="p2n-eq">
      <div className="p2n-eq-f">{children}</div>
      {terms.length > 0 && <ul className="p2n-eq-terms">{terms.map((t, i) => (
        <li key={i} style={t.color ? { "--c": t.color } : null}><b>{t.sym}</b>{t.meaning}{t.unit && <span className="u">{t.unit}</span>}</li>))}</ul>}
    </div>
  );
}
