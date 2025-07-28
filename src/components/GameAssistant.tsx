import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AssistantTip, AssistantCharacter, GameAssistantProps } from '@/types';
import { getCharacterForPage, globalTimingConfig } from '@/data/assistantCharacters';

// Session storage key for tracking if user has been greeted
const GREETING_SESSION_KEY = 'starforce-planner-greeted';
// Session storage key for tips disabled state
const TIPS_DISABLED_SESSION_KEY = 'starforce-planner-tips-disabled';

export function GameAssistant({ 
  character, 
  pageContext = 'general',
  onClose,
  debugMode = false // New prop to control debug behavior
}: GameAssistantProps) {
  const [currentTip, setCurrentTip] = useState<AssistantTip | null>(null);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [transform, setTransform] = useState('translateX(20px)');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typewriterComplete, setTypewriterComplete] = useState(false);
  const [tipsDisabled, setTipsDisabled] = useState(() => {
    return sessionStorage.getItem(TIPS_DISABLED_SESSION_KEY) === 'true';
  });

  // Get character from centralized config if not provided
  const activeCharacter = character || getCharacterForPage(pageContext);

  // Check if user has been greeted this session
  const hasBeenGreeted = useMemo(() => {
    return sessionStorage.getItem(GREETING_SESSION_KEY) === 'true';
  }, []);

  // Filter tips based on current page context and greeting status - memoized to prevent re-renders
  const contextualTips = useMemo((): AssistantTip[] => {
    let filteredTips = activeCharacter.tips.filter(tip => 
      !tip.context || tip.context.length === 0 || tip.context.includes(pageContext)
    );

    // If user has been greeted this session, exclude general welcome tips
    if (hasBeenGreeted) {
      filteredTips = filteredTips.filter(tip => tip.type !== 'general');
    }

    return filteredTips;
  }, [activeCharacter.tips, pageContext, hasBeenGreeted]);

  const handleClose = useCallback(() => {
    // Start slide + fade-out animation
    setOpacity(0);
    setTransform('translateX(20px)');
    // Hide component after animation completes
    setTimeout(() => {
      setIsVisible(false);
      setCurrentTipIndex(0); // Reset tip index when closing
      onClose?.();
    }, 400);
  }, [onClose]);

  const toggleTips = useCallback(() => {
    const newDisabledState = !tipsDisabled;
    setTipsDisabled(newDisabledState);
    sessionStorage.setItem(TIPS_DISABLED_SESSION_KEY, newDisabledState.toString());
    
    if (newDisabledState) {
      // If disabling tips, close the component
      handleClose();
    }
  }, [tipsDisabled, handleClose]);

  const showNextTip = useCallback(() => {
    if (contextualTips.length === 0) return;
    
    const nextIndex = (currentTipIndex + 1) % contextualTips.length;
    setCurrentTipIndex(nextIndex);
    
    // Start fade-out animation
    setOpacity(0);
    setTransform('translateX(20px)');
    
    setTimeout(() => {
      // Change tip and reset states
      const nextTip = contextualTips[nextIndex];
      setCurrentTip(nextTip);
      
      // Mark user as greeted if this is a general tip
      if (nextTip.type === 'general') {
        sessionStorage.setItem(GREETING_SESSION_KEY, 'true');
      }
      
      setDisplayedText('');
      setIsTyping(false);
      setTypewriterComplete(false);
      
      // Start fade-in animation
      setTimeout(() => {
        setOpacity(1);
        setTransform('translateX(0px)');
        // Start typewriter effect
        setTimeout(() => {
          setIsTyping(true);
        }, 200);
      }, 100);
    }, 300);
  }, [contextualTips, currentTipIndex]);

  // Show the tip after component mounts with slide + fade-in effect
  // In debug mode, tip persists; otherwise it cycles through tips
  useEffect(() => {
    if (contextualTips.length === 0 || tipsDisabled) return;
    
    const initialDelay = debugMode ? globalTimingConfig.debugInitialDelay : globalTimingConfig.initialDelay;
    
    const timer = setTimeout(() => {
      const firstTip = contextualTips[0];
      setCurrentTip(firstTip);
      
      // Mark user as greeted if this is a general tip
      if (firstTip.type === 'general') {
        sessionStorage.setItem(GREETING_SESSION_KEY, 'true');
      }
      
      setIsVisible(true);
      // Start slide + fade-in animation
      setTimeout(() => {
        setOpacity(1);
        setTransform('translateX(0px)');
        // Start typewriter effect after slide-in completes
        setTimeout(() => {
          setIsTyping(true);
        }, 200);
      }, 100);
    }, initialDelay);
    
    // If not in debug mode, cycle through tips
    let tipCycleTimer: NodeJS.Timeout;
    if (!debugMode && contextualTips.length > 1) {
      // Start cycling after the first tip has been displayed
      tipCycleTimer = setTimeout(() => {
        let currentIndex = 0;
        const cycleTips = () => {
          currentIndex = (currentIndex + 1) % contextualTips.length;
          setCurrentTipIndex(currentIndex);
          
          // Start fade-out animation
          setOpacity(0);
          setTransform('translateX(20px)');
          
          setTimeout(() => {
            // Change tip and reset states
            const nextTip = contextualTips[currentIndex];
            setCurrentTip(nextTip);
            
            // Mark user as greeted if this is a general tip
            if (nextTip.type === 'general') {
              sessionStorage.setItem(GREETING_SESSION_KEY, 'true');
            }
            
            setDisplayedText('');
            setIsTyping(false);
            setTypewriterComplete(false);
            
            // Start fade-in animation
            setTimeout(() => {
              setOpacity(1);
              setTransform('translateX(0px)');
              // Start typewriter effect
              setTimeout(() => {
                setIsTyping(true);
              }, 200);
            }, 100);
          }, globalTimingConfig.transitionDelay); // Use global transition delay instead of hardcoded 300ms
          
          // Schedule next tip - wait for tip display duration + next tip delay
          tipCycleTimer = setTimeout(cycleTips, globalTimingConfig.tipDisplayDuration + globalTimingConfig.nextTipDelay);
        };
        cycleTips();
      }, globalTimingConfig.tipDisplayDuration + globalTimingConfig.nextTipDelay); // Wait for initial tip to complete
    } else if (!debugMode) {
      // Single tip - auto-hide after showing
      tipCycleTimer = setTimeout(() => {
        handleClose();
      }, initialDelay + globalTimingConfig.tipDisplayDuration);
    }
    
    return () => {
      clearTimeout(timer);
      if (tipCycleTimer) clearTimeout(tipCycleTimer);
    };
  }, [debugMode, handleClose, contextualTips, tipsDisabled]); // Added tipsDisabled to dependencies

  // Typewriter effect
  useEffect(() => {
    if (!isTyping || !currentTip) return;

    const fullText = currentTip.message;
    let currentIndex = 0;

    const typeTimer = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        setTypewriterComplete(true);
        setIsTyping(false);
        clearInterval(typeTimer);
      }
    }, 50); // Adjust speed here (50ms = fast typing)

    return () => clearInterval(typeTimer);
  }, [isTyping, currentTip]);

  const handleCardClick = () => {
    if (isTyping && currentTip) {
      // Complete the text immediately
      setDisplayedText(currentTip.message);
      setIsTyping(false);
      setTypewriterComplete(true);
    }
  };

  // If tips are disabled, don't show anything - respect the user's choice for this session
  if (tipsDisabled) {
    return null;
  }

  if (!isVisible || !currentTip) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 max-w-lg"
      style={{ 
        opacity: opacity,
        transform: transform,
        transition: 'opacity 0.4s ease-out, transform 0.4s ease-out'
      }}
    >
      {/* Blue outer card (MapleStory style frame) */}
      <Card className="shadow-2xl border-4 backdrop-blur-sm relative min-w-[400px]" style={{ borderColor: '#2AA6DA', backgroundColor: 'rgba(42, 166, 218, 0.9)' }}>
        {/* Debug Mode Indicator */}
        {debugMode && (
          <div className="absolute top-1 left-1 z-10 flex gap-2">
            <span className="text-xs px-2 py-1 bg-yellow-400 text-black font-bold rounded shadow-lg">
              DEBUG
            </span>
            {contextualTips.length > 1 && (
              <span className="text-xs px-2 py-1 bg-blue-500 text-white font-bold rounded shadow-lg">
                {currentTipIndex + 1}/{contextualTips.length}
              </span>
            )}
          </div>
        )}
        <CardContent className="p-2 pb-8">
          {/* Gray middle card with character image */}
          <Card className="border-gray-700 border-2" style={{ backgroundColor: '#EEEEEE' }}>
            <CardContent className="p-0">
              <div className="flex items-stretch gap-0">
                {/* Character Portrait Section */}
                <div className="p-3 border-r-2 border-gray-500 flex flex-col items-center justify-center" style={{ backgroundColor: 'rgba(238, 238, 238, 0.9)' }}>
                  <div className="relative mb-2">
                    <img 
                      src={activeCharacter.image} 
                      alt={activeCharacter.name}
                      className="w-24 h-24 object-cover border-3 border-yellow-400"
                      style={{ backgroundColor: 'transparent' }}
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  {/* Character Name Tag */}
                  <div className="px-2 py-1 rounded-md shadow-sm" style={{ backgroundColor: '#707070' }}>
                    <span className="text-xs font-bold text-white text-center block font-maplestory">
                      {activeCharacter.name}
                    </span>
                  </div>
                </div>
                
                {/* White content card (66% width) */}
                <div className="flex-1" style={{ width: '66%' }}>
                  <Card 
                    className="border-0 h-full cursor-pointer hover:bg-opacity-95 transition-all duration-200" 
                    style={{ backgroundColor: '#F9F9F9' }}
                    onClick={handleCardClick}
                  >
                    <CardContent className="p-4 flex items-center h-full">
                      {/* Message Text */}
                      <div className="text-sm text-gray-800 leading-relaxed flex items-center h-full w-full font-maplestory font-normal">
                        <p className="text-left w-full">
                          {displayedText}
                          {isTyping && <span className="animate-pulse">|</span>}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* END CHAT button positioned at bottom left of blue border */}
          <div className="absolute bottom-1 left-1 flex gap-2">
            <Button
              size="sm"
              onClick={handleClose}
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
            
            {/* Debug Navigation Buttons */}
            {debugMode && contextualTips.length > 1 && (
              <Button
                size="sm"
                onClick={showNextTip}
                className="h-7 px-3 text-xs text-black font-bold shadow-lg border-0 font-maplestory"
                style={{ 
                  background: 'linear-gradient(to top, #FFD700, #FFA500)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to top, #FFB300, #FF8C00)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to top, #FFD700, #FFA500)';
                }}
              >
                NEXT TIP
              </Button>
            )}
          </div>
          
          {/* Tips Toggle positioned at bottom right of blue border */}
          <div className="absolute bottom-1 right-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="tips-toggle"
                checked={!tipsDisabled}
                onCheckedChange={(checked) => {
                  if (!checked) {
                    toggleTips();
                  }
                }}
                className="h-4 w-4 border-2 border-white data-[state=checked]:bg-white data-[state=checked]:text-blue-600 data-[state=checked]:border-white"
                style={{
                  backgroundColor: tipsDisabled ? 'transparent' : 'white'
                }}
              />
              <label 
                htmlFor="tips-toggle" 
                className="text-xs text-white font-medium cursor-pointer select-none drop-shadow-sm font-maplestory"
              >
                Disable tips
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
