import { ReactNode } from 'react';
import { Switch } from '@/components/ui/switch';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Control, FieldPath, FieldValues } from 'react-hook-form';

interface ToggleFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  title: string;
  description: string;
  icon?: ReactNode;
  variant?: 'default' | 'amber' | 'blue' | 'green';
  className?: string;
}

const variantStyles = {
  default: 'border-2 border-gray-300 bg-gray-50/50',
  amber: 'border-2 border-amber-400 bg-amber-50/50',
  blue: 'border-2 border-blue-400 bg-blue-50/50',
  green: 'border-2 border-green-400 bg-green-50/50',
};

export function ToggleField<T extends FieldValues>({
  name,
  control,
  title,
  description,
  icon,
  variant = 'default',
  className,
}: ToggleFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={`flex flex-row items-center justify-between rounded-lg p-4 ${variantStyles[variant]} ${className || ''}`}>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {icon}
              <FormLabel className="text-base font-maplestory text-black">
                {title}
              </FormLabel>
            </div>
            <div className="text-sm text-gray-700 font-maplestory">
              {description}
            </div>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
