export interface LearningObjective { text: string; code?: string; ext?: boolean; done?: boolean }
export interface LearningObjectivesProps {
  items?: LearningObjective[];
  title?: string;
  /** source chip, default "EDB" */
  source?: string;
  defaultOpen?: boolean;
}
export function LearningObjectives(props: LearningObjectivesProps): JSX.Element;
