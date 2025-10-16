import { Button } from "./ui/button";
import { Sparkles, X } from "lucide-react";

interface SetQuickSelectProps {
  availableSets: string[];
  onSelectSet: (setName: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function SetQuickSelect({ 
  availableSets, 
  onSelectSet, 
  onClearAll,
  className = "" 
}: SetQuickSelectProps) {
  if (availableSets.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground font-maplestory flex items-center gap-1.5">
        <Sparkles className="w-4 h-4" />
        Quick Select:
      </span>
      
      {availableSets.map((setName) => (
        <Button
          key={setName}
          variant="outline"
          size="sm"
          onClick={() => onSelectSet(setName)}
          className="font-maplestory rounded-full h-7 text-xs border-primary/30 hover:bg-primary/10 hover:border-primary"
        >
          {setName} Set
        </Button>
      ))}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="font-maplestory rounded-full h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <X className="w-3 h-3 mr-1" />
        Clear All
      </Button>
    </div>
  );
}
