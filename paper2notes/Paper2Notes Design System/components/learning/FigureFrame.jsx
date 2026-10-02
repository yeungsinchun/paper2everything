import React from "react";
import { Button } from "../core/Button.jsx";
export function FigureFrame({ num, caption, children, animated = false }) {
  const [run, setRun] = React.useState(0);
  return (
    <figure className="p2n-fig" style={{ margin: 0 }}>
      {num && <span className="p2n-fig-badge">Fig {num}</span>}
      <div className="p2n-fig-body" key={run}>{children}</div>
      {animated && <span className="p2n-fig-replay"><Button variant="secondary" size="sm" iconOnly icon="rotate-ccw" label="Replay" onClick={() => setRun(run + 1)} /></span>}
      {caption && <figcaption className="p2n-fig-cap">{caption}</figcaption>}
    </figure>
  );
}
