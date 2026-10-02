export interface TopBarProps {
  crumbs?: string[];
  streak?: number;
  xp?: number;
  level?: number;
  onHome?: () => void;
}
export function TopBar(props: TopBarProps): JSX.Element;
