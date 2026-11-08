export interface AchievementBadgeProps {
  icon?: string;
  title: string;
  tier?: "bronze" | "silver" | "gold";
  progress?: number;
  goal?: number;
  /** override; defaults to progress >= goal */
  unlocked?: boolean;
}
export function AchievementBadge(props: AchievementBadgeProps): JSX.Element;
