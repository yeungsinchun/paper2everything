const { Button, Icon, ProgressRing, ChapterCard, TopBar, XPBar, StatPill, AchievementBadge, QuickCheck, LearningObjectives, FigureFrame, Formula, Trap, HelpBubble } = window.Paper2NotesDesignSystem_ff940d;

const kitWrap = { maxWidth: 720, margin: "0 auto", padding: "24px 16px 120px", display: "grid", gap: 16 };

const BOOKS = [
  { id: "book2", label: "Book 2", title: "Force & Motion", icon: "rocket", tone: "var(--book2)", progress: 0.32 },
  { id: "book4", label: "Book 4", title: "Electricity & Magnetism", icon: "zap", tone: "var(--book4)", progress: 0.08 },
  { id: "book5", label: "Book 5", title: "Radioactivity", icon: "radiation", tone: "var(--book5)", progress: 0 },
  { id: "qb", label: "Practice", title: "Question bank", icon: "library", tone: "var(--bookqb)", progress: 0.12 },
];
const CH2 = [
  ["Position & displacement", "move-up-right", 0.6], ["Velocity & acceleration", "gauge", 0.3], ["Forces & Newton I", "square-arrow-right", 0],
  ["Newton II & III", "weight", 0], ["Moments", "scale", 0], ["Work, energy, power", "battery-charging", 0], ["Momentum", "circle-dot-dashed", 0],
  ["Projectiles", "chart-spline", 0], ["Circular motion", "orbit", 0], ["Gravitation", "earth", 0],
];

function HomeScreen({ go, stats }) {
  return (
    <main style={kitWrap}>
      <button type="button" className="p2n-cc" style={{ "--tone": "var(--teal-600)", background: "var(--teal-600)", borderColor: "var(--teal-700)", color: "#fff", boxShadow: "var(--edge-brand)" }} onClick={() => go("section")}>
        <span className="p2n-cc-ic"><ProgressRing value={0.6} size={68} color="var(--sun-400)" /><span className="in" style={{ color: "#fff" }}><Icon name="move-up-right" size={32} /></span></span>
        <span className="p2n-cc-t"><span className="p2n-label" style={{ color: "var(--teal-100)" }}>Continue · Ch.1</span><b>Position & displacement</b></span>
        <Icon name="play" size={28} />
      </button>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <StatPill kind="streak" value={stats.streak} /><StatPill kind="xp" value={stats.xp} />
        <div style={{ flex: 1, minWidth: 180 }}><XPBar value={stats.xp % 500} max={500} level={Math.floor(stats.xp / 500) + 1} /></div>
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))" }}>
        {BOOKS.map((b) => <ChapterCard key={b.id} label={b.label} title={b.title} icon={b.icon} tone={b.tone} progress={b.progress} onClick={() => go(b.id === "book2" ? "book" : "home")} />)}
      </div>
    </main>
  );
}

function BookScreen({ go }) {
  return (
    <main style={kitWrap}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 56, height: 56, borderRadius: 18, background: "var(--book2-soft)", display: "grid", placeItems: "center", color: "var(--book2)" }}><Icon name="rocket" size={30} /></span>
        <div><span className="p2n-label">Book 2</span><h1>Force & Motion</h1></div>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {CH2.map(([t, ic, p], i) => <ChapterCard key={i} label={"Ch." + (i + 1)} title={t} icon={ic} progress={p} tone="var(--book2)" onClick={() => i === 0 && go("section")} />)}
      </div>
    </main>
  );
}

function AchievementsScreen({ stats }) {
  const list = [
    ["flame", "3-day streak", "bronze", 3, 3], ["flame", "7-day streak", "gold", stats.streak, 7], ["zap", "First try!", "gold", stats.firstTry ? 1 : 0, 1],
    ["target", "10 first-try", "silver", stats.firstTryCount, 10], ["book-open", "Chapter done", "bronze", 0, 1], ["trophy", "Book master", "gold", 1, 10],
    ["crosshair", "DSE sharpshooter", "silver", 2, 20], ["moon", "Night owl", "bronze", 0, 1],
  ];
  return (
    <main style={kitWrap}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><StatPill kind="streak" value={stats.streak} /><StatPill kind="xp" value={stats.xp} /><StatPill kind="level" value={Math.floor(stats.xp / 500) + 1} /></div>
      <XPBar value={stats.xp % 500} max={500} level={Math.floor(stats.xp / 500) + 1} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(112px,1fr))", gap: 20, justifyItems: "center", padding: "12px 0" }}>
        {list.map(([ic, t, tier, p, g]) => <AchievementBadge key={t} icon={ic} title={t} tier={tier} progress={p} goal={g} />)}
      </div>
    </main>
  );
}

Object.assign(window, { HomeScreen, BookScreen, AchievementsScreen, kitWrap });
