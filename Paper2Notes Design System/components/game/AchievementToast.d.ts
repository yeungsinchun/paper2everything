export interface AchievementToastProps {
  icon?: string;
  title: string;
  tier?: "bronze" | "silver" | "gold";
}
export function AchievementToast(props: AchievementToastProps): JSX.Element;
