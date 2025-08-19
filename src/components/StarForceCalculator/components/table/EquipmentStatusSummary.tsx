import React from 'react';
import { Eye } from 'lucide-react';
import { Card, CardContent } from '../../../ui/card';

interface EquipmentStatusSummaryProps {
  totalCount: number;
  includedCount: number;
}

/**
 * Equipment Status Summary Component
 * Shows how many items are included vs excluded from calculations
 */
export function EquipmentStatusSummary({
  totalCount,
  includedCount
}: EquipmentStatusSummaryProps) {
  
  if (totalCount === 0) {
    return null;
  }

  const excludedCount = totalCount - includedCount;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Eye className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <div className="font-semibold text-sm font-maplestory">
                {includedCount} of {totalCount} items included
              </div>
              <div className="text-xs text-muted-foreground font-maplestory">
                {excludedCount > 0 
                  ? `${excludedCount} items excluded from calculations`
                  : 'All items included in calculations'
                }
              </div>
            </div>
          </div>
          {excludedCount > 0 && (
            <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded">
              Some items excluded
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
