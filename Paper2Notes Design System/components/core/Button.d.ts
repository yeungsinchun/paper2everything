export interface ButtonProps {
  /** primary = teal (the one main action); sun = reward/claim; secondary = white card; ghost = text */
  variant?: "primary" | "secondary" | "sun" | "ghost";
  size?: "sm" | "md" | "lg";
  /** Lucide icon name, e.g. "arrow-right" */
  icon?: string;
  iconOnly?: boolean;
  /** aria-label when iconOnly */
  label?: string;
  href?: string;
  disabled?: boolean;
  onClick?: (e: any) => void;
  children?: React.ReactNode;
}
export function Button(props: ButtonProps): JSX.Element;
