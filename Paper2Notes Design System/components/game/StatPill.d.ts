export interface StatPillProps {
  kind?: "streak" | "xp" | "level";
  value: React.ReactNode;
}
export function StatPill(props: StatPillProps): JSX.Element;
