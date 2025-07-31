import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { MapleButton } from '../MapleButton';
import { cn } from '@/lib/utils';

export interface MapleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  title?: string;
  underText?: React.ReactNode;
  errorMessage?: string;
  isLoading?: boolean;
  searchButton?: {
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    title?: string;
    variant?: 'green' | 'orange' | 'blue' | 'red';
  };
}

export const MapleInput = forwardRef<HTMLInputElement, MapleInputProps>(
  ({ 
    title, 
    underText, 
    errorMessage, 
    isLoading, 
    searchButton, 
    className,
    ...props 
  }, ref) => {
    return (
      <div className="space-y-1">
        {title && (
          <label className="text-black font-maplestory font-medium text-sm block">
            {title}
          </label>
        )}
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input 
              ref={ref}
              {...props}
              className={cn(
                "bg-white border-gray-300 text-black font-maplestory h-10",
                className
              )}
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-500" />
            )}
          </div>
          
          {searchButton && (
            <MapleButton
              variant={searchButton.variant || "orange"}
              size="sm"
              onClick={searchButton.onClick}
              disabled={searchButton.disabled || isLoading}
              title={searchButton.title}
              className="h-10 px-3"
            >
              {searchButton.icon}
            </MapleButton>
          )}
        </div>
        
        {underText && (
          <div className="text-xs text-gray-700 font-maplestory">
            {underText}
          </div>
        )}
        
        {isLoading && (
          <div className="text-sm text-gray-700 font-maplestory">
            Looking up character on MapleRanks...
          </div>
        )}
        
        {errorMessage && (
          <div className="text-sm text-orange-700 font-maplestory">
            {errorMessage}
          </div>
        )}
      </div>
    );
  }
);

MapleInput.displayName = "MapleInput";
