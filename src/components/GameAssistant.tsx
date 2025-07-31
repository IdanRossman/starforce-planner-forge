import { useState, useEffect, useCallback, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { MapleDialog, MapleButton } from '@/components/shared';
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
    <MapleDialog
      isVisible={isVisible}
      opacity={opacity}
      transform={transform}
      onCardClick={handleCardClick}
      onClose={handleClose}
      debugMode={debugMode}
      debugInfo={contextualTips.length > 1 ? {
        currentIndex: currentTipIndex,
        totalCount: contextualTips.length
      } : undefined}
      character={{
        name: activeCharacter.name,
        image: activeCharacter.image
      }}
      bottomLeftActions={
        debugMode && contextualTips.length > 1 ? (
          <MapleButton
            variant="orange"
            size="sm"
            onClick={showNextTip}
          >
            NEXT TIP
          </MapleButton>
        ) : undefined
      }
      bottomRightActions={
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
      }
    >
      {/* Message Text */}
      <div className="text-sm text-gray-800 leading-relaxed flex items-center h-full w-full font-maplestory font-normal">
        <p className="text-left w-full">
          {displayedText}
          {isTyping && <span className="animate-pulse">|</span>}
        </p>
      </div>
    </MapleDialog>
  );
}
