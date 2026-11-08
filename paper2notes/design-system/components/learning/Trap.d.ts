export interface TrapProps {
  children?: React.ReactNode;
  /** the common wrong statement (struck through) */
  wrong?: React.ReactNode;
  right?: React.ReactNode;
  label?: string;
}
export function Trap(props: TrapProps): JSX.Element;
