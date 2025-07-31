import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MapleDialogProps {
  isVisible: boolean;
  opacity: number;
  transform: string;
  onCardClick?: () => void;
  onClose?: () => void;
  debugMode?: boolean;
  debugInfo?: {
    currentIndex: number;
    totalCount: number;
  };
  character?: {
    name: string;
    image: string;
  };
  bottomLeftActions?: ReactNode;
  bottomRightActions?: ReactNode;
  children: ReactNode;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  minWidth?: string;
}

const positionClasses = {
  'bottom-right': 'fixed bottom-4 right-4',
  'bottom-left': 'fixed bottom-4 left-4',
  'top-right': 'fixed top-4 right-4',
  'top-left': 'fixed top-4 left-4',
  'center': 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
};

export function MapleDialog({
  isVisible,
  opacity,
  transform,
  onCardClick,
  onClose,
  debugMode = false,
  debugInfo,
  character,
  bottomLeftActions,
  bottomRightActions,
  children,
  className = "",
  position = 'bottom-right',
  minWidth = '400px'
}: MapleDialogProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`${positionClasses[position]} z-50 max-w-lg ${className}`}
      style={{ 
        opacity: opacity,
        transform: transform,
        transition: 'opacity 0.4s ease-out, transform 0.4s ease-out'
      }}
    >
      {/* Blue outer card (MapleStory style frame) */}
      <Card 
        className="shadow-2xl border-4 backdrop-blur-sm relative" 
        style={{ 
          borderColor: '#2AA6DA', 
          backgroundColor: 'rgba(42, 166, 218, 0.9)',
          minWidth: minWidth
        }}
      >
        
        {/* Debug Mode Indicator */}
        {debugMode && (
          <div className="absolute top-1 left-1 z-10 flex gap-2">
            <span className="text-xs px-2 py-1 bg-yellow-400 text-black font-bold rounded shadow-lg">
              DEBUG
            </span>
            {debugInfo && (
              <span className="text-xs px-2 py-1 bg-blue-500 text-white font-bold rounded shadow-lg">
                {debugInfo.currentIndex + 1}/{debugInfo.totalCount}
              </span>
            )}
          </div>
        )}

        <CardContent className="p-2 pb-8">
          {/* Gray middle card */}
          <Card className="border-gray-700 border-2" style={{ backgroundColor: '#EEEEEE' }}>
            <CardContent className="p-0">
              <div className="flex items-stretch gap-0">
                
                {/* Character Portrait Section (conditional) */}
                {character && (
                  <div className="p-3 border-r-2 border-gray-500 flex flex-col items-center justify-center" 
                       style={{ backgroundColor: 'rgba(238, 238, 238, 0.9)' }}>
                    <div className="relative mb-2">
                      <img 
                        src={character.image} 
                        alt={character.name}
                        className="w-24 h-24 object-cover border-3 border-yellow-400"
                        style={{ backgroundColor: 'transparent' }}
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                    <div className="px-2 py-1 rounded-md shadow-sm" style={{ backgroundColor: '#707070' }}>
                      <span className="text-xs font-bold text-white text-center block font-maplestory">
                        {character.name}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Content card */}
                <div className="flex-1" style={{ width: character ? '66%' : '100%' }}>
                  <Card 
                    className={`border-0 h-full transition-all duration-200 ${onCardClick ? 'cursor-pointer hover:bg-opacity-95' : ''}`}
                    style={{ backgroundColor: '#F9F9F9' }}
                    onClick={onCardClick}
                  >
                    <CardContent className="p-4 flex items-center h-full">
                      {children}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Bottom Left Actions */}
          {(bottomLeftActions || onClose) && (
            <div className="absolute bottom-1 left-1 flex gap-2">
              {bottomLeftActions}
              {onClose && (
                <Button
                  size="sm"
                  onClick={onClose}
                  className="h-5 px-10 text-xs text-white font-bold shadow-lg border-0 font-maplestory"
                  style={{ 
                    background: 'linear-gradient(to top, #98CC21, #92CC75)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to top, #86B51E, #7FB866)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to top, #98CC21, #92CC75)';
                  }}
                >
                  END CHAT
                </Button>
              )}
            </div>
          )}
          
          {/* Bottom Right Actions */}
          {bottomRightActions && (
            <div className="absolute bottom-1 right-1">
              {bottomRightActions}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
