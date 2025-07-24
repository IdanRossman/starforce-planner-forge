import { Users, Leaf, Home, Calculator } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const mainItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Quick Planning", url: "/quick-planning", icon: Calculator },
  { title: "Characters", url: "/characters", icon: Users },
];

const toolItems = [
  // Future tool items can be added here
];

export function AppNavbar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = (path: string) =>
    `px-4 py-2 rounded-md transition-colors min-w-[100px] text-center ${
      isActive(path) 
        ? "bg-primary text-primary-foreground font-medium" 
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    }`;

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        {/* Mobile Layout */}
        <div className="flex flex-col gap-3 md:hidden">
          {/* Top row: Logo and hashtags */}
          <div className="flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-6 h-6 bg-gradient-to-r from-primary to-maple-orange rounded-full flex items-center justify-center">
                <Leaf className="w-3 h-3 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-maple-orange bg-clip-text text-transparent">
                StarForce Planner
              </h1>
            </NavLink>
            
            <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground/80">
              <span>#BuffMerc</span>
              <span>🦄</span>
            </div>
          </div>
          
          {/* Bottom row: Navigation */}
          <nav className="flex items-center justify-center gap-1 overflow-x-auto">
            {mainItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.url === "/"}
                className={getNavCls(item.url)}
              >
                <div className="flex items-center gap-1">
                  <item.icon className="w-3 h-3" />
                  <span className="text-xs">{item.title}</span>
                </div>
              </NavLink>
            ))}
            
            {toolItems.length > 0 && (
              <>
                <div className="w-px h-4 bg-border mx-1" />
                
                {toolItems.map((item) => (
                  <NavLink
                    key={item.title}
                    to={item.url}
                    className={getNavCls(item.url)}
                  >
                    <div className="flex items-center gap-1">
                      <item.icon className="w-3 h-3" />
                      <span className="text-xs">{item.title}</span>
                    </div>
                  </NavLink>
                ))}
              </>
            )}
          </nav>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          {/* Logo/Home button - Far Left */}
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
          
          {/* Navigation - Center */}
          <nav className="flex items-center gap-1">
            {mainItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.url === "/"}
                className={getNavCls(item.url)}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </div>
              </NavLink>
            ))}
            
            {toolItems.length > 0 && (
              <>
                <div className="w-px h-6 bg-border mx-2" />
                
                {toolItems.map((item) => (
                  <NavLink
                    key={item.title}
                    to={item.url}
                    className={getNavCls(item.url)}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </div>
                  </NavLink>
                ))}
              </>
            )}
          </nav>
          
          {/* Hashtags - Far Right */}
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/80">
            <span>#BuffMerc</span>
            <span>#LetUsKeepTheDonkey</span>
            <span>🦄</span>
          </div>
        </div>
      </div>
    </header>
  );
}