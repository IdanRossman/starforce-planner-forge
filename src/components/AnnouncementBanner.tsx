import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Megaphone, X, ExternalLink, Calendar, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnnouncementData {
  id: string;
  title: string;
  message: string;
  type: 'patch' | 'event' | 'maintenance' | 'feature' | 'info';
  priority: 'low' | 'normal' | 'high' | 'critical';
  startDate: string; // ISO string
  endDate?: string; // ISO string, optional for indefinite announcements
  link?: string; // Optional link for more details
  linkText?: string; // Custom text for the link
  dismissible?: boolean; // Whether users can dismiss this announcement
}

const STORAGE_KEY = 'starforce-planner-dismissed-announcements';
const SESSION_KEY = 'starforce-planner-session-announcements-shown';

// Mock announcement data - in a real app, this would come from an API
const mockAnnouncements: AnnouncementData[] = [
  {
    id: 'starforce-transfer',
    title: 'New Feature: StarForce Transfer System',
    message: 'You can now transfer StarForce from one equipment to another! Click the transfer button in equipment forms to try it out.',
    type: 'feature',
    startDate: '2025-01-25T00:00:00Z',
    endDate: '2025-02-15T23:59:59Z',
    dismissible: false
  },
  {
    id: 'ui-improvements',
    title: 'Enhanced User Interface',
    message: 'We\'ve updated the interface with better navigation and improved visual design for a smoother experience.',
    type: 'info',
    priority: 'normal',
    startDate: '2025-01-20T00:00:00Z',
    dismissible: false
  },
  {
    id: 'bug-fixes',
    title: 'Bug Fixes & Performance',
    message: 'Fixed several issues with equipment calculations and improved overall app performance.',
    type: 'patch',
    priority: 'normal',
    startDate: '2025-01-15T00:00:00Z',
    dismissible: false
  }
];

const getAnnouncementIcon = (type: AnnouncementData['type']) => {
  switch (type) {
    case 'patch':
    case 'feature':
      return Star;
    case 'event':
      return Calendar;
    case 'maintenance':
      return Megaphone;
    case 'info':
    default:
      return Megaphone;
  }
};

const getAnnouncementColors = (type: AnnouncementData['type'], priority: AnnouncementData['priority']) => {
  if (priority === 'critical') {
    return {
      bg: 'bg-destructive/10 border-destructive/30',
      icon: 'text-destructive',
      badge: 'bg-destructive text-destructive-foreground'
    };
  }
  
  switch (type) {
    case 'patch':
    case 'feature':
      return {
        bg: 'bg-blue-500/10 border-blue-500/30',
        icon: 'text-blue-600',
        badge: 'bg-blue-500/20 text-blue-700 border-blue-500/30'
      };
    case 'event':
      return {
        bg: 'bg-green-500/10 border-green-500/30',
        icon: 'text-green-600',
        badge: 'bg-green-500/20 text-green-700 border-green-500/30'
      };
    case 'maintenance':
      return priority === 'high' ? {
        bg: 'bg-orange-500/10 border-orange-500/30',
        icon: 'text-orange-600',
        badge: 'bg-orange-500/20 text-orange-700 border-orange-500/30'
      } : {
        bg: 'bg-muted/50 border-border',
        icon: 'text-muted-foreground',
        badge: 'bg-muted text-muted-foreground'
      };
    case 'info':
    default:
      return {
        bg: 'bg-primary/10 border-primary/30',
        icon: 'text-primary',
        badge: 'bg-primary/20 text-primary-foreground border-primary/30'
      };
  }
};

const getBadgeText = (type: AnnouncementData['type']) => {
  switch (type) {
    case 'patch':
      return 'Patch Notes';
    case 'feature':
      return 'New Feature';
    case 'event':
      return 'Event';
    case 'maintenance':
      return 'Maintenance';
    case 'info':
    default:
      return 'Announcement';
  }
};

export function AnnouncementBanner() {
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());
  const [sessionAnnouncementsShown, setSessionAnnouncementsShown] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Load dismissed announcements from localStorage and check session storage
  useEffect(() => {
    try {
      // Load permanently dismissed announcements
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDismissedAnnouncements(new Set(JSON.parse(stored)));
      }
      
      // Check if announcements have been shown this session
      const sessionShown = sessionStorage.getItem(SESSION_KEY);
      const hasShownSession = !!sessionShown;
      setSessionAnnouncementsShown(hasShownSession);
      
      // Show dialog only if not shown this session
      if (!hasShownSession) {
        setIsDialogOpen(true);
      }
    } catch (error) {
      console.warn('Failed to load announcement state:', error);
    }
  }, []);

  // Save dismissed announcements to localStorage
  const saveDismissedAnnouncements = (dismissed: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(dismissed)));
    } catch (error) {
      console.warn('Failed to save dismissed announcements:', error);
    }
  };

  // Filter active announcements
  const activeAnnouncements = mockAnnouncements.filter(announcement => {
    // Check if announcements have been shown this session
    if (sessionAnnouncementsShown) {
      return false;
    }

    // Check if permanently dismissed
    if (announcement.dismissible && dismissedAnnouncements.has(announcement.id)) {
      return false;
    }

    // Optional: Still respect date ranges if you want
    // Uncomment the lines below if you want to keep date-based filtering
    /*
    const now = new Date();
    const startDate = new Date(announcement.startDate);
    const endDate = announcement.endDate ? new Date(announcement.endDate) : null;

    if (now < startDate) return false;
    if (endDate && now > endDate) return false;
    */

    return true;
  });

  // Sort by priority (critical > high > normal > low)
  const sortedAnnouncements = activeAnnouncements.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setSessionAnnouncementsShown(true);
    } catch (error) {
      console.warn('Failed to save session announcement state:', error);
    }
  };

  const handleDismiss = (announcementId: string) => {
    const newDismissed = new Set(dismissedAnnouncements);
    newDismissed.add(announcementId);
    setDismissedAnnouncements(newDismissed);
    saveDismissedAnnouncements(newDismissed);
  };

  // Don't render anything if no active announcements
  if (sortedAnnouncements.length === 0) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl w-full max-h-[80vh] overflow-y-auto p-0">
        <Card
          className={cn(
            "relative overflow-hidden border-0 bg-gradient-to-r from-card via-card/95 to-card",
            "min-h-[400px]"
          )}
          style={{
            background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)/30) 100%)'
          }}
        >
          {/* Greeting Header */}
          <DialogHeader className="p-0">
            <CardHeader className="pb-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-3xl animate-bounce">👋</span>
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-foreground font-maplestory">
                    Hey there! Welcome to StarForce Planner!
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground font-maplestory mt-1">
                    Your ultimate MapleStory enhancement companion
                  </p>
                </div>
              </div>
            </CardHeader>
          </DialogHeader>

          {/* Main Card Body */}
          <CardContent className="relative flex items-center gap-10 pt-8 pb-8 min-h-[300px]">
            {/* Left-Side Prominent Image - Always shows alter.jpg */}
            <div className="relative flex-shrink-0 flex flex-col items-center">
              <div className="w-64 h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/30 to-secondary/30 shadow-2xl ring-4 ring-primary/20 ring-offset-2 ring-offset-card">
                <img 
                  src="/alter.jpg" 
                  alt="StarForce Planner" 
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  style={{
                    filter: 'brightness(1.0) contrast(1.2) saturate(1.1)'
                  }}
                />
                {/* Decorative glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-2xl blur-sm -z-10"></div>
              </div>
              
              {/* Discord Contact Link */}
              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground font-maplestory mb-2">
                  Got feedback? Found a bug?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-maplestory text-xs bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-600 hover:text-indigo-700"
                  onClick={() => {
                    // Replace 'YourDiscordUsername' with your actual Discord username or server invite
                    window.open('https://discord.com/users/678636425364897821', '_blank');
                  }}
                >
                  Contact on Discord
                </Button>
              </div>
            </div>

            {/* Announcements List */}
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                {sortedAnnouncements.map((announcement, index) => {
                  const IconComponent = getAnnouncementIcon(announcement.type);
                  const colors = getAnnouncementColors(announcement.type, announcement.priority);

                  return (
                    <div key={announcement.id} className={cn(
                      "p-4 rounded-lg border border-border/50 bg-card/50",
                      "hover:bg-card/80 transition-colors duration-200",
                      index > 0 && "border-t border-border/30"
                    )}>
                      {/* Announcement Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="p-2 rounded-full bg-primary/10">
                            <IconComponent className={cn("h-4 w-4", colors.icon)} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs font-maplestory", colors.badge)}
                            >
                              {getBadgeText(announcement.type)}
                            </Badge>
                            {announcement.priority === 'high' && (
                              <Badge variant="destructive" className="text-xs">
                                Priority
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-lg font-bold leading-tight font-maplestory text-foreground mb-2">
                            {announcement.title}
                          </h3>
                          <p className="text-sm text-muted-foreground font-maplestory leading-relaxed">
                            {announcement.message}
                          </p>
                          
                          {/* Action Button */}
                          {announcement.link && (
                            <div className="mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="font-maplestory text-xs"
                                onClick={() => {
                                  if (announcement.link === '#') {
                                    alert('This would normally navigate to the feature!');
                                  } else {
                                    window.open(announcement.link, '_blank');
                                  }
                                }}
                              >
                                {announcement.linkText || 'Learn More'}
                                <ExternalLink className="ml-2 h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>

          {/* Decorative elements */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/10 to-transparent rounded-tr-full"></div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
