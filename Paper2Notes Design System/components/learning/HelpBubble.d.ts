export interface HelpLocation { title: string; where?: string; href?: string }
export interface HelpBubbleProps {
  /** ordered places in the notes that answer the problem */
  locations?: HelpLocation[];
  label?: string;
  defaultOpen?: boolean;
  onPick?: (loc: HelpLocation, index: number) => void;
}
export function HelpBubble(props: HelpBubbleProps): JSX.Element;
