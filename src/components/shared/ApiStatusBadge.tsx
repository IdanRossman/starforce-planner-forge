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
    className: 'text-amber-400/70 bg-amber-400/8 border-amber-400/20',
    iconClassName: 'text-amber-400/60'
  },
  api: {
    icon: Wifi,
    text: 'Connected to API',
    className: 'text-green-400/70 bg-green-400/8 border-green-400/20',
    iconClassName: 'text-green-400/60'
  },
  error: {
    icon: AlertTriangle,
    text: 'API Error',
    className: 'text-red-400/70 bg-red-400/8 border-red-400/20',
    iconClassName: 'text-red-400/60'
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
