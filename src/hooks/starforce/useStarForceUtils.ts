import { useMemo } from 'react';
import { getMaxStarForce, getDefaultTargetStarForce } from '@/lib/utils';

/**
 * Hook for StarForce utility calculations and validation
 * Provides common StarForce functions used in forms and components
 */
export function useStarForceUtils() {
  
  /**
   * Calculate maximum StarForce for equipment level
   * @param level - Equipment level
   * @returns Maximum possible StarForce for the level
   */
  const getMaxStars = (level: number): number => {
    return getMaxStarForce(level);
  };

  /**
   * Calculate default target StarForce for equipment level
   * @param level - Equipment level  
   * @returns Recommended target StarForce for the level
   */
  const getDefaultTarget = (level: number): number => {
    return getDefaultTargetStarForce(level);
  };

  /**
   * Validate StarForce values for equipment
   * @param level - Equipment level
   * @param currentStars - Current StarForce
   * @param targetStars - Target StarForce
   * @param starforceable - Whether equipment can be starforced
   * @returns Validation result with adjusted values
   */
  const validateAndAdjustStarForce = (
    level: number,
    currentStars: number,
    targetStars: number,
    starforceable: boolean
  ) => {
    if (!starforceable) {
      return {
        currentStarForce: 0,
        targetStarForce: 0,
        adjustments: {
          current: currentStars !== 0,
          target: targetStars !== 0
        }
      };
    }

    const maxStars = getMaxStars(level);
    let adjustedCurrent = currentStars;
    let adjustedTarget = targetStars;
    const adjustments = { current: false, target: false };

    // Adjust current stars if above max
    if (adjustedCurrent > maxStars) {
      adjustedCurrent = maxStars;
      adjustments.current = true;
    }

    // Adjust target stars if above max
    if (adjustedTarget > maxStars) {
      adjustedTarget = maxStars;
      adjustments.target = true;
    }

    // Ensure target is not less than current
    if (adjustedTarget < adjustedCurrent) {
      adjustedTarget = adjustedCurrent;
      adjustments.target = true;
    }

    return {
      currentStarForce: adjustedCurrent,
      targetStarForce: adjustedTarget,
      adjustments
    };
  };

  /**
   * Get StarForce recommendations based on equipment level
   * @param level - Equipment level
   * @returns Object with max stars, default target, and common targets
   */
  const getStarForceRecommendations = useMemo(() => {
    return (level: number) => {
      const maxStars = getMaxStars(level);
      const defaultTarget = getDefaultTarget(level);
      
      // Common target milestones
      const commonTargets = [];
      if (maxStars >= 15) commonTargets.push(15);
      if (maxStars >= 17) commonTargets.push(17);
      if (maxStars >= 20) commonTargets.push(20);
      if (maxStars >= 22) commonTargets.push(22);
      if (maxStars >= 25) commonTargets.push(25);

      return {
        maxStars,
        defaultTarget,
        commonTargets,
        isHighLevel: level >= 160,
        isSuperiorEquipment: level >= 250
      };
    };
  }, []);

  /**
   * Calculate StarForce efficiency metrics
   * @param currentStars - Current StarForce
   * @param targetStars - Target StarForce  
   * @param level - Equipment level
   * @returns Efficiency metrics for the upgrade path
   */
  const getStarForceEfficiency = (
    currentStars: number,
    targetStars: number,
    level: number
  ) => {
    const maxStars = getMaxStars(level);
    const totalPossible = maxStars;
    const upgradePath = targetStars - currentStars;
    
    return {
      completionPercentage: Math.round((targetStars / totalPossible) * 100),
      upgradeSteps: upgradePath,
      isMaximized: targetStars === maxStars,
      remainingPotential: maxStars - targetStars,
      difficultyLevel: targetStars >= 17 ? 'high' : targetStars >= 12 ? 'medium' : 'low'
    };
  };

  /**
   * Check if StarForce configuration is valid
   * @param level - Equipment level
   * @param currentStars - Current StarForce
   * @param targetStars - Target StarForce
   * @param starforceable - Whether equipment can be starforced
   * @returns Validation result with error messages
   */
  const isValidStarForceConfig = (
    level: number,
    currentStars: number,
    targetStars: number,
    starforceable: boolean
  ) => {
    const errors: string[] = [];
    
    if (!starforceable && (currentStars > 0 || targetStars > 0)) {
      errors.push('This equipment cannot be starforced');
    }
    
    if (starforceable) {
      const maxStars = getMaxStars(level);
      
      if (currentStars > maxStars) {
        errors.push(`Current StarForce cannot exceed ${maxStars}★ for level ${level} equipment`);
      }
      
      if (targetStars > maxStars) {
        errors.push(`Target StarForce cannot exceed ${maxStars}★ for level ${level} equipment`);
      }
      
      if (targetStars < currentStars) {
        errors.push('Target StarForce must be greater than or equal to current StarForce');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return {
    // Basic utilities
    getMaxStars,
    getDefaultTarget,
    
    // Validation and adjustment
    validateAndAdjustStarForce,
    isValidStarForceConfig,
    
    // Analysis and recommendations
    getStarForceRecommendations,
    getStarForceEfficiency
  };
}

export type StarForceUtilities = ReturnType<typeof useStarForceUtils>;
