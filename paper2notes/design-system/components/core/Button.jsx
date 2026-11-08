import React from "react";
import { Icon } from "./Icon.jsx";
export function Button({ variant = "primary", size = "md", icon, iconOnly, children, label, href, ...rest }) {
  const cls = `p2n-btn p2n-btn--${variant}${size !== "md" ? " p2n-btn--" + size : ""}${iconOnly ? " p2n-btn--icon" : ""}`;
  const inner = <>{icon && <Icon name={icon} />}{!iconOnly && children}</>;
  return href ? <a className={cls} href={href} {...rest}>{inner}</a> : <button type="button" className={cls} aria-label={iconOnly ? label : undefined} {...rest}>{inner}</button>;
}
