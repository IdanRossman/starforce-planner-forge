import { Button } from '@/components/ui/button';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface MapleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'green' | 'orange' | 'blue' | 'red';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantStyles = {
  green: {
    default: 'linear-gradient(to top, #98CC21, #92CC75)',
    hover: 'linear-gradient(to top, #86B51E, #7FB866)'
  },
  orange: {
    default: 'linear-gradient(to top, #FFD700, #FFA500)',
    hover: 'linear-gradient(to top, #FFB300, #FF8C00)'
  },
  blue: {
    default: 'linear-gradient(to top, #2AA6DA, #1E90FF)',
    hover: 'linear-gradient(to top, #1E88E5, #1976D2)'
  },
  red: {
    default: 'linear-gradient(to top, #FF6B6B, #FF4757)',
    hover: 'linear-gradient(to top, #FF5252, #F44336)'
  }
};

const sizeStyles = {
  sm: 'h-5 px-3 text-xs',
  md: 'h-8 px-6 text-sm',
  lg: 'h-10 px-8 text-base'
};

export const MapleButton = forwardRef<HTMLButtonElement, MapleButtonProps>(
  ({ variant = 'green', size = 'sm', children, className = '', ...props }, ref) => {
    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeStyles[size];
    const textColor = variant === 'orange' ? 'text-black' : 'text-white';

    return (
      <Button
        ref={ref}
        className={`${sizeStyle} ${textColor} font-bold shadow-lg border-0 font-maplestory transition-all duration-200 flex items-center justify-center ${className}`}
        style={{ 
          background: variantStyle.default,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = variantStyle.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = variantStyle.default;
        }}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

MapleButton.displayName = 'MapleButton';
