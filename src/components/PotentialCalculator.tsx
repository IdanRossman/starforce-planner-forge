import React, { useState, useEffect, useCallback } from 'react';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { potentialService } from '@/services/potentialService';
import { PotentialCalculatorTable } from './PotentialCalculator/PotentialCalculatorTable';
import { PotentialCalculatorSettings, PotentialSettings } from './PotentialCalculator/PotentialCalculatorSettings';
import { PotentialBulkItemResult } from '@/services/potentialService';
import { Equipment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calculator, TrendingUp, Target, Package } from 'lucide-react';
import { useFormatting } from '@/hooks/display/useFormatting';

export function PotentialCalculator() {
  const { selectedCharacter, updateCharacterEquipment } = useCharacterContext();
  const { formatMesos } = useFormatting();
  const [calculationResults, setCalculationResults] = useState<Map<string, PotentialBulkItemResult>>(new Map());
  const [summary, setSummary] = useState<{
    totalAverageCost: number;
    totalMedianCost: number;
    totalAverageCubes: number;
    itemCount: number;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemIncluded, setItemIncluded] = useState<Record<string, boolean>>({});
  const [resetUserModifications, setResetUserModifications] = useState(0); // Counter to trigger resets
  
  // Potential calculator settings
  const [potentialSettings, setPotentialSettings] = useState<PotentialSettings>({
    smartCubeOptimization: true // Default to enabled
  });

  // Helper functions for inclusion management
  const isItemIncluded = useCallback((id: string): boolean => {
    return itemIncluded[id] !== false; // Default to included
  }, [itemIncluded]);

  const toggleItemIncluded = useCallback((id: string): void => {
    setItemIncluded(prev => ({
      ...prev,
      [id]: prev[id] !== false ? false : true
    }));
  }, []);

  // Handle potential settings changes
  const handleUpdatePotentialSettings = useCallback((newSettings: PotentialSettings) => {
    const wasSmartOptimizationEnabled = potentialSettings.smartCubeOptimization;
    const isSmartOptimizationToggled = wasSmartOptimizationEnabled !== newSettings.smartCubeOptimization;
    
    setPotentialSettings(newSettings);
    
    // If smart optimization was toggled, reset all equipment cube types to null for re-evaluation
    if (isSmartOptimizationToggled && selectedCharacter?.id && selectedCharacter.equipment) {
      const updatedEquipment = selectedCharacter.equipment.map(eq => ({
        ...eq,
        cubeType: undefined // Reset to undefined so API can provide fresh recommendations
      }));
      updateCharacterEquipment(selectedCharacter.id, updatedEquipment);
      
      // Also reset user modification tracking
      setResetUserModifications(prev => prev + 1);
    }
  }, [potentialSettings.smartCubeOptimization, selectedCharacter, updateCharacterEquipment]);

  // Calculate bulk potential costs when character changes
  useEffect(() => {
    if (!selectedCharacter?.equipment || selectedCharacter.equipment.length === 0) {
      setCalculationResults(new Map());
      setSummary(null);
      return;
    }

    const calculateBulkCosts = async () => {
      setIsCalculating(true);
      setError(null);

      try {
        // Filter equipment that has potential goals set, is included in calculations,
        // and actually needs potential upgrading (current != target)
        const equipmentWithPotential = selectedCharacter.equipment.filter(eq => {
          const hasTargetPotential = eq.targetPotentialValue && eq.targetPotentialValue.trim() !== '';
          const needsUpgrade = eq.currentPotentialValue !== eq.targetPotentialValue;
          const isIncluded = isItemIncluded(eq.id || eq.name);
          
          return hasTargetPotential && needsUpgrade && isIncluded;
        });

        if (equipmentWithPotential.length === 0) {
          setCalculationResults(new Map());
          setSummary(null);
          setIsCalculating(false);
          return;
        }

        // Prepare bulk items for API call
        const bulkItems = equipmentWithPotential.map(equipment => ({
          itemType: equipment.type || 'weapon',
          itemLevel: equipment.level || 200,
          selectedOption: equipment.targetPotentialValue || 'legendary',
          // If user has manually set a cube type, use their choice. Otherwise use smart optimization (null)
          cubeType: equipment.cubeType || (potentialSettings.smartCubeOptimization ? null : 'black'),
          isDMT: false, // Always false now
          itemName: equipment.name
        }));

        console.log('[Bulk Calculation] API payload:', bulkItems.map(item => ({
          name: item.itemName,
          cubeType: item.cubeType
        })));

        // Call the actual bulk API
        const response = await potentialService.calculateBulkPotentialCosts(bulkItems);
        
        // Convert response to Map format expected by table
        const newResults = new Map<string, PotentialBulkItemResult>();
        response.results.forEach(result => {
          if (result.itemName) {
            newResults.set(result.itemName, result);
          }
        });

        setCalculationResults(newResults);
        setSummary(response.summary);
      } catch (err) {
        console.error('Error calculating bulk potential costs:', err);
        setError('Failed to calculate potential costs. Please try again.');
        
        // Fallback to mock data for display
        const newResults = new Map<string, PotentialBulkItemResult>();
        selectedCharacter.equipment.forEach(equipment => {
          const hasTargetPotential = equipment.targetPotentialValue && equipment.targetPotentialValue.trim() !== '';
          const needsUpgrade = equipment.currentPotentialValue !== equipment.targetPotentialValue;
          
          if (hasTargetPotential && needsUpgrade) {
            newResults.set(equipment.name, {
              itemType: equipment.type || 'weapon',
              itemLevel: equipment.level || 200,
              selectedOption: equipment.targetPotentialValue || 'legendary',
              cubeType: (equipment.cubeType as 'red' | 'black') || 'black',
              isDMT: false,
              itemName: equipment.name,
              result: {
                probability: 0.95,
                averageCubes: 150,
                medianCubes: 120,
                percentile75Cubes: 200,
                averageCost: 1500000000,
                medianCost: 1200000000,
                percentile75Cost: 2000000000,
                inputParameters: {
                  selectedOption: equipment.targetPotentialValue || 'legendary',
                  itemType: equipment.type || 'weapon',
                  cubeType: (equipment.cubeType as string) || 'black',
                  itemLevel: equipment.level || 200,
                  isDMT: false
                }
              },
              error: null
            });
          }
        });
        setCalculationResults(newResults);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateBulkCosts();
  }, [selectedCharacter?.equipment, itemIncluded, isItemIncluded, potentialSettings.smartCubeOptimization]);

  // Handle cube type updates for individual equipment
  const handleUpdateCubeType = async (equipmentName: string, newCubeType: 'red' | 'black') => {
    console.log(`[handleUpdateCubeType] Starting for ${equipmentName} with newCubeType: ${newCubeType}`);
    
    if (!selectedCharacter?.equipment) return;

    try {
      setIsCalculating(true);
      
      // Find the equipment to recalculate
      const equipment = selectedCharacter.equipment.find(eq => eq.name === equipmentName);
      if (!equipment) return;

      console.log(`[handleUpdateCubeType] Equipment before update:`, {
        name: equipment.name,
        currentCubeType: equipment.cubeType,
        newCubeType
      });

      // When smart optimization is enabled and user manually selects a cube type,
      // we should send their specific choice (not null) to get accurate costs for their decision
      const bulkItems = [{
        itemType: equipment.type || 'weapon',
        itemLevel: equipment.level || 200,
        selectedOption: equipment.targetPotentialValue || 'legendary',
        cubeType: newCubeType, // Always use the user's specific choice
        isDMT: false,
        itemName: equipment.name
      }];

      console.log(`[handleUpdateCubeType] API call payload:`, bulkItems[0]);

      // Call the API with the user's specific cube type choice
      const response = await potentialService.calculateBulkPotentialCosts(bulkItems);
      
      if (response.results.length > 0) {
        const newResult = response.results[0];
        
        console.log(`[handleUpdateCubeType] API response:`, {
          cubeType: newResult.cubeType,
          averageCost: newResult.result?.averageCost,
          itemName: newResult.itemName
        });
        
        // Update the calculation results with user's choice
        setCalculationResults(prev => {
          const newResults = new Map(prev);
          // Ensure the result reflects the user's manual choice
          const updatedResult = {
            ...newResult,
            cubeType: newCubeType, // Explicitly set to user's choice
            isUserChoice: true // Mark this as a user choice, not a recommendation
          };
          console.log(`[handleUpdateCubeType] Updated result:`, updatedResult);
          newResults.set(equipmentName, updatedResult);
          
          // Recalculate summary with updated results
          const allResults = Array.from(newResults.values()).filter(result => 
            isItemIncluded(result.itemName || '')
          );
          
          if (allResults.length > 0) {
            const newSummary = {
              totalAverageCost: allResults.reduce((sum, result) => sum + (result.result?.averageCost || 0), 0),
              totalMedianCost: allResults.reduce((sum, result) => sum + (result.result?.medianCost || 0), 0),
              totalAverageCubes: allResults.reduce((sum, result) => sum + (result.result?.averageCubes || 0), 0),
              itemCount: allResults.length
            };
            setSummary(newSummary);
          }
          
          return newResults;
        });
        
        // Also update the equipment's cube type preference in character data
        if (selectedCharacter.id) {
          const updatedEquipment = selectedCharacter.equipment.map(eq => {
            if (eq.name === equipmentName) {
              return { ...eq, cubeType: newCubeType };
            }
            return eq;
          });
          console.log(`[handleUpdateCubeType] Updating character equipment:`, {
            equipmentName,
            newCubeType,
            updatedEquipment: updatedEquipment.find(eq => eq.name === equipmentName)
          });
          updateCharacterEquipment(selectedCharacter.id, updatedEquipment);
        }
      }
    } catch (err) {
      console.error('Error updating cube type:', err);
      setError('Failed to update cube type. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle potential value updates (completion/removal)
  const handleUpdatePotential = useCallback((equipmentId: string, currentPotential: string, targetPotential: string) => {
    if (!selectedCharacter?.equipment || !selectedCharacter.id) return;

    // Find and update the equipment
    const updatedEquipment = selectedCharacter.equipment.map(eq => {
      if ((eq.id || eq.name) === equipmentId) {
        return {
          ...eq,
          currentPotentialValue: currentPotential || undefined,
          targetPotentialValue: targetPotential || undefined
        };
      }
      return eq;
    });

    // Update the character equipment through context
    updateCharacterEquipment(selectedCharacter.id, updatedEquipment);
  }, [selectedCharacter, updateCharacterEquipment]);

  if (!selectedCharacter) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Please select a character to view potential calculations.
        </p>
      </div>
    );
  }

  if (!selectedCharacter.equipment || selectedCharacter.equipment.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No equipment found for the selected character.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <PotentialCalculatorSettings
        potentialSettings={potentialSettings}
        onUpdatePotentialSettings={handleUpdatePotentialSettings}
        isCalculating={isCalculating}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Potential Calculator</h2>
          <p className="text-muted-foreground">
            Calculate potential costs for {selectedCharacter.name}'s equipment
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Average Cost */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-primary" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400 font-maplestory">
                    {formatMesos.display(summary.totalAverageCost)}
                  </div>
                  <div className="text-sm text-muted-foreground font-maplestory">Average Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Median Cost */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 font-maplestory">
                    {formatMesos.display(summary.totalMedianCost)}
                  </div>
                  <div className="text-sm text-muted-foreground font-maplestory">Median Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Cubes */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 font-maplestory">
                    {Math.round(summary.totalAverageCubes).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground font-maplestory">Average Cubes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Count */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 font-maplestory">
                    {summary.itemCount}
                  </div>
                  <div className="text-sm text-muted-foreground font-maplestory">Equipment Count</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <PotentialCalculatorTable
        equipment={selectedCharacter.equipment}
        calculationResults={calculationResults}
        isCalculating={isCalculating}
        onUpdateCubeType={handleUpdateCubeType}
        onUpdatePotential={handleUpdatePotential}
        isItemIncluded={isItemIncluded}
        toggleItemIncluded={toggleItemIncluded}
        smartOptimizationEnabled={potentialSettings.smartCubeOptimization}
        resetUserModifications={resetUserModifications}
      />
    </div>
  );
}
