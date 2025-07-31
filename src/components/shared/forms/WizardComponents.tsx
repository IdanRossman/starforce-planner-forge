import { ReactNode } from 'react';

export interface WizardStepProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function WizardStep({ title, subtitle, children, className = "" }: WizardStepProps) {
  return (
    <div className={`w-full space-y-4 ${className}`}>
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-black font-maplestory">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-700 font-maplestory">
            {subtitle}
          </p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

export interface WizardFieldsetProps {
  legend: string;
  children: ReactNode;
  className?: string;
}

export function WizardFieldset({ legend, children, className = "" }: WizardFieldsetProps) {
  return (
    <fieldset className={`border border-gray-300 rounded-md p-3 space-y-3 bg-white ${className}`}>
      <legend className="text-sm font-medium text-black font-maplestory px-2">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

export interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  children: ReactNode;
  className?: string;
}

export function StatusMessage({ type, children, className = "" }: StatusMessageProps) {
  const styles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-orange-50 text-orange-800 border-orange-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  return (
    <div className={`p-3 rounded-md border text-sm font-maplestory ${styles[type]} ${className}`}>
      {children}
    </div>
  );
}
