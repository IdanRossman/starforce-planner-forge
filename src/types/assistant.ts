export interface AssistantTip {
  id: string;
  message: string;
  type: 'general' | 'warning' | 'success' | 'info';
  context?: string[];
  duration?: number; // How long to show the tip in milliseconds
}

export interface AssistantCharacter {
  name: string;
  image: string;
  tips: AssistantTip[];
}

export interface GameAssistantProps {
  character?: AssistantCharacter;
  pageContext?: string;
  currentLevel?: number;
  currentSlot?: string;
  isStarforceable?: boolean;
  onClose?: () => void;
}
