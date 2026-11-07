export interface FigureFrameProps {
  /** e.g. "2.3" → badge "Fig 2.3" */
  num?: string;
  /** one short line, ≤ 12 words */
  caption?: React.ReactNode;
  /** shows a Replay button that remounts children */
  animated?: boolean;
  /** SVG (480-wide viewBox), canvas or img */
  children?: React.ReactNode;
}
export function FigureFrame(props: FigureFrameProps): JSX.Element;
