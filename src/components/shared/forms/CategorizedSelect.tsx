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
  variant?: 'light' | 'dark';
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
  variant = 'light',
}: CategorizedSelectProps) {
  // Find the selected option across all categories
  const selectedOption = categories
    .flatMap(category => category.options)
    .find(option => option.value === value);

  // Theme-based text colors
  const textColor = variant === 'dark' ? 'text-white' : 'text-black';
  const placeholderColor = variant === 'dark' ? 'text-white/40' : 'text-muted-foreground';

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
        <span className={`${textColor} font-maplestory`}>{option.label}</span>
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
        <span className={`flex-1 ${textColor} font-maplestory`}>{option.label}</span>
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

  // Variant-based styling
  const contentBgClass = variant === 'dark' 
    ? 'bg-slate-800/95 border-white/20 backdrop-blur-sm' 
    : 'bg-white border-gray-200';
  
  const categoryHeaderClass = variant === 'dark'
    ? 'px-2 py-1.5 text-sm font-semibold text-white/90 bg-slate-700/50 border-b border-white/10 font-maplestory'
    : 'px-2 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 border-b font-maplestory';
  
  const itemClass = variant === 'dark'
    ? 'pl-6 font-maplestory hover:bg-slate-700/50 focus:bg-slate-700/70 data-[highlighted]:bg-slate-700/50'
    : 'pl-6 font-maplestory';

  return (
    <Select onValueChange={onValueChange} value={value} disabled={disabled}>
      <SelectTrigger className={cn(className, "font-maplestory")}>
        <SelectValue placeholder={placeholder}>
          {selectedOption ? (
            renderSelectedValue ? renderSelectedValue(selectedOption) : defaultRenderSelectedValue(selectedOption)
          ) : (
            <span className={`${placeholderColor} font-maplestory`}>{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className={contentBgClass}>
        {categories.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <div className={categoryHeaderClass}>
              {category.name}
            </div>
            {category.options.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value} 
                className={itemClass}
              >
                {renderOption ? renderOption(option) : defaultRenderOption(option)}
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}
