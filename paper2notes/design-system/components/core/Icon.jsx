import React from "react";
const LUCIDE = "https://unpkg.com/lucide-static@0.468.0/icons/";
export function Icon({ name, src, size, style, label }) {
  const url = src || LUCIDE + name + ".svg";
  return <span className="p2n-icon" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} style={{ "--src": `url(${url})`, ...(size ? { "--s": size + "px" } : null), ...style }} />;
}
