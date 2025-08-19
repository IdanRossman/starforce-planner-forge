import { useMemo } from 'react';

export interface LuckRating {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export interface DangerLevel {
  level: 'low' | 'medium' | 'high' | 'extreme';
  color: string;
  bgColor: string;
}

/**
 * Hook for all display formatting utilities
 * Handles mesos formatting, luck ratings, colors, and visual representations
 */
export function useFormatting() {
  
  // Mesos formatting functions
  const formatMesos = useMemo(() => ({
    // Format for display with commas and units
    display: (mesos: number): string => {
      if (mesos >= 1000000000) {
        return `${(mesos / 1000000000).toFixed(1)}B`;
      } else if (mesos >= 1000000) {
        return `${(mesos / 1000000).toFixed(1)}M`;
      } else if (mesos >= 1000) {
        return `${(mesos / 1000).toFixed(1)}K`;
      }
      return mesos.toLocaleString();
    },
    
    // Format for export (plain numbers with commas)
    export: (mesos: number): string => {
      return mesos.toLocaleString();
    },
    
    // Format with full precision for calculations
    precise: (mesos: number): string => {
      return mesos.toString();
    },
    
    // Auto-detect unit and return appropriate format
    auto: (mesos: number): string => {
      if (mesos >= 1000000) {
        return formatMesos.display(mesos);
      }
      return mesos.toLocaleString();
    }
  }), []);

  // Luck rating analysis
  const getLuckRating = useMemo(() => (luckPercentage: number): LuckRating => {
    if (luckPercentage >= 80) {
      return {
        label: 'Extremely Lucky',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800'
      };
    } else if (luckPercentage >= 60) {
      return {
        label: 'Very Lucky',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800'
      };
    } else if (luckPercentage >= 40) {
      return {
        label: 'Lucky',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800'
      };
    } else if (luckPercentage >= 20) {
      return {
        label: 'Average',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800'
      };
    } else if (luckPercentage >= 5) {
      return {
        label: 'Unlucky',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800'
      };
    } else {
      return {
        label: 'Very Unlucky',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800'
      };
    }
  }, []);

  // Enhanced luck rating with dark mode support
  const getEnhancedLuckRating = useMemo(() => (luckPercentage: number): LuckRating => {
    const base = getLuckRating(luckPercentage);
    return {
      ...base,
      bgColor: `${base.bgColor} dark:${base.bgColor.replace('100', '900/20')}`,
      textColor: `${base.textColor} dark:${base.color}`
    };
  }, [getLuckRating]);

  // Danger level assessment
  const getDangerLevel = useMemo(() => (starLevel: number): DangerLevel => {
    if (starLevel >= 20) {
      return {
        level: 'extreme',
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/20'
      };
    } else if (starLevel >= 16) {
      return {
        level: 'high',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20'
      };
    } else if (starLevel >= 11) {
      return {
        level: 'medium',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
      };
    } else {
      return {
        level: 'low',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/20'
      };
    }
  }, []);

  // Color utilities for luck percentage
  const getLuckColor = useMemo(() => ({
    text: (luckPercentage: number): string => {
      const rating = getLuckRating(luckPercentage);
      return rating.color;
    },
    
    background: (luckPercentage: number): string => {
      const rating = getEnhancedLuckRating(luckPercentage);
      return rating.bgColor;
    },
    
    textWithBg: (luckPercentage: number): string => {
      const rating = getEnhancedLuckRating(luckPercentage);
      return rating.textColor;
    }
  }), [getLuckRating, getEnhancedLuckRating]);

  // Star level visual representation
  const getStarDisplay = useMemo(() => (stars: number): string => {
    if (stars <= 0) return '☆☆☆☆☆';
    const filledStars = '★'.repeat(Math.min(stars, 5));
    const emptyStars = '☆'.repeat(Math.max(0, 5 - stars));
    return filledStars + emptyStars;
  }, []);

  // Progress percentage calculation
  const getProgressPercentage = useMemo(() => (current: number, target: number): number => {
    if (target <= 0) return 100;
    return Math.min(100, (current / target) * 100);
  }, []);

  // Luck text helper for simple text descriptions
  const getLuckText = useMemo(() => (percentage: number): string => {
    if (percentage === 0) return "";
    if (percentage < -25) return "Far below avg";
    if (percentage < -10) return "Below avg";
    if (percentage < 0) return "Below avg";
    if (percentage <= 10) return "Above avg";
    if (percentage <= 25) return "Above avg";
    return "Far above avg";
  }, []);

  return {
    formatMesos,
    getLuckRating,
    getEnhancedLuckRating,
    getDangerLevel,
    getLuckColor,
    getStarDisplay,
    getProgressPercentage,
    getLuckText
  };
}
