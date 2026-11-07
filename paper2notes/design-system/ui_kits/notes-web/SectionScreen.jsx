const CHECKS = [
  { prompt: "Which arrow is the displacement?", options: [
      { figure: <OptArrow d="M16 54 C40 0 80 70 100 22" color="var(--fig-distance)" dashed /> },
      { figure: <OptArrow d="M20 52L98 21" /> },
      { figure: <OptArrow d="M16 54H100V26" /> }], answer: 1, why: "Straight line, start → end." },
  { prompt: "Walk 3 m east, then 3 m west. Displacement?", options: [{ label: "6 m" }, { label: "0 m" }, { label: "3 m" }], answer: 1, why: "Back at the start → zero." },
  { kind: "tf", prompt: "Distance can be negative.", answer: 1, why: "Distance is a size only: ≥ 0." },
];

function SectionScreen({ onXP, toast }) {
  const [i, setI] = React.useState(0);
  const [done, setDone] = React.useState([]);
  const c = CHECKS[i];
  const result = (r) => {
    if (!r.correct) return;
    onXP(r.xp, r.attempts === 1);
    setDone((d) => (d.includes(i) ? d : [...d, i]));
  };
  const lo = [
    { text: "Distinguish distance and displacement", code: "II.1a", done: done.includes(0) && done.includes(1) },
    { text: "Add displacements tip-to-tail", code: "II.1b", done: done.includes(2) },
  ];
  return (
    <main style={kitWrap}>
      <div><span className="p2n-label" style={{ color: "var(--book2)" }}>Ch.1 · 1.1</span><h1 style={{ marginTop: 6 }}>Distance vs displacement</h1></div>
      <LearningObjectives items={lo} />
      <FigureFrame num="1.1" caption="Distance follows the path. Displacement doesn’t." animated><FigPathVsDisplacement /></FigureFrame>
      <Trap wrong="Distance = 0 m" right="Displacement = 0 m">Walked a loop, back at the start?</Trap>
      <FigureFrame num="1.2" caption="Add tip-to-tail. Resultant: start of first → end of last."><FigTipToTail /></FigureFrame>
      <Formula terms={[{ sym: "s", meaning: "displacement", unit: "m", color: "var(--fig-displacement)" }]}>s = √(4² + 3²) = 5 m</Formula>
      <QuickCheck key={i} {...c} step={i} total={CHECKS.length} xp={10} onResult={result} onNext={i < CHECKS.length - 1 ? () => setI(i + 1) : undefined} />
      <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 30 }}>
        <HelpBubble locations={[{ title: "Distance vs displacement", where: "Ch.1 · Fig 1.1" }, { title: "Adding vectors", where: "Ch.1 · Fig 1.2" }, { title: "Pythagoras for vectors", where: "Ch.1 · Formula" }]} />
      </div>
    </main>
  );
}
Object.assign(window, { SectionScreen });
