import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | (() => ReactNode);
  colors?: {
    bg: string;
    bgMuted: string;
    text: string;
  };
  badges?: Array<{
    text: string;
    className?: string;
  }>;
}

export interface SelectCategory {
  name: string;
  options: SelectOption[];
}

export interface CategorizedSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  categories: SelectCategory[];
  className?: string;
  disabled?: boolean;
  renderSelectedValue?: (option: SelectOption) => ReactNode;
  renderOption?: (option: SelectOption) => ReactNode;
}

export function CategorizedSelect({
  value,
  onValueChange,
  placeholder = "Select an option",
  categories,
  className,
  disabled,
  renderSelectedValue,
  renderOption,
}: CategorizedSelectProps) {
  // Find the selected option across all categories
  const selectedOption = categories
    .flatMap(category => category.options)
    .find(option => option.value === value);

  const defaultRenderSelectedValue = (option: SelectOption) => {
    const Icon = option.icon;
    return (
      <div className="flex items-center gap-2">
        {Icon && (
          <>
            {typeof Icon === 'function' && Icon.length === 0 ? (
              // Function that returns ReactNode (like our EquipmentImage)
              <Icon />
            ) : option.colors ? (
              // Component with colors (original behavior)
              <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${option.colors.bg} flex items-center justify-center`}>
                <Icon className="w-3 h-3 text-white" />
              </div>
            ) : (
              // Component without colors
              <Icon className="w-5 h-5" />
            )}
          </>
        )}
        <span className="text-black font-maplestory">{option.label}</span>
        {option.badges && option.badges.length > 0 && (
          <div className="flex gap-1">
            {option.badges.map((badge, index) => (
              <span key={index} className={badge.className || "text-xs px-2 py-1 rounded bg-muted text-muted-foreground"}>
                {badge.text}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const defaultRenderOption = (option: SelectOption) => {
    const Icon = option.icon;
    return (
      <div className="flex items-center gap-2">
        {Icon && (
          <>
            {typeof Icon === 'function' && Icon.length === 0 ? (
              // Function that returns ReactNode (like our EquipmentImage)
              <Icon />
            ) : option.colors ? (
              // Component with colors (original behavior)
              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${option.colors.bg} flex items-center justify-center`}>
                <Icon className="w-2.5 h-2.5 text-white" />
              </div>
            ) : (
              // Component without colors
              <Icon className="w-4 h-4" />
            )}
          </>
        )}
        <span className="flex-1 text-black font-maplestory">{option.label}</span>
        {option.badges && option.badges.length > 0 && (
          <div className="flex gap-1">
            {option.badges.map((badge, index) => (
              <span key={index} className={badge.className || "text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"}>
                {badge.text}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Select onValueChange={onValueChange} value={value} disabled={disabled}>
      <SelectTrigger className={cn(className, "font-maplestory [&>span]:text-black [&_span]:text-black")}>
        <SelectValue placeholder={placeholder}>
          {selectedOption ? (
            renderSelectedValue ? renderSelectedValue(selectedOption) : defaultRenderSelectedValue(selectedOption)
          ) : (
            <span className="text-black font-maplestory">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-white">
        {categories.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <div className="px-2 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 border-b font-maplestory">
              {category.name}
            </div>
            {category.options.map((option) => (
              <SelectItem key={option.value} value={option.value} className="pl-6 text-black font-maplestory">
                {renderOption ? renderOption(option) : defaultRenderOption(option)}
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}
