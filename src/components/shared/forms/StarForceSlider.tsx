import React from 'react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface StarForceSliderProps {
  title: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  subtitle?: string;
  className?: string;
}

export function StarForceSlider({ 
  title, 
  value, 
  onChange, 
  min = 0, 
  max, 
  subtitle,
  className = ""
}: StarForceSliderProps) {
  return (
    <FormItem className={className}>
      <FormLabel className="text-black font-maplestory font-medium text-sm">
        {title}: {value}★
        {subtitle && (
          <span className="text-xs text-blue-600 ml-2">
            {subtitle}
          </span>
        )}
      </FormLabel>
      <div className="space-y-3">
        <FormControl>
          <Slider
            min={min}
            max={max}
            step={1}
            value={[value]}
            onValueChange={(values) => onChange(values[0])}
            className="w-full"
          />
        </FormControl>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 font-maplestory">Direct input:</span>
          <Input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e) => {
              const newValue = parseInt(e.target.value) || 0;
              const clampedValue = Math.min(Math.max(newValue, min), max);
              onChange(clampedValue);
            }}
            className="w-20 text-center bg-white border-gray-300 text-black font-maplestory"
          />
          <span className="text-sm text-gray-700 font-maplestory">/ {max}★</span>
        </div>
      </div>
      <FormMessage />
    </FormItem>
  );
}
