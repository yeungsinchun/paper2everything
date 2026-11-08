export interface FormulaTerm { sym: string; meaning: string; unit?: string; color?: string }
export interface FormulaProps {
  /** formula text or KaTeX node */
  children: React.ReactNode;
  /** colour each symbol with its --fig-* meaning */
  terms?: FormulaTerm[];
}
export function Formula(props: FormulaProps): JSX.Element;
