import { ReactNode } from 'react';
import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { StarForceSlider } from './StarForceSlider';
import { FormFieldWrapper } from './FormFieldWrapper';

interface StarForceSliderFieldProps<T extends FieldValues, TName extends FieldPath<T> = FieldPath<T>> {
  name: TName;
  control: Control<T>;
  title: string;
  subtitle?: string;
  min: number;
  max: number;
  underText?: ReactNode;
  className?: string;
}

export function StarForceSliderField<T extends FieldValues, TName extends FieldPath<T> = FieldPath<T>>({
  name,
  control,
  title,
  subtitle,
  min,
  max,
  underText,
  className
}: StarForceSliderFieldProps<T, TName>) {
  return (
    <FormFieldWrapper
      name={name}
      label={title}
      control={control}
      hideLabel={true}
      underText={underText}
      className={className}
    >
      {(field) => (
        <StarForceSlider
          title={title}
          subtitle={subtitle}
          value={field.value}
          onChange={field.onChange}
          min={min}
          max={max}
        />
      )}
    </FormFieldWrapper>
  );
}
