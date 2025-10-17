import { Link } from 'react-router-dom';
import { Star, Waves, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import './simple-nav.css';

interface NavItem {
  label: string;
  href: string;
}

interface SimpleNavProps {
  items: NavItem[];
  activeHref: string;
  brandText?: string;
  logoIcon?: React.ReactNode;
  waveMovementEnabled?: boolean;
  onWaveMovementToggle?: (enabled: boolean) => void;
  onClearStorage?: () => void;
}

export default function SimpleNav({ 
  items, 
  activeHref, 
  brandText = "React Bits",
  logoIcon,
  waveMovementEnabled = true,
  onWaveMovementToggle,
  onClearStorage
}: SimpleNavProps) {
  return (
    <div className="simple-nav-wrapper">
      <nav className="simple-nav-island">
        <Link to="/" className="simple-nav-brand">
          {logoIcon || <Star className="simple-nav-icon" />}
          <span className="simple-nav-brand-text">{brandText}</span>
        </Link>
        
        <div className="simple-nav-links">
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`simple-nav-link ${activeHref === item.href ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {onWaveMovementToggle && (
          <div className="simple-nav-divider" />
        )}

        {onWaveMovementToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="simple-nav-toggle">
                <Waves className="simple-nav-toggle-icon" />
                <Switch 
                  checked={waveMovementEnabled} 
                  onCheckedChange={onWaveMovementToggle}
                  aria-label="Toggle wave animation"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{waveMovementEnabled ? 'Disable' : 'Enable'} wave animation</p>
            </TooltipContent>
          </Tooltip>
        )}

        {onClearStorage && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onClearStorage}
                className="simple-nav-clear-btn"
                aria-label="Clear local storage"
              >
                <Trash2 className="simple-nav-toggle-icon" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear local storage</p>
            </TooltipContent>
          </Tooltip>
        )}
      </nav>
    </div>
  );
}
