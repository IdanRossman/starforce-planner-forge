import { Users, Target, Settings, BarChart3, Upload, Leaf } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const mainItems = [
  { title: "Overview", url: "/", icon: BarChart3 },
  { title: "Characters", url: "/characters", icon: Users },
  { title: "Planning", url: "/planning", icon: Target },
];

const toolItems = [
  { title: "Import/Export", url: "/import-export", icon: Upload },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppNavbar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = (path: string) =>
    `px-4 py-2 rounded-md transition-colors ${
      isActive(path) 
        ? "bg-primary text-primary-foreground font-medium" 
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    }`;

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Home button with maple leaf */}
          <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-maple-orange rounded-full flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-maple-orange bg-clip-text text-transparent">
                MapleStory StarForce Planner
              </h1>
              <p className="text-xs text-muted-foreground">Plan your equipment upgrades efficiently</p>
            </div>
          </NavLink>
          
          {/* Navigation */}
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1">
              {/* Main Items */}
              {mainItems.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end={item.url === "/"}
                  className={getNavCls(item.url)}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.title}</span>
                  </div>
                </NavLink>
              ))}
              
              {/* Separator */}
              <div className="w-px h-6 bg-border mx-2" />
              
              {/* Tool Items */}
              {toolItems.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  className={getNavCls(item.url)}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.title}</span>
                  </div>
                </NavLink>
              ))}
            </nav>
            
            {/* Hashtags */}
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/80">
              <span className="hidden md:inline">#BuffMerc</span>
              <span className="hidden md:inline">#LetUsKeepTheDonkey</span>
              <span>🦄</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}