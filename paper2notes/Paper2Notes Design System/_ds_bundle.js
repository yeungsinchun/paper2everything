/* @ds-bundle: {"format":4,"namespace":"Paper2NotesDesignSystem_ff940d","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"ProgressRing","sourcePath":"components/core/ProgressRing.jsx"},{"name":"AchievementBadge","sourcePath":"components/game/AchievementBadge.jsx"},{"name":"AchievementToast","sourcePath":"components/game/AchievementToast.jsx"},{"name":"StatPill","sourcePath":"components/game/StatPill.jsx"},{"name":"XPBar","sourcePath":"components/game/XPBar.jsx"},{"name":"FigureFrame","sourcePath":"components/learning/FigureFrame.jsx"},{"name":"Formula","sourcePath":"components/learning/Formula.jsx"},{"name":"HelpBubble","sourcePath":"components/learning/HelpBubble.jsx"},{"name":"LearningObjectives","sourcePath":"components/learning/LearningObjectives.jsx"},{"name":"QuickCheck","sourcePath":"components/learning/QuickCheck.jsx"},{"name":"Trap","sourcePath":"components/learning/Trap.jsx"},{"name":"ChapterCard","sourcePath":"components/nav/ChapterCard.jsx"},{"name":"TopBar","sourcePath":"components/nav/TopBar.jsx"}],"sourceHashes":{"components/core/Button.jsx":"87b8381e6863","components/core/Icon.jsx":"4f8d5ae9075c","components/core/ProgressRing.jsx":"ddae6261b461","components/game/AchievementBadge.jsx":"2dd9b03ffe05","components/game/AchievementToast.jsx":"1349c5895076","components/game/StatPill.jsx":"836e5cd58a4d","components/game/XPBar.jsx":"cb2dcdb7ce3c","components/learning/FigureFrame.jsx":"0bd9d6f57477","components/learning/Formula.jsx":"6510aa28f466","components/learning/HelpBubble.jsx":"514de54f2037","components/learning/LearningObjectives.jsx":"08971b92923d","components/learning/QuickCheck.jsx":"35ac7cb3288a","components/learning/Trap.jsx":"7f280d358923","components/nav/ChapterCard.jsx":"ee4afd826dc0","components/nav/TopBar.jsx":"93c5d26a3e9a","ui_kits/notes-web/Figures.jsx":"b78eb43e2557","ui_kits/notes-web/Screens.jsx":"4f244993747e","ui_kits/notes-web/SectionScreen.jsx":"f38406ed00de"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.Paper2NotesDesignSystem_ff940d = window.Paper2NotesDesignSystem_ff940d || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Icon.jsx
try { (() => {
const LUCIDE = "https://unpkg.com/lucide-static@0.468.0/icons/";
function Icon({
  name,
  src,
  size,
  style,
  label
}) {
  const url = src || LUCIDE + name + ".svg";
  return /*#__PURE__*/React.createElement("span", {
    className: "p2n-icon",
    role: label ? "img" : undefined,
    "aria-label": label,
    "aria-hidden": label ? undefined : true,
    style: {
      "--src": `url(${url})`,
      ...(size ? {
        "--s": size + "px"
      } : null),
      ...style
    }
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Button({
  variant = "primary",
  size = "md",
  icon,
  iconOnly,
  children,
  label,
  href,
  ...rest
}) {
  const cls = `p2n-btn p2n-btn--${variant}${size !== "md" ? " p2n-btn--" + size : ""}${iconOnly ? " p2n-btn--icon" : ""}`;
  const inner = /*#__PURE__*/React.createElement(React.Fragment, null, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon
  }), !iconOnly && children);
  return href ? /*#__PURE__*/React.createElement("a", _extends({
    className: cls,
    href: href
  }, rest), inner) : /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls,
    "aria-label": iconOnly ? label : undefined
  }, rest), inner);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/ProgressRing.jsx
try { (() => {
function ProgressRing({
  value = 0,
  size = 64,
  stroke = 6,
  color = "var(--teal-500)",
  children
}) {
  const r = (size - stroke) / 2,
    c = 2 * Math.PI * r;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-grid",
      placeItems: "center",
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      transform: "rotate(-90deg)",
      position: "absolute",
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "var(--line-soft)",
    strokeWidth: stroke
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeDasharray: c,
    strokeDashoffset: c * (1 - Math.min(1, Math.max(0, value))),
    style: {
      transition: "stroke-dashoffset var(--dur-slow) var(--ease-out)"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative"
    }
  }, children));
}
Object.assign(__ds_scope, { ProgressRing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProgressRing.jsx", error: String((e && e.message) || e) }); }

// components/game/AchievementBadge.jsx
try { (() => {
const TIER = {
  bronze: "var(--tier-bronze)",
  silver: "var(--tier-silver)",
  gold: "var(--tier-gold)"
};
function AchievementBadge({
  icon = "trophy",
  title,
  tier = "gold",
  progress = 0,
  goal = 1,
  unlocked
}) {
  const on = unlocked ?? progress >= goal;
  return /*#__PURE__*/React.createElement("div", {
    className: `p2n-badge ${on ? "" : "locked"}`,
    title: title
  }, /*#__PURE__*/React.createElement("span", {
    className: "p2n-medal",
    style: {
      "--t": TIER[tier]
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: on ? icon : "lock",
    size: 34
  })), /*#__PURE__*/React.createElement("b", null, title), !on && goal > 1 && /*#__PURE__*/React.createElement("span", {
    className: "bar"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: progress / goal * 100 + "%"
    }
  })));
}
Object.assign(__ds_scope, { AchievementBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/AchievementBadge.jsx", error: String((e && e.message) || e) }); }

// components/game/AchievementToast.jsx
try { (() => {
const TIER = {
  bronze: "var(--tier-bronze)",
  silver: "var(--tier-silver)",
  gold: "var(--tier-gold)"
};
function AchievementToast({
  icon = "trophy",
  title,
  tier = "gold"
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "p2n-toast",
    role: "status"
  }, /*#__PURE__*/React.createElement("span", {
    className: "p2n-medal",
    style: {
      "--t": TIER[tier]
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 22
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("small", null, "Unlocked"), /*#__PURE__*/React.createElement("b", null, title)));
}
Object.assign(__ds_scope, { AchievementToast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/AchievementToast.jsx", error: String((e && e.message) || e) }); }

// components/game/StatPill.jsx
try { (() => {
const ICON = {
  streak: "flame",
  xp: "zap",
  level: "star"
};
function StatPill({
  kind = "xp",
  value
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: `p2n-pill p2n-pill--${kind}`
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: ICON[kind],
    size: 18
  }), value);
}
Object.assign(__ds_scope, { StatPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/StatPill.jsx", error: String((e && e.message) || e) }); }

// components/game/XPBar.jsx
try { (() => {
function XPBar({
  value = 0,
  max = 100,
  level = 1
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "p2n-xpbar",
    role: "progressbar",
    "aria-valuenow": value,
    "aria-valuemax": max
  }, /*#__PURE__*/React.createElement("b", {
    className: "p2n-num",
    style: {
      color: "var(--teal-600)"
    }
  }, "Lv ", level), /*#__PURE__*/React.createElement("span", {
    className: "track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fill",
    style: {
      display: "block",
      width: Math.min(100, value / max * 100) + "%"
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "p2n-num",
    style: {
      fontSize: 13,
      color: "var(--ink-2)"
    }
  }, value, "/", max));
}
Object.assign(__ds_scope, { XPBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/XPBar.jsx", error: String((e && e.message) || e) }); }

// components/learning/FigureFrame.jsx
try { (() => {
function FigureFrame({
  num,
  caption,
  children,
  animated = false
}) {
  const [run, setRun] = React.useState(0);
  return /*#__PURE__*/React.createElement("figure", {
    className: "p2n-fig",
    style: {
      margin: 0
    }
  }, num && /*#__PURE__*/React.createElement("span", {
    className: "p2n-fig-badge"
  }, "Fig ", num), /*#__PURE__*/React.createElement("div", {
    className: "p2n-fig-body",
    key: run
  }, children), animated && /*#__PURE__*/React.createElement("span", {
    className: "p2n-fig-replay"
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    size: "sm",
    iconOnly: true,
    icon: "rotate-ccw",
    label: "Replay",
    onClick: () => setRun(run + 1)
  })), caption && /*#__PURE__*/React.createElement("figcaption", {
    className: "p2n-fig-cap"
  }, caption));
}
Object.assign(__ds_scope, { FigureFrame });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/learning/FigureFrame.jsx", error: String((e && e.message) || e) }); }

// components/learning/Formula.jsx
try { (() => {
function Formula({
  children,
  terms = []
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "p2n-eq"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p2n-eq-f"
  }, children), terms.length > 0 && /*#__PURE__*/React.createElement("ul", {
    className: "p2n-eq-terms"
  }, terms.map((t, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: t.color ? {
      "--c": t.color
    } : null
  }, /*#__PURE__*/React.createElement("b", null, t.sym), t.meaning, t.unit && /*#__PURE__*/React.createElement("span", {
    className: "u"
  }, t.unit)))));
}
Object.assign(__ds_scope, { Formula });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/learning/Formula.jsx", error: String((e && e.message) || e) }); }

// components/learning/HelpBubble.jsx
try { (() => {
function HelpBubble({
  locations = [],
  label = "Stuck?",
  defaultOpen = false,
  onPick
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return /*#__PURE__*/React.createElement("span", {
    className: "p2n-help"
  }, open && /*#__PURE__*/React.createElement("div", {
    className: "p2n-bubble",
    role: "dialog",
    "aria-label": "Where to look"
  }, /*#__PURE__*/React.createElement("span", {
    className: "p2n-label"
  }, "Read these, in order"), /*#__PURE__*/React.createElement("ol", null, locations.map((l, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, /*#__PURE__*/React.createElement("a", {
    href: l.href || "#",
    onClick: e => {
      if (!l.href) e.preventDefault();
      onPick && onPick(l, i);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, i + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, l.title, /*#__PURE__*/React.createElement("small", null, l.where)), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right"
  })))))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "p2n-fab",
    "aria-expanded": open,
    onClick: () => setOpen(!open)
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: open ? "x" : "circle-help",
    size: 22
  }), label));
}
Object.assign(__ds_scope, { HelpBubble });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/learning/HelpBubble.jsx", error: String((e && e.message) || e) }); }

// components/learning/LearningObjectives.jsx
try { (() => {
function LearningObjectives({
  items = [],
  title = "Learning objectives",
  source = "EDB",
  defaultOpen = false
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const n = items.filter(x => x.done).length;
  return /*#__PURE__*/React.createElement("div", {
    className: "p2n-lo"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-expanded": open,
    onClick: () => setOpen(!open)
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "target",
    size: 22,
    style: {
      color: "var(--teal-600)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "p2n-lo-title"
  }, title), /*#__PURE__*/React.createElement("span", {
    className: "p2n-chip"
  }, source), /*#__PURE__*/React.createElement("span", {
    className: "p2n-num",
    style: {
      fontSize: 13,
      color: "var(--ink-2)"
    }
  }, n, "/", items.length), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    style: {
      transform: open ? "rotate(180deg)" : "none",
      transition: "transform var(--dur)"
    }
  })), open && /*#__PURE__*/React.createElement("ul", null, items.map((it, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    className: it.done ? "done" : ""
  }, /*#__PURE__*/React.createElement("span", {
    className: "tick"
  }, it.done && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 14
  })), /*#__PURE__*/React.createElement("span", {
    className: "txt"
  }, it.text), it.ext && /*#__PURE__*/React.createElement("span", {
    className: "p2n-chip p2n-chip--ext"
  }, "Ext"), it.code && /*#__PURE__*/React.createElement("span", {
    className: "p2n-chip"
  }, it.code)))));
}
Object.assign(__ds_scope, { LearningObjectives });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/learning/LearningObjectives.jsx", error: String((e && e.message) || e) }); }

// components/learning/QuickCheck.jsx
try { (() => {
function QuickCheck({
  prompt,
  figure,
  options,
  answer = 0,
  why,
  kind = "mc",
  xp = 10,
  step,
  total,
  onResult,
  onNext
}) {
  const opts = kind === "tf" ? [{
    label: "True",
    icon: "check"
  }, {
    label: "False",
    icon: "x"
  }] : options || [];
  const [wrong, setWrong] = React.useState([]);
  const [done, setDone] = React.useState(false);
  const earned = Math.max(2, xp - 4 * wrong.length);
  const pick = i => {
    if (done || wrong.includes(i)) return;
    if (i === answer) {
      setDone(true);
      onResult && onResult({
        correct: true,
        attempts: wrong.length + 1,
        xp: earned
      });
    } else {
      setWrong([...wrong, i]);
      onResult && onResult({
        correct: false,
        attempts: wrong.length + 1,
        xp: 0
      });
    }
  };
  const reset = () => {
    setWrong([]);
    setDone(false);
  };
  const state = done ? "ok" : wrong.length ? "nudge" : null;
  return /*#__PURE__*/React.createElement("section", {
    className: "p2n-qc",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p2n-qc-head"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "zap"
  }), /*#__PURE__*/React.createElement("span", {
    className: "p2n-label"
  }, "Quick check"), total > 1 && /*#__PURE__*/React.createElement("span", {
    className: "p2n-dots"
  }, Array.from({
    length: total
  }, (_, k) => /*#__PURE__*/React.createElement("i", {
    key: k,
    className: k < step ? "on" : k === step ? "now" : ""
  })))), /*#__PURE__*/React.createElement("p", {
    className: "p2n-qc-q"
  }, prompt), figure && /*#__PURE__*/React.createElement("div", {
    className: "p2n-qc-fig"
  }, figure), /*#__PURE__*/React.createElement("div", {
    className: "p2n-qc-opts",
    role: "group"
  }, opts.map((o, i) => {
    const cls = done ? i === answer ? "is-ok" : "is-dim" : wrong.includes(i) ? "is-nudge" : "";
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: `p2n-qc-opt ${cls}`,
      disabled: done || wrong.includes(i),
      onClick: () => pick(i)
    }, o.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: o.icon,
      size: 22
    }), o.figure, o.label && /*#__PURE__*/React.createElement("span", null, o.label));
  })), /*#__PURE__*/React.createElement("div", {
    className: `p2n-qc-fb ${state ? "open" : ""}`
  }, /*#__PURE__*/React.createElement("div", null, state && /*#__PURE__*/React.createElement("div", {
    className: `p2n-qc-fbrow ${state}`
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: done ? "circle-check" : "lightbulb",
    size: 22
  }), /*#__PURE__*/React.createElement("span", {
    className: "why"
  }, done ? why : "Not quite. Try another."), done && /*#__PURE__*/React.createElement("span", {
    className: "p2n-xp"
  }, "+", earned, " XP"), done && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "ghost",
    size: "sm",
    iconOnly: true,
    icon: "rotate-ccw",
    label: "Try again",
    onClick: reset
  }), done && onNext && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    size: "sm",
    icon: "arrow-right",
    onClick: onNext
  }, "Next")))));
}
Object.assign(__ds_scope, { QuickCheck });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/learning/QuickCheck.jsx", error: String((e && e.message) || e) }); }

// components/learning/Trap.jsx
try { (() => {
function Trap({
  children,
  wrong,
  right,
  label = "Exam trap"
}) {
  return /*#__PURE__*/React.createElement("aside", {
    className: "p2n-trap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p2n-trap-h"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "triangle-alert"
  }), /*#__PURE__*/React.createElement("span", {
    className: "p2n-label"
  }, label)), children && /*#__PURE__*/React.createElement("div", {
    className: "p2n-trap-t"
  }, children), (wrong || right) && /*#__PURE__*/React.createElement("div", {
    className: "p2n-trap-pair"
  }, wrong && /*#__PURE__*/React.createElement("div", {
    className: "no"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x"
  }), /*#__PURE__*/React.createElement("span", null, wrong)), right && /*#__PURE__*/React.createElement("div", {
    className: "yes"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check"
  }), right)));
}
Object.assign(__ds_scope, { Trap });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/learning/Trap.jsx", error: String((e && e.message) || e) }); }

// components/nav/ChapterCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ChapterCard({
  label,
  title,
  sub,
  icon,
  iconSrc,
  progress = 0,
  tone = "var(--teal-600)",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: "p2n-cc",
    style: {
      "--tone": tone
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "p2n-cc-ic"
  }, /*#__PURE__*/React.createElement(__ds_scope.ProgressRing, {
    value: progress,
    size: 68,
    color: tone
  }), /*#__PURE__*/React.createElement("span", {
    className: "in"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    src: iconSrc,
    size: 32
  }))), /*#__PURE__*/React.createElement("span", {
    className: "p2n-cc-t"
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "p2n-label"
  }, label), /*#__PURE__*/React.createElement("b", null, title), sub && /*#__PURE__*/React.createElement("small", null, sub)), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    style: {
      color: "var(--ink-3)"
    }
  }));
}
Object.assign(__ds_scope, { ChapterCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/nav/ChapterCard.jsx", error: String((e && e.message) || e) }); }

// components/nav/TopBar.jsx
try { (() => {
function TopBar({
  crumbs = [],
  streak,
  xp,
  level,
  onHome
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "p2n-top"
  }, /*#__PURE__*/React.createElement("a", {
    className: "p2n-top-brand",
    href: "#",
    onClick: e => {
      e.preventDefault();
      onHome && onHome();
    }
  }, "paper", /*#__PURE__*/React.createElement("i", null, "2"), "notes"), crumbs.length > 0 && /*#__PURE__*/React.createElement("nav", {
    className: "p2n-top-crumb"
  }, crumbs.map((c, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 16,
    style: {
      color: "var(--ink-3)"
    }
  }), /*#__PURE__*/React.createElement("span", null, c)))), /*#__PURE__*/React.createElement("span", {
    className: "p2n-top-stats"
  }, streak != null && /*#__PURE__*/React.createElement(__ds_scope.StatPill, {
    kind: "streak",
    value: streak
  }), xp != null && /*#__PURE__*/React.createElement(__ds_scope.StatPill, {
    kind: "xp",
    value: xp
  }), level != null && /*#__PURE__*/React.createElement(__ds_scope.StatPill, {
    kind: "level",
    value: level
  })));
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/nav/TopBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/notes-web/Figures.jsx
try { (() => {
// Demo figures drawn to the figure guideline: 480-wide viewBox, --fig-* colours, stroke 1.5/2.5/4, arrowhead 10.
function FigDefs({
  ids
}) {
  return /*#__PURE__*/React.createElement("defs", null, ids.map(k => /*#__PURE__*/React.createElement("marker", {
    key: k,
    id: "ah-" + k,
    viewBox: "0 0 10 10",
    refX: "8",
    refY: "5",
    markerWidth: "10",
    markerHeight: "10",
    markerUnits: "userSpaceOnUse",
    orient: "auto"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0 0L10 5L0 10z",
    fill: `var(--fig-${k})`
  }))));
}
const figSym = {
  fontFamily: "KaTeX_Main,'Times New Roman',serif",
  fontStyle: "italic",
  fontSize: 22
};
function FigPathVsDisplacement() {
  const path = "M60 170 C120 40 220 40 260 120 S380 200 420 90";
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 480 230"
  }, /*#__PURE__*/React.createElement(FigDefs, {
    ids: ["displacement"]
  }), /*#__PURE__*/React.createElement("style", null, `.p2nk-path{stroke-dasharray:520;stroke-dashoffset:520;animation:p2nk-draw var(--fig-anim) var(--ease-out) forwards}.p2nk-s{opacity:0;animation:p2nk-in var(--dur) var(--ease-out) forwards;animation-delay:calc(var(--fig-anim) + .1s)}@keyframes p2nk-draw{to{stroke-dashoffset:0}}@keyframes p2nk-in{to{opacity:1}}`), /*#__PURE__*/React.createElement("path", {
    className: "p2nk-path",
    d: path,
    fill: "none",
    stroke: "var(--fig-distance)",
    strokeWidth: "2.5",
    strokeDasharray: "7 6",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("g", {
    className: "p2nk-s"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M66 166L410 96",
    stroke: "var(--fig-displacement)",
    strokeWidth: "4",
    strokeLinecap: "round",
    markerEnd: "url(#ah-displacement)"
  }), /*#__PURE__*/React.createElement("text", {
    x: "236",
    y: "156",
    fill: "var(--fig-displacement)",
    style: figSym
  }, "s")), /*#__PURE__*/React.createElement("circle", {
    cx: "60",
    cy: "170",
    r: "6",
    fill: "var(--fig-ink)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "420",
    cy: "90",
    r: "6",
    fill: "var(--fig-ink)"
  }), /*#__PURE__*/React.createElement("text", {
    x: "48",
    y: "200",
    fontFamily: "Nunito",
    fontWeight: "700",
    fontSize: "14",
    fill: "var(--ink-2)"
  }, "start"), /*#__PURE__*/React.createElement("text", {
    x: "404",
    y: "72",
    fontFamily: "Nunito",
    fontWeight: "700",
    fontSize: "14",
    fill: "var(--ink-2)"
  }, "end"), /*#__PURE__*/React.createElement("text", {
    x: "150",
    y: "44",
    fontFamily: "Nunito",
    fontWeight: "700",
    fontSize: "14",
    fill: "var(--fig-distance)"
  }, "distance"));
}
function FigTipToTail() {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 480 220"
  }, /*#__PURE__*/React.createElement(FigDefs, {
    ids: ["displacement", "guide"]
  }), /*#__PURE__*/React.createElement("path", {
    d: "M80 180H280",
    stroke: "var(--fig-displacement)",
    strokeWidth: "4",
    strokeLinecap: "round",
    markerEnd: "url(#ah-displacement)",
    opacity: ".45"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M284 180V50",
    stroke: "var(--fig-displacement)",
    strokeWidth: "4",
    strokeLinecap: "round",
    markerEnd: "url(#ah-displacement)",
    opacity: ".45"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M82 178L280 54",
    stroke: "var(--fig-displacement)",
    strokeWidth: "4",
    strokeLinecap: "round",
    markerEnd: "url(#ah-displacement)"
  }), /*#__PURE__*/React.createElement("text", {
    x: "170",
    y: "206",
    fontFamily: "JetBrains Mono",
    fontWeight: "700",
    fontSize: "14",
    fill: "var(--ink-2)"
  }, "4 m"), /*#__PURE__*/React.createElement("text", {
    x: "296",
    y: "120",
    fontFamily: "JetBrains Mono",
    fontWeight: "700",
    fontSize: "14",
    fill: "var(--ink-2)"
  }, "3 m"), /*#__PURE__*/React.createElement("text", {
    x: "150",
    y: "108",
    fill: "var(--fig-displacement)",
    style: figSym
  }, "5 m"));
}

// Option figures for a quick check: which arrow is the displacement?
function OptArrow({
  d,
  color = "var(--fig-displacement)",
  dashed
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 120 70",
    width: "110",
    height: "64"
  }, /*#__PURE__*/React.createElement(FigDefs, {
    ids: ["displacement", "distance"]
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "16",
    cy: "54",
    r: "4",
    fill: "var(--fig-ink)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "104",
    cy: "18",
    r: "4",
    fill: "var(--fig-ink)"
  }), /*#__PURE__*/React.createElement("path", {
    d: d,
    fill: "none",
    stroke: color,
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeDasharray: dashed ? "5 5" : undefined,
    markerEnd: dashed ? undefined : `url(#ah-${color.includes("distance") ? "distance" : "displacement"})`
  }));
}
Object.assign(window, {
  FigPathVsDisplacement,
  FigTipToTail,
  OptArrow
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/notes-web/Figures.jsx", error: String((e && e.message) || e) }); }

// ui_kits/notes-web/Screens.jsx
try { (() => {
const {
  Button,
  Icon,
  ProgressRing,
  ChapterCard,
  TopBar,
  XPBar,
  StatPill,
  AchievementBadge,
  QuickCheck,
  LearningObjectives,
  FigureFrame,
  Formula,
  Trap,
  HelpBubble
} = window.Paper2NotesDesignSystem_ff940d;
const kitWrap = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "24px 16px 120px",
  display: "grid",
  gap: 16
};
const BOOKS = [{
  id: "book2",
  label: "Book 2",
  title: "Force & Motion",
  icon: "rocket",
  tone: "var(--book2)",
  progress: 0.32
}, {
  id: "book4",
  label: "Book 4",
  title: "Electricity & Magnetism",
  icon: "zap",
  tone: "var(--book4)",
  progress: 0.08
}, {
  id: "book5",
  label: "Book 5",
  title: "Radioactivity",
  icon: "radiation",
  tone: "var(--book5)",
  progress: 0
}, {
  id: "qb",
  label: "Practice",
  title: "Question bank",
  icon: "library",
  tone: "var(--bookqb)",
  progress: 0.12
}];
const CH2 = [["Position & displacement", "move-up-right", 0.6], ["Velocity & acceleration", "gauge", 0.3], ["Forces & Newton I", "square-arrow-right", 0], ["Newton II & III", "weight", 0], ["Moments", "scale", 0], ["Work, energy, power", "battery-charging", 0], ["Momentum", "circle-dot-dashed", 0], ["Projectiles", "chart-spline", 0], ["Circular motion", "orbit", 0], ["Gravitation", "earth", 0]];
function HomeScreen({
  go,
  stats
}) {
  return /*#__PURE__*/React.createElement("main", {
    style: kitWrap
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "p2n-cc",
    style: {
      "--tone": "var(--teal-600)",
      background: "var(--teal-600)",
      borderColor: "var(--teal-700)",
      color: "#fff",
      boxShadow: "var(--edge-brand)"
    },
    onClick: () => go("section")
  }, /*#__PURE__*/React.createElement("span", {
    className: "p2n-cc-ic"
  }, /*#__PURE__*/React.createElement(ProgressRing, {
    value: 0.6,
    size: 68,
    color: "var(--sun-400)"
  }), /*#__PURE__*/React.createElement("span", {
    className: "in",
    style: {
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "move-up-right",
    size: 32
  }))), /*#__PURE__*/React.createElement("span", {
    className: "p2n-cc-t"
  }, /*#__PURE__*/React.createElement("span", {
    className: "p2n-label",
    style: {
      color: "var(--teal-100)"
    }
  }, "Continue \xB7 Ch.1"), /*#__PURE__*/React.createElement("b", null, "Position & displacement")), /*#__PURE__*/React.createElement(Icon, {
    name: "play",
    size: 28
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(StatPill, {
    kind: "streak",
    value: stats.streak
  }), /*#__PURE__*/React.createElement(StatPill, {
    kind: "xp",
    value: stats.xp
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 180
    }
  }, /*#__PURE__*/React.createElement(XPBar, {
    value: stats.xp % 500,
    max: 500,
    level: Math.floor(stats.xp / 500) + 1
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10,
      gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))"
    }
  }, BOOKS.map(b => /*#__PURE__*/React.createElement(ChapterCard, {
    key: b.id,
    label: b.label,
    title: b.title,
    icon: b.icon,
    tone: b.tone,
    progress: b.progress,
    onClick: () => go(b.id === "book2" ? "book" : "home")
  }))));
}
function BookScreen({
  go
}) {
  return /*#__PURE__*/React.createElement("main", {
    style: kitWrap
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 18,
      background: "var(--book2-soft)",
      display: "grid",
      placeItems: "center",
      color: "var(--book2)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "rocket",
    size: 30
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "p2n-label"
  }, "Book 2"), /*#__PURE__*/React.createElement("h1", null, "Force & Motion"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10
    }
  }, CH2.map(([t, ic, p], i) => /*#__PURE__*/React.createElement(ChapterCard, {
    key: i,
    label: "Ch." + (i + 1),
    title: t,
    icon: ic,
    progress: p,
    tone: "var(--book2)",
    onClick: () => i === 0 && go("section")
  }))));
}
function AchievementsScreen({
  stats
}) {
  const list = [["flame", "3-day streak", "bronze", 3, 3], ["flame", "7-day streak", "gold", stats.streak, 7], ["zap", "First try!", "gold", stats.firstTry ? 1 : 0, 1], ["target", "10 first-try", "silver", stats.firstTryCount, 10], ["book-open", "Chapter done", "bronze", 0, 1], ["trophy", "Book master", "gold", 1, 10], ["crosshair", "DSE sharpshooter", "silver", 2, 20], ["moon", "Night owl", "bronze", 0, 1]];
  return /*#__PURE__*/React.createElement("main", {
    style: kitWrap
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(StatPill, {
    kind: "streak",
    value: stats.streak
  }), /*#__PURE__*/React.createElement(StatPill, {
    kind: "xp",
    value: stats.xp
  }), /*#__PURE__*/React.createElement(StatPill, {
    kind: "level",
    value: Math.floor(stats.xp / 500) + 1
  })), /*#__PURE__*/React.createElement(XPBar, {
    value: stats.xp % 500,
    max: 500,
    level: Math.floor(stats.xp / 500) + 1
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(112px,1fr))",
      gap: 20,
      justifyItems: "center",
      padding: "12px 0"
    }
  }, list.map(([ic, t, tier, p, g]) => /*#__PURE__*/React.createElement(AchievementBadge, {
    key: t,
    icon: ic,
    title: t,
    tier: tier,
    progress: p,
    goal: g
  }))));
}
Object.assign(window, {
  HomeScreen,
  BookScreen,
  AchievementsScreen,
  kitWrap
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/notes-web/Screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/notes-web/SectionScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CHECKS = [{
  prompt: "Which arrow is the displacement?",
  options: [{
    figure: /*#__PURE__*/React.createElement(OptArrow, {
      d: "M16 54 C40 0 80 70 100 22",
      color: "var(--fig-distance)",
      dashed: true
    })
  }, {
    figure: /*#__PURE__*/React.createElement(OptArrow, {
      d: "M20 52L98 21"
    })
  }, {
    figure: /*#__PURE__*/React.createElement(OptArrow, {
      d: "M16 54H100V26"
    })
  }],
  answer: 1,
  why: "Straight line, start → end."
}, {
  prompt: "Walk 3 m east, then 3 m west. Displacement?",
  options: [{
    label: "6 m"
  }, {
    label: "0 m"
  }, {
    label: "3 m"
  }],
  answer: 1,
  why: "Back at the start → zero."
}, {
  kind: "tf",
  prompt: "Distance can be negative.",
  answer: 1,
  why: "Distance is a size only: ≥ 0."
}];
function SectionScreen({
  onXP,
  toast
}) {
  const [i, setI] = React.useState(0);
  const [done, setDone] = React.useState([]);
  const c = CHECKS[i];
  const result = r => {
    if (!r.correct) return;
    onXP(r.xp, r.attempts === 1);
    setDone(d => d.includes(i) ? d : [...d, i]);
  };
  const lo = [{
    text: "Distinguish distance and displacement",
    code: "II.1a",
    done: done.includes(0) && done.includes(1)
  }, {
    text: "Add displacements tip-to-tail",
    code: "II.1b",
    done: done.includes(2)
  }];
  return /*#__PURE__*/React.createElement("main", {
    style: kitWrap
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "p2n-label",
    style: {
      color: "var(--book2)"
    }
  }, "Ch.1 \xB7 1.1"), /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: 6
    }
  }, "Distance vs displacement")), /*#__PURE__*/React.createElement(LearningObjectives, {
    items: lo
  }), /*#__PURE__*/React.createElement(FigureFrame, {
    num: "1.1",
    caption: "Distance follows the path. Displacement doesn\u2019t.",
    animated: true
  }, /*#__PURE__*/React.createElement(FigPathVsDisplacement, null)), /*#__PURE__*/React.createElement(Trap, {
    wrong: "Distance = 0 m",
    right: "Displacement = 0 m"
  }, "Walked a loop, back at the start?"), /*#__PURE__*/React.createElement(FigureFrame, {
    num: "1.2",
    caption: "Add tip-to-tail. Resultant: start of first \u2192 end of last."
  }, /*#__PURE__*/React.createElement(FigTipToTail, null)), /*#__PURE__*/React.createElement(Formula, {
    terms: [{
      sym: "s",
      meaning: "displacement",
      unit: "m",
      color: "var(--fig-displacement)"
    }]
  }, "s = \u221A(4\xB2 + 3\xB2) = 5 m"), /*#__PURE__*/React.createElement(QuickCheck, _extends({
    key: i
  }, c, {
    step: i,
    total: CHECKS.length,
    xp: 10,
    onResult: result,
    onNext: i < CHECKS.length - 1 ? () => setI(i + 1) : undefined
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      right: 16,
      bottom: 16,
      zIndex: 30
    }
  }, /*#__PURE__*/React.createElement(HelpBubble, {
    locations: [{
      title: "Distance vs displacement",
      where: "Ch.1 · Fig 1.1"
    }, {
      title: "Adding vectors",
      where: "Ch.1 · Fig 1.2"
    }, {
      title: "Pythagoras for vectors",
      where: "Ch.1 · Formula"
    }]
  })));
}
Object.assign(window, {
  SectionScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/notes-web/SectionScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.ProgressRing = __ds_scope.ProgressRing;

__ds_ns.AchievementBadge = __ds_scope.AchievementBadge;

__ds_ns.AchievementToast = __ds_scope.AchievementToast;

__ds_ns.StatPill = __ds_scope.StatPill;

__ds_ns.XPBar = __ds_scope.XPBar;

__ds_ns.FigureFrame = __ds_scope.FigureFrame;

__ds_ns.Formula = __ds_scope.Formula;

__ds_ns.HelpBubble = __ds_scope.HelpBubble;

__ds_ns.LearningObjectives = __ds_scope.LearningObjectives;

__ds_ns.QuickCheck = __ds_scope.QuickCheck;

__ds_ns.Trap = __ds_scope.Trap;

__ds_ns.ChapterCard = __ds_scope.ChapterCard;

__ds_ns.TopBar = __ds_scope.TopBar;

})();
