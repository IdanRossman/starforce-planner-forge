import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
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
}

export default function SimpleNav({ 
  items, 
  activeHref, 
  brandText = "React Bits",
  logoIcon 
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
      </nav>
    </div>
  );
}
