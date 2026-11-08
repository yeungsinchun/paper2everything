// Demo figures drawn to the figure guideline: 480-wide viewBox, --fig-* colours, stroke 1.5/2.5/4, arrowhead 10.
function FigDefs({ ids }) {
  return <defs>{ids.map((k) => <marker key={k} id={"ah-" + k} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L10 5L0 10z" fill={`var(--fig-${k})`} /></marker>)}</defs>;
}
const figSym = { fontFamily: "KaTeX_Main,'Times New Roman',serif", fontStyle: "italic", fontSize: 22 };

function FigPathVsDisplacement() {
  const path = "M60 170 C120 40 220 40 260 120 S380 200 420 90";
  return (
    <svg viewBox="0 0 480 230">
      <FigDefs ids={["displacement"]} />
      <style>{`.p2nk-path{stroke-dasharray:520;stroke-dashoffset:520;animation:p2nk-draw var(--fig-anim) var(--ease-out) forwards}.p2nk-s{opacity:0;animation:p2nk-in var(--dur) var(--ease-out) forwards;animation-delay:calc(var(--fig-anim) + .1s)}@keyframes p2nk-draw{to{stroke-dashoffset:0}}@keyframes p2nk-in{to{opacity:1}}`}</style>
      <path className="p2nk-path" d={path} fill="none" stroke="var(--fig-distance)" strokeWidth="2.5" strokeDasharray="7 6" strokeLinecap="round" />
      <g className="p2nk-s">
        <path d="M66 166L410 96" stroke="var(--fig-displacement)" strokeWidth="4" strokeLinecap="round" markerEnd="url(#ah-displacement)" />
        <text x="236" y="156" fill="var(--fig-displacement)" style={figSym}>s</text>
      </g>
      <circle cx="60" cy="170" r="6" fill="var(--fig-ink)" /><circle cx="420" cy="90" r="6" fill="var(--fig-ink)" />
      <text x="48" y="200" fontFamily="Nunito" fontWeight="700" fontSize="14" fill="var(--ink-2)">start</text>
      <text x="404" y="72" fontFamily="Nunito" fontWeight="700" fontSize="14" fill="var(--ink-2)">end</text>
      <text x="150" y="44" fontFamily="Nunito" fontWeight="700" fontSize="14" fill="var(--fig-distance)">distance</text>
    </svg>
  );
}

function FigTipToTail() {
  return (
    <svg viewBox="0 0 480 220">
      <FigDefs ids={["displacement", "guide"]} />
      <path d="M80 180H280" stroke="var(--fig-displacement)" strokeWidth="4" strokeLinecap="round" markerEnd="url(#ah-displacement)" opacity=".45" />
      <path d="M284 180V50" stroke="var(--fig-displacement)" strokeWidth="4" strokeLinecap="round" markerEnd="url(#ah-displacement)" opacity=".45" />
      <path d="M82 178L280 54" stroke="var(--fig-displacement)" strokeWidth="4" strokeLinecap="round" markerEnd="url(#ah-displacement)" />
      <text x="170" y="206" fontFamily="JetBrains Mono" fontWeight="700" fontSize="14" fill="var(--ink-2)">4 m</text>
      <text x="296" y="120" fontFamily="JetBrains Mono" fontWeight="700" fontSize="14" fill="var(--ink-2)">3 m</text>
      <text x="150" y="108" fill="var(--fig-displacement)" style={figSym}>5 m</text>
    </svg>
  );
}

// Option figures for a quick check: which arrow is the displacement?
function OptArrow({ d, color = "var(--fig-displacement)", dashed }) {
  return (
    <svg viewBox="0 0 120 70" width="110" height="64">
      <FigDefs ids={["displacement", "distance"]} />
      <circle cx="16" cy="54" r="4" fill="var(--fig-ink)" /><circle cx="104" cy="18" r="4" fill="var(--fig-ink)" />
      <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={dashed ? "5 5" : undefined} markerEnd={dashed ? undefined : `url(#ah-${color.includes("distance") ? "distance" : "displacement"})`} />
    </svg>
  );
}

Object.assign(window, { FigPathVsDisplacement, FigTipToTail, OptArrow });
