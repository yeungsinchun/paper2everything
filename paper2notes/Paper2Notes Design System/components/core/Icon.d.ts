export interface IconProps {
  /** Lucide icon name (lucide-static 0.468.0) */
  name?: string;
  /** Custom SVG url (overrides name) — e.g. assets/icons/*.svg */
  src?: string;
  /** px; defaults to 1.25em */
  size?: number;
  label?: string;
  style?: React.CSSProperties;
}
export function Icon(props: IconProps): JSX.Element;
