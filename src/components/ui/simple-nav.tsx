import { Link, useNavigate } from 'react-router-dom';
import { Star, LogOut, LogIn, Coffee, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import './simple-nav.css';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SimpleNavProps {
  items: NavItem[];
  activeHref: string;
  brandText?: string;
  logoIcon?: React.ReactNode;
}

export default function SimpleNav({
  items,
  activeHref,
  brandText = "React Bits",
  logoIcon,
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
          {items.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`simple-nav-link ${isActive ? 'active' : ''}`}
                aria-label={item.label}
              >
                {/* Icon — shown on mobile only */}
                {item.icon && <item.icon className="simple-nav-link-icon" />}
                {/* Label — shown on desktop only */}
                <span className="simple-nav-link-text">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {!user && (
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
        )}

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="simple-nav-user-btn" aria-label="User menu">
                {userInitial}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-[hsl(217_33%_9%/0.98)] backdrop-blur-sm border-white/10">
              <DropdownMenuLabel className="text-white/50 font-normal text-xs truncate">
                {user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild>
                <a
                  href="https://ko-fi.com/idanrossman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/70 focus:text-white focus:bg-white/5 cursor-pointer"
                >
                  <Coffee className="w-4 h-4" />
                  Support on Ko-fi
                  <ExternalLink className="w-3 h-3 ml-auto text-white/30" />
                </a>
              </DropdownMenuItem>
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
        )}
      </nav>
    </div>
  );
}
