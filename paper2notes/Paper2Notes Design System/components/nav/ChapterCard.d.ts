/**
 * @startingPoint section="Navigation" subtitle="Book / chapter card with mastery ring" viewport="700x260"
 */
export interface ChapterCardProps {
  /** e.g. "Ch.1" or "Book 2" */
  label?: string;
  title: string;
  /** optional short line, ≤ 6 words (not a topic list) */
  sub?: string;
  icon?: string;
  iconSrc?: string;
  /** 0–1 mastery */
  progress?: number;
  /** CSS colour for ring + hover */
  tone?: string;
  onClick?: (e: any) => void;
}
export function ChapterCard(props: ChapterCardProps): JSX.Element;
