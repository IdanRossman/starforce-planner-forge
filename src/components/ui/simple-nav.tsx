import { Link, useNavigate } from 'react-router-dom';
import { Star, Waves, Trash2, LogOut, LogIn } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const userInitial = user?.email?.[0]?.toUpperCase() ?? '?';

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

        {!user && (
          <>
            <div className="simple-nav-divider" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate('/auth')}
                  className="simple-nav-clear-btn"
                  aria-label="Sign in"
                >
                  <LogIn className="simple-nav-toggle-icon" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sign In</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {user && (
          <>
            <div className="simple-nav-divider" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="simple-nav-user-btn" aria-label="User menu">
                  {userInitial}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-black/80 backdrop-blur-md border-white/20">
                <DropdownMenuLabel className="text-white/60 font-normal text-xs truncate">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </nav>
    </div>
  );
}
