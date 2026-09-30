export interface ProgressRingProps {
  /** 0–1 */
  value?: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}
export function ProgressRing(props: ProgressRingProps): JSX.Element;
