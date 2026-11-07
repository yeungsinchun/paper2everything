import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Button } from "../core/Button.jsx";
export function QuickCheck({ prompt, figure, options, answer = 0, why, kind = "mc", xp = 10, step, total, onResult, onNext }) {
  const opts = kind === "tf" ? [{ label: "True", icon: "check" }, { label: "False", icon: "x" }] : options || [];
  const [wrong, setWrong] = React.useState([]);
  const [done, setDone] = React.useState(false);
  const earned = Math.max(2, xp - 4 * wrong.length);
  const pick = (i) => {
    if (done || wrong.includes(i)) return;
    if (i === answer) { setDone(true); onResult && onResult({ correct: true, attempts: wrong.length + 1, xp: earned }); }
    else { setWrong([...wrong, i]); onResult && onResult({ correct: false, attempts: wrong.length + 1, xp: 0 }); }
  };
  const reset = () => { setWrong([]); setDone(false); };
  const state = done ? "ok" : wrong.length ? "nudge" : null;
  return (
    <section className="p2n-qc" aria-live="polite">
      <div className="p2n-qc-head">
        <Icon name="zap" /><span className="p2n-label">Quick check</span>
        {total > 1 && <span className="p2n-dots">{Array.from({ length: total }, (_, k) => <i key={k} className={k < step ? "on" : k === step ? "now" : ""} />)}</span>}
      </div>
      <p className="p2n-qc-q">{prompt}</p>
      {figure && <div className="p2n-qc-fig">{figure}</div>}
      <div className="p2n-qc-opts" role="group">
        {opts.map((o, i) => {
          const cls = done ? (i === answer ? "is-ok" : "is-dim") : wrong.includes(i) ? "is-nudge" : "";
          return (
            <button key={i} type="button" className={`p2n-qc-opt ${cls}`} disabled={done || wrong.includes(i)} onClick={() => pick(i)}>
              {o.icon && <Icon name={o.icon} size={22} />}{o.figure}{o.label && <span>{o.label}</span>}
            </button>
          );
        })}
      </div>
      <div className={`p2n-qc-fb ${state ? "open" : ""}`}><div>
        {state && <div className={`p2n-qc-fbrow ${state}`}>
          <Icon name={done ? "circle-check" : "lightbulb"} size={22} />
          <span className="why">{done ? why : "Not quite. Try another."}</span>
          {done && <span className="p2n-xp">+{earned} XP</span>}
          {done && <Button variant="ghost" size="sm" iconOnly icon="rotate-ccw" label="Try again" onClick={reset} />}
          {done && onNext && <Button variant="primary" size="sm" icon="arrow-right" onClick={onNext}>Next</Button>}
        </div>}
      </div></div>
    </section>
  );
}
