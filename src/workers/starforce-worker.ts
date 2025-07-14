// Web Worker for StarForce calculations
import { StarForceCalculation } from "@/types";

// Types for worker communication
interface CalculationRequest {
  id: string;
  itemLevel: number;
  currentLevel: number;
  targetLevel: number;
  tier: string;
  serverType: "Regular" | "Reboot";
  events: {
    costMultiplier?: number;
    successRateBonus?: number;
    starCatching?: boolean;
    safeguard?: boolean;
  };
}

interface CalculationResponse {
  id: string;
  result: StarForceCalculation;
}

// Cache for calculation results
const calculationCache = new Map<string, StarForceCalculation>();

function generateCacheKey(req: CalculationRequest): string {
  return `${req.itemLevel}-${req.currentLevel}-${req.targetLevel}-${req.tier}-${req.serverType}-${JSON.stringify(req.events)}`;
}

// Import the calculation function (we'll need to make it available)
function calculateStarForceOptimized(
  itemLevel: number,
  currentLevel: number,
  targetLevel: number,
  tier: string,
  serverType: "Regular" | "Reboot",
  events: any = {}
): StarForceCalculation {
  // Simplified calculation with fewer trials for better performance
  const trials = 100; // Reduced from 500 for better performance
  
  // Basic validation
  if (currentLevel >= targetLevel || itemLevel < 1 || targetLevel > 23 || currentLevel < 0) {
    return {
      currentLevel,
      targetLevel,
      averageCost: 0,
      averageBooms: 0,
      successRate: 100,
      boomRate: 0,
      costPerAttempt: 0,
      perStarStats: [],
      recommendations: [],
    };
  }

  // Simplified cost calculation without full simulation
  let totalCost = 0;
  let totalAttempts = 0;
  let totalBooms = 0;

  // Basic cost calculation per star level
  for (let star = currentLevel; star < targetLevel; star++) {
    const baseCost = Math.pow(star + 1, 2.7) * itemLevel * 100;
    const adjustedCost = baseCost * (events.costMultiplier || 1);
    
    // Simplified success rate (approximation)
    let successRate = 0.95 - (star * 0.03); // Decreases as stars increase
    if (star >= 15) successRate = Math.max(0.3 - ((star - 15) * 0.05), 0.01);
    
    successRate += (events.successRateBonus || 0);
    successRate = Math.min(successRate, 0.95);
    
    // Boom rate for 15+ stars
    let boomRate = 0;
    if (star >= 15) {
      boomRate = 0.02 + ((star - 15) * 0.01);
      if (events.safeguard && star < 17) boomRate = 0;
    }
    
    const expectedAttempts = 1 / successRate;
    totalCost += adjustedCost * expectedAttempts;
    totalAttempts += expectedAttempts;
    totalBooms += boomRate * expectedAttempts;
  }

  return {
    currentLevel,
    targetLevel,
    averageCost: Math.round(totalCost),
    averageBooms: Math.round(totalBooms * 100) / 100,
    successRate: 0,
    boomRate: 0,
    costPerAttempt: Math.round(totalCost / totalAttempts),
    perStarStats: [],
    recommendations: [],
  };
}

// Worker message handler
self.onmessage = function(e: MessageEvent<CalculationRequest>) {
  const request = e.data;
  const cacheKey = generateCacheKey(request);
  
  // Check cache first
  if (calculationCache.has(cacheKey)) {
    const response: CalculationResponse = {
      id: request.id,
      result: calculationCache.get(cacheKey)!
    };
    self.postMessage(response);
    return;
  }
  
  // Perform calculation
  const result = calculateStarForceOptimized(
    request.itemLevel,
    request.currentLevel,
    request.targetLevel,
    request.tier,
    request.serverType,
    request.events
  );
  
  // Cache the result
  calculationCache.set(cacheKey, result);
  
  // Send response
  const response: CalculationResponse = {
    id: request.id,
    result
  };
  
  self.postMessage(response);
};