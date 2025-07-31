import { ReactNode } from 'react';
import { Control, FieldPath, FieldValues, PathValue } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface FormFieldWrapperProps<T extends FieldValues, TName extends FieldPath<T> = FieldPath<T>> {
  name: TName;
  label: string;
  control: Control<T>;
  children: (field: { value: PathValue<T, TName>; onChange: (value: PathValue<T, TName>) => void }) => ReactNode;
  className?: string;
  labelClassName?: string;
  required?: boolean;
  underText?: ReactNode;
  hideLabel?: boolean;
}

export function FormFieldWrapper<T extends FieldValues, TName extends FieldPath<T> = FieldPath<T>>({
  name,
  label,
  control,
  children,
  className,
  labelClassName = "text-black font-maplestory font-medium text-sm",
  required = false,
  underText,
  hideLabel = false,
}: FormFieldWrapperProps<T, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {!hideLabel && (
            <FormLabel className={labelClassName}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            {children(field)}
          </FormControl>
          {underText && (
            <div className="text-xs text-gray-700 font-maplestory">
              {underText}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
