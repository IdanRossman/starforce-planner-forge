import { ReactNode } from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface ApiStatusBadgeProps {
  status: 'local' | 'api' | 'error';
  children?: ReactNode;
  className?: string;
}

const statusConfig = {
  local: {
    icon: WifiOff,
    text: 'Using local data (API unavailable)',
    className: 'text-amber-600 bg-amber-50 border-amber-200',
    iconClassName: 'text-amber-500'
  },
  api: {
    icon: Wifi,
    text: 'Connected to API',
    className: 'text-green-600 bg-green-50 border-green-200',
    iconClassName: 'text-green-500'
  },
  error: {
    icon: AlertTriangle,
    text: 'API Error',
    className: 'text-red-600 bg-red-50 border-red-200',
    iconClassName: 'text-red-500'
  }
};

export function ApiStatusBadge({ status, children, className = '' }: ApiStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className={`flex items-center gap-2 text-xs font-maplestory px-2 py-1 rounded border ${config.className} ${className}`}>
      <Icon className={`w-3 h-3 ${config.iconClassName}`} />
      <span>{children || config.text}</span>
    </div>
  );
}
