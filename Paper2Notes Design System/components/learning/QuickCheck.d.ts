export interface QuickCheckOption { label?: string; icon?: string; figure?: React.ReactNode }
/**
 * @startingPoint section="Learning" subtitle="Figure-first quick check with inline feedback + XP" viewport="700x420"
 */
export interface QuickCheckProps {
  prompt: React.ReactNode;
  figure?: React.ReactNode;
  options?: QuickCheckOption[];
  /** index of the correct option */
  answer?: number;
  /** one-line reason shown on success */
  why?: React.ReactNode;
  /** tf = True/False shortcut */
  kind?: "mc" | "tf";
  xp?: number;
  /** 0-based position within a set, for dots */
  step?: number;
  total?: number;
  onResult?: (r: { correct: boolean; attempts: number; xp: number }) => void;
  onNext?: () => void;
}
export function QuickCheck(props: QuickCheckProps): JSX.Element;
