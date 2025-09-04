import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapleButton } from './MapleButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  // Wizard functionality
  wizardMode?: boolean;
  wizardStep?: {
    current: number;
    total: number;
  };
  onNext?: () => void;
  onBack?: () => void;
  nextButtonText?: string;
  backButtonText?: string;
  nextButtonDisabled?: boolean;
  backButtonDisabled?: boolean;
  nextButtonVariant?: 'green' | 'orange' | 'blue' | 'red';
}

const positionClasses = {
  'bottom-right': 'fixed bottom-4 right-4',
  'bottom-left': 'fixed bottom-4 left-4',
  'top-right': 'fixed top-4 right-4',
  'top-left': 'fixed top-4 left-4',
  'center': 'fixed top-1/2 left-1/2'
};

const centerTransform = 'translate(-50%, -50%)';

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
  minWidth = '400px',
  // Wizard props
  wizardMode = false,
  wizardStep,
  onNext,
  onBack,
  nextButtonText = "Next",
  backButtonText = "Back",
  nextButtonDisabled = false,
  backButtonDisabled = false,
  nextButtonVariant = "green"
}: MapleDialogProps) {
  if (!isVisible) {
    return null;
  }

  // Combine center positioning with animation transform
  const finalTransform = position === 'center' 
    ? `${centerTransform} ${transform}` 
    : transform;

  return (
    <div 
      className={`${positionClasses[position]} z-50 ${className}`}
      style={{ 
        opacity: opacity,
        transform: finalTransform,
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
                        className={`w-24 h-24 border-3 border-yellow-400 bg-gray-50 ${
                          character.image.includes('/equipment/') || character.image.includes('equipment') 
                            ? 'object-contain' 
                            : 'object-cover rounded-full'
                        }`}
                        style={{ backgroundColor: 'rgba(245, 245, 245, 0.8)' }}
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
                    <CardContent className="p-4 flex flex-col h-full">
                      {/* Wizard Step Indicator */}
                      {wizardMode && wizardStep && (
                        <div className="flex justify-center mb-3">
                          <div className="flex items-center gap-2">
                            {Array.from({ length: wizardStep.total }, (_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  i + 1 <= wizardStep.current 
                                    ? 'bg-blue-500' 
                                    : 'bg-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-xs text-gray-600 ml-2 font-maplestory">
                              Step {wizardStep.current} of {wizardStep.total}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Main Content */}
                      <div className="flex-1 flex items-center">
                        {children}
                      </div>
                      
                      {/* Wizard Navigation */}
                      {wizardMode && (onNext || onBack) && (
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-300">
                          <div>
                            {onBack && (
                              <MapleButton
                                variant="green"
                                size="sm"
                                onClick={onBack}
                                disabled={backButtonDisabled}
                                className="gap-1"
                              >
                                <ChevronLeft className="w-3 h-3" />
                                {backButtonText}
                              </MapleButton>
                            )}
                          </div>
                          <div>
                            {onNext && (
                              <MapleButton
                                variant={nextButtonVariant}
                                size="sm"
                                onClick={onNext}
                                disabled={nextButtonDisabled}
                                className="gap-1"
                              >
                                {nextButtonText}
                                <ChevronRight className="w-3 h-3" />
                              </MapleButton>
                            )}
                          </div>
                        </div>
                      )}
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
