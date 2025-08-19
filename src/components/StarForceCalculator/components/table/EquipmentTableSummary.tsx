import React from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign, Star } from 'lucide-react';
import { Card, CardContent } from '../../../ui/card';
import { EquipmentTableSummaryProps } from '../../types/table';
import { useFormatting } from '../../../../hooks/display/useFormatting';

/**
 * Statistics Overview Component
 * Displays aggregate statistics for StarForce calculations
 */
export function EquipmentTableSummary({
  aggregateStats,
  equipmentCount,
  isCalculating
}: EquipmentTableSummaryProps) {
  
  const { formatMesos, getLuckColor, getLuckText } = useFormatting();

  if (isCalculating || aggregateStats.totalCount === 0) {
    return null;
  }

  const gridCols = aggregateStats.hasActualCosts ? 'grid-cols-5' : 'grid-cols-4';

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {/* Average Cost */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 font-maplestory">
                {formatMesos.display(aggregateStats.totalExpectedCost)}
              </div>
              <div className="text-sm text-muted-foreground font-maplestory">Average Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Median Cost */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 font-maplestory">
                {formatMesos.display(aggregateStats.totalExpectedCost * 0.85)}
              </div>
              <div className="text-sm text-muted-foreground font-maplestory">Median Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 75th Percentile Cost */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400 font-maplestory">
                {formatMesos.display(aggregateStats.totalP75Cost)}
              </div>
              <div className="text-sm text-muted-foreground font-maplestory">75th % Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actual Cost */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 font-maplestory">
                {formatMesos.display(aggregateStats.totalActualCost)}
              </div>
              <div className="text-sm text-muted-foreground font-maplestory">Actual Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Luck Analysis */}
      {aggregateStats.hasActualCosts && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                aggregateStats.overallLuck ? 'bg-purple-500/10' : 
                aggregateStats.overallLuckPercentage > 0 ? 'bg-red-500/10' : 'bg-green-500/10'
              }`}>
                {aggregateStats.overallLuck ? 
                  <Star className="w-5 h-5 text-purple-500" /> :
                  aggregateStats.overallLuckPercentage > 0 ? 
                    <TrendingDown className="w-5 h-5 text-red-500" /> :
                    <TrendingUp className="w-5 h-5 text-green-500" />
                }
              </div>
              <div className="text-center">
                {aggregateStats.overallLuck ? (
                  <div 
                    className={`text-2xl font-bold ${aggregateStats.overallLuck.color} flex flex-col cursor-help font-maplestory`}
                    title={aggregateStats.overallLuck.shareMessage}
                  >
                    <span>{aggregateStats.overallLuck.percentile.toFixed(1)}%</span>
                    <span className="text-sm opacity-75">{aggregateStats.overallLuck.rating}</span>
                  </div>
                ) : (
                  <div className={`text-2xl font-bold ${getLuckColor.text(aggregateStats.overallLuckPercentage)} flex flex-col font-maplestory`}>
                    <span>{aggregateStats.overallLuckPercentage.toFixed(1)}%</span>
                    {getLuckText(aggregateStats.overallLuckPercentage) && (
                      <span className="text-sm opacity-75">
                        {getLuckText(aggregateStats.overallLuckPercentage)}
                      </span>
                    )}
                  </div>
                )}
                <div className="text-sm text-muted-foreground font-maplestory">
                  {aggregateStats.overallLuck ? 'Enhanced Luck' : 'Overall Luck'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
