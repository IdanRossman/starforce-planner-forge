import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Equipment } from '@/types';
import { EquipmentFormData } from '@/hooks/utils/useEquipmentFormValidation';
import { useStarForceUtils } from '@/hooks/starforce/useStarForceUtils';
import { ToggleField } from '@/components/shared/forms';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Star, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedStarForceConfigurationSectionProps {
  watchStarforceable: boolean;
  watchLevel: number;
  autoAdjusted: { current?: boolean; target?: boolean };
  equipment?: Equipment;
}

/**
 * Enhanced StarForce configuration section with star counter UI
 * Replaces sliders with interactive star selection
 */
export function EnhancedStarForceConfigurationSection({
  watchStarforceable,
  watchLevel,
  autoAdjusted,
  equipment
}: EnhancedStarForceConfigurationSectionProps) {
  const form = useFormContext<EquipmentFormData>();
  const { getMaxStars, getDefaultTarget } = useStarForceUtils();
  
  const currentStars = form.watch('currentStarForce') || 0;
  const targetStars = form.watch('targetStarForce') || 0;
  const maxStars = watchLevel ? getMaxStars(watchLevel) : 25;
  
  const [hoveredCurrentStar, setHoveredCurrentStar] = useState<number | null>(null);
  const [hoveredTargetStar, setHoveredTargetStar] = useState<number | null>(null);

  const handleCurrentStarClick = (starCount: number) => {
    const newCurrent = starCount === currentStars ? 0 : starCount;
    form.setValue('currentStarForce', newCurrent, { shouldValidate: true, shouldDirty: true });
    
    // Auto-adjust target if it's below new current
    if (targetStars < newCurrent) {
      form.setValue('targetStarForce', newCurrent, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleTargetStarClick = (starCount: number) => {
    const newTarget = starCount === targetStars ? currentStars : starCount;
    // Ensure target is never below current
    const finalTarget = Math.max(newTarget, currentStars);
    form.setValue('targetStarForce', finalTarget, { shouldValidate: true, shouldDirty: true });
  };

  const renderStarRow = (
    type: 'current' | 'target',
    value: number,
    hoveredValue: number | null,
    onStarClick: (count: number) => void,
    onStarHover: (count: number | null) => void
  ) => {
    const stars = [];
    const displayValue = hoveredValue !== null ? hoveredValue : value;
    
    for (let i = 1; i <= maxStars; i++) {
      const isActive = i <= value;
      const isHovered = hoveredValue !== null && i <= hoveredValue;
      const isPreview = hoveredValue !== null && i <= hoveredValue && i > value;
      
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => onStarClick(i)}
          onMouseEnter={() => onStarHover(i)}
          onMouseLeave={() => onStarHover(null)}
          className={cn(
            "transition-all duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          disabled={type === 'target' && i < currentStars}
        >
          <Star
            className={cn(
              "w-6 h-6 transition-all duration-150",
              isActive || isHovered 
                ? "fill-yellow-400 text-yellow-400 drop-shadow-sm" 
                : "text-gray-300 hover:text-yellow-300",
              isPreview && "fill-yellow-200 text-yellow-300",
              i > 15 && isActive && "fill-orange-400 text-orange-400",
              i > 20 && isActive && "fill-red-400 text-red-400",
              type === 'target' && i < currentStars && "opacity-30"
            )}
          />
        </button>
      );
    }
    
    return stars;
  };

  if (!watchStarforceable) {
    return (
      <Card className="p-4 bg-gray-50 border-dashed">
        <div className="text-center py-6">
          <Star className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <h3 className="font-maplestory font-semibold text-gray-600 mb-1">StarForce Enhancement Disabled</h3>
          <p className="text-sm text-gray-500 font-maplestory">Enable StarForce to configure enhancement goals</p>
          <div className="mt-4">
            <ToggleField
              name="starforceable"
              control={form.control}
              title="Enable StarForce Enhancement"
              description="Allow this equipment to be enhanced with StarForce"
            />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* StarForce Toggle */}
      <ToggleField
        name="starforceable"
        control={form.control}
        title="StarForce Enhancement"
        description="Enable StarForce enhancement for this equipment"
      />

      {/* Current StarForce */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <h4 className="font-maplestory font-semibold text-gray-900">Current StarForce</h4>
          <Badge variant="secondary" className="font-maplestory">
            {currentStars} ★
          </Badge>
          {autoAdjusted.current && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Auto-adjusted
            </Badge>
          )}
        </div>
        
        <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex flex-wrap gap-1 justify-center">
            {renderStarRow(
              'current',
              currentStars,
              hoveredCurrentStar,
              handleCurrentStarClick,
              setHoveredCurrentStar
            )}
          </div>
          <div className="text-center mt-3">
            <p className="text-sm text-gray-600 font-maplestory">
              Click a star to set your current enhancement level
            </p>
            {equipment?.transferredStars && equipment.transferredStars > 0 && (
              <p className="text-xs text-blue-600 font-maplestory mt-1">
                Minimum: {equipment.transferredStars}★ (transferred stars)
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Target StarForce */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h4 className="font-maplestory font-semibold text-gray-900">Target StarForce</h4>
          <Badge variant="secondary" className="font-maplestory">
            {targetStars} ★
          </Badge>
          {autoAdjusted.target && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Auto-adjusted
            </Badge>
          )}
        </div>
        
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex flex-wrap gap-1 justify-center">
            {renderStarRow(
              'target',
              targetStars,
              hoveredTargetStar,
              handleTargetStarClick,
              setHoveredTargetStar
            )}
          </div>
          <div className="text-center mt-3">
            <p className="text-sm text-gray-600 font-maplestory">
              Click a star to set your enhancement goal
            </p>
            <p className="text-xs text-gray-500 font-maplestory mt-1">
              Target must be equal to or higher than current stars
            </p>
          </div>
        </Card>
      </div>

      {/* Enhancement Progress Summary */}
      {currentStars > 0 || targetStars > 0 ? (
        <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
            <h4 className="font-maplestory font-semibold text-gray-900">Enhancement Summary</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm font-maplestory text-gray-600">Current Level</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-green-400 text-green-400" />
                <span className="font-bold text-green-700 font-maplestory">{currentStars}</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-maplestory text-gray-600">Target Level</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-700 font-maplestory">{targetStars}</span>
              </div>
            </div>
          </div>
          
          {targetStars > currentStars && (
            <div className="mt-3 pt-3 border-t border-yellow-200">
              <div className="flex items-center justify-center gap-2 text-sm font-maplestory">
                <Sparkles className="w-4 h-4 text-yellow-600" />
                <span className="text-gray-700">
                  {targetStars - currentStars} enhancement{targetStars - currentStars !== 1 ? 's' : ''} needed
                </span>
              </div>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
