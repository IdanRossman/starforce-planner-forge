import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Star, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Equipment } from '@/types';
import { calculateBulkStarforce, BulkItemCalculationDto } from '@/services/starforceService';
import { potentialService, PotentialBulkItem } from '@/services/potentialService';
import { useFormatting } from '@/hooks/display/useFormatting';

interface CharacterWorthSummaryProps {
  equipment: Equipment[];
  isVisible?: boolean;
  isCompact?: boolean; // New prop for compact horizontal layout
}

interface WorthData {
  starforceWorth: number;
  potentialWorth: number;
  totalWorth: number;
  starforceItemCount: number;
  potentialItemCount: number;
}

export function CharacterWorthSummary({ equipment, isVisible = true, isCompact = false }: CharacterWorthSummaryProps) {
  const { formatMesos } = useFormatting();
  const [worthData, setWorthData] = useState<WorthData>({
    starforceWorth: 0,
    potentialWorth: 0,
    totalWorth: 0,
    starforceItemCount: 0,
    potentialItemCount: 0,
  });
  const [isCalculating, setIsCalculating] = useState(false);

  // Filter equipment that has worth to calculate
  const equipmentWithStarforce = useMemo(() => 
    equipment.filter(eq => eq.starforceable && (eq.currentStarForce || 0) > 0), 
    [equipment]
  );

  const equipmentWithPotential = useMemo(() => {
    console.log('All equipment data for potential filtering:', equipment.map(eq => ({ 
      name: eq.name, 
      currentPotential: eq.currentPotential,
      currentPotentialValue: eq.currentPotentialValue,
      potentialType: typeof eq.currentPotential,
      hasCurrentPotential: !!eq.currentPotential,
      hasCurrentPotentialValue: !!eq.currentPotentialValue,
      potentialKeys: eq.currentPotential ? Object.keys(eq.currentPotential) : [],
      rawEquipment: eq // Log full equipment object to see structure
    })));
    
    // Filter for equipment that has either currentPotential array OR currentPotentialValue string
    const filtered = equipment.filter(eq => 
      (eq.currentPotential && eq.currentPotential.length > 0) || 
      (eq.currentPotentialValue && eq.currentPotentialValue.trim() !== '')
    );
    console.log('Equipment with potential after filtering:', filtered.map(eq => ({ 
      name: eq.name, 
      currentPotential: eq.currentPotential,
      currentPotentialValue: eq.currentPotentialValue,
      potentialLength: eq.currentPotential?.length || 0
    })));
    return filtered;
  }, [equipment]);

  // Calculate worth when equipment changes
  useEffect(() => {
    if (!isVisible || (equipmentWithStarforce.length === 0 && equipmentWithPotential.length === 0)) {
      setWorthData({
        starforceWorth: 0,
        potentialWorth: 0,
        totalWorth: 0,
        starforceItemCount: 0,
        potentialItemCount: 0,
      });
      return;
    }

    const calculateWorth = async () => {
      setIsCalculating(true);
      
      try {
        let starforceWorth = 0;
        let potentialWorth = 0;

        // Calculate StarForce worth (0 → current stars for each item)
        if (equipmentWithStarforce.length > 0) {
          // Prepare bulk calculation items
          const bulkItems: BulkItemCalculationDto[] = equipmentWithStarforce.map(eq => ({
            itemLevel: eq.level,
            fromStar: 0, // Calculate from 0 stars
            toStar: eq.currentStarForce || 0,
            itemName: eq.name,
          }));

          try {
            const bulkResult = await calculateBulkStarforce({
              isInteractive: false,
              items: bulkItems,
            });

            // Sum up all the costs from the bulk result
            starforceWorth = bulkResult.response.results.reduce((sum, item) => 
              sum + (item.averageCost || 0), 0
            );
          } catch (error) {
            console.warn('Failed to calculate StarForce worth:', error);
            starforceWorth = 0;
          }
        }

        // Calculate Potential worth (none → current potential for each item)
        if (equipmentWithPotential.length > 0) {
          console.log('Calculating potential worth for', equipmentWithPotential.length, 'items');
          console.log('Equipment with potential details:', equipmentWithPotential.map(eq => ({
            name: eq.name,
            currentPotential: eq.currentPotential,
            currentPotentialValue: eq.currentPotentialValue,
            firstPotentialValue: eq.currentPotential?.[0]?.value,
            potentialValueToUse: eq.currentPotentialValue || eq.currentPotential?.[0]?.value
          })));
          
          // Prepare bulk calculation items - use current potential as target
          const bulkItems: PotentialBulkItem[] = equipmentWithPotential
            .filter(eq => eq.currentPotentialValue || eq.currentPotential?.[0]?.value) // Filter items with valid potential
            .map(eq => ({
              itemType: eq.type,
              itemLevel: eq.level,
              selectedOption: eq.currentPotentialValue || eq.currentPotential![0].value, // Use currentPotentialValue or fallback to array
              cubeType: null, // Use smart cube optimization - let server determine best cube type
              isDMT: false,
              itemName: eq.name
            }));

          console.log('Potential bulk items after filtering:', bulkItems);

          if (bulkItems.length > 0) {
            try {
              const response = await potentialService.calculateBulkPotentialCosts(bulkItems);
              console.log('Potential bulk response:', response);
              
              // Sum up all the costs from the bulk result
              potentialWorth = response.results.reduce((sum, result) => 
                sum + (result.result?.averageCost || 0), 0
              );
              console.log('Total potential worth:', potentialWorth);
            } catch (error) {
              console.warn('Failed to calculate Potential worth:', error);
              potentialWorth = 0;
            }
          } else {
            console.log('No items with valid potential found for calculation');
          }
        }

        setWorthData({
          starforceWorth,
          potentialWorth,
          totalWorth: starforceWorth + potentialWorth,
          starforceItemCount: equipmentWithStarforce.length,
          potentialItemCount: equipmentWithPotential.length,
        });
      } catch (error) {
        console.error('Failed to calculate character worth:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateWorth();
  }, [equipmentWithStarforce, equipmentWithPotential, isVisible]);

  // Don't render if no equipment has worth
  if (!isVisible || (equipmentWithStarforce.length === 0 && equipmentWithPotential.length === 0)) {
    return null;
  }

  return (
    <div className={isCompact ? "flex gap-3" : "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"}>
      {/* StarForce Worth */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help flex-1">
              <CardContent className="p-4">
                <div className={isCompact ? "flex flex-col items-center justify-center gap-3" : "flex flex-col items-center justify-center gap-3"}>
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400 font-maplestory">
                      {isCalculating ? '...' : formatMesos.display(worthData.starforceWorth)}
                    </div>
                    <div className="text-sm text-muted-foreground font-maplestory">StarForce Worth</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total average cost to StarForce {worthData.starforceItemCount} item{worthData.starforceItemCount !== 1 ? 's' : ''} from 0★ to current stars</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Potential Worth */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help flex-1">
              <CardContent className="p-4">
                <div className={isCompact ? "flex flex-col items-center justify-center gap-3" : "flex flex-col items-center justify-center gap-3"}>
                  <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400 font-maplestory">
                      {isCalculating ? '...' : formatMesos.display(worthData.potentialWorth)}
                    </div>
                    <div className="text-sm text-muted-foreground font-maplestory">Potential Worth</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total average cost to cube {worthData.potentialItemCount} item{worthData.potentialItemCount !== 1 ? 's' : ''} to current potential</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Total Worth */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help flex-1">
              <CardContent className="p-4">
                <div className={isCompact ? "flex flex-col items-center justify-center gap-3" : "flex flex-col items-center justify-center gap-3"}>
                  <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 font-maplestory">
                      {isCalculating ? '...' : formatMesos.display(worthData.totalWorth)}
                    </div>
                    <div className="text-sm text-muted-foreground font-maplestory">Total Worth</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Combined StarForce and Potential investment value</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
