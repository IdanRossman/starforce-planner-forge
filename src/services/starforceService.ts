import { apiService } from './api';

export type MvpDiscount = 'None' | 'Mvp3Percent' | 'Mvp5Percent' | 'Mvp10Percent';

// Request DTOs (matching your backend)
export interface BulkItemCalculationDto {
  itemLevel: number;
  fromStar: number;
  toStar: number;
  starCatching?: boolean;
  safeguard?: boolean;
  itemName?: string;
  spareCount?: number;
  spareCost?: number;
  actualCost?: number;
}

export interface BulkEnhancedStarforceRequestDto {
  items: BulkItemCalculationDto[];
  trials?: number;
  events?: {
    thirtyPercentMesoReduction?: boolean;
    thirtyPercentBoomReduction?: boolean;
    mvpDiscount?: MvpDiscount;
  };
}

// Response DTOs (matching your backend)
export interface LuckAnalysisDto {
  actualCost: number;
  percentile: number;
  luckRating: 'Very Lucky' | 'Lucky' | 'Average' | 'Unlucky' | 'Very Unlucky';
  description: string;
  betterThanPercent: number;
  worseThanPercent: number;
  shareMessage: string;
}

export interface EnhancedStarforceCostResponseDto {
  itemName?: string | null;
  fromStar: number;
  toStar: number;
  averageCost: number;
  medianCost: number;
  percentile75Cost: number;
  minCost?: number;
  maxCost?: number;
  standardDeviation?: number;
  trials?: number;
  averageBooms?: number;
  medianBooms?: number;
  percentile75Booms?: number;
}

export interface BulkEnhancedStarforceResponseDto {
  results: EnhancedStarforceCostResponseDto[];
  summary: {
    totalAverageCost: number;
    totalMedianCost: number;
    totalConservativeCost: number;
    totalAverageBooms: number;
    bestCase: number;
    worstCase: number;
  };
}

// Cache management
const starforceCache = new Map<string, { data: BulkEnhancedStarforceResponseDto; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds for starforce calculations

export async function calculateBulkStarforce(
  request: BulkEnhancedStarforceRequestDto
): Promise<{ response: BulkEnhancedStarforceResponseDto; source: 'api' | 'local' }> {
  const cacheKey = JSON.stringify(request);
  const cached = starforceCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { response: cached.data, source: 'api' };
  }

  try {
    const response = await apiService.post<BulkEnhancedStarforceResponseDto>(
      '/api/starforce/calculate/batch',
      request
    );
    
    starforceCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });
    
    return { response, source: 'api' };
  } catch (error) {
    console.warn('Failed to calculate starforce via API, falling back to local calculation:', error);
    
    // For now, throw the error - fallback implementation would go here
    throw error;
  }
}

export function clearStarforceCache(): void {
  starforceCache.clear();
}

// Helper function to convert M/B format to raw mesos
export function convertToMesos(costData?: { value: number; unit: 'M' | 'B' }): number {
  if (!costData || costData.value === 0) return 0;
  return costData.unit === 'B' ? costData.value * 1000000000 : costData.value * 1000000;
}

// Helper function to convert raw mesos to M/B format
export function convertFromMesos(mesos: number): { value: number; unit: 'M' | 'B' } {
  if (mesos >= 1000000000) {
    return { value: Math.round((mesos / 1000000000) * 10) / 10, unit: 'B' };
  } else if (mesos >= 1000000) {
    return { value: Math.round((mesos / 1000000) * 10) / 10, unit: 'M' };
  } else {
    return { value: 0, unit: 'M' };
  }
}
