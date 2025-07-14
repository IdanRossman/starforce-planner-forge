import { StarForceCalculation } from "@/types";

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

class StarForceCalculationManager {
  private worker: Worker | null = null;
  private pendingCalculations = new Map<string, (result: StarForceCalculation) => void>();
  private calculationCache = new Map<string, StarForceCalculation>();

  constructor() {
    if (typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(new URL('../workers/starforce-worker.ts', import.meta.url), {
          type: 'module'
        });
        
        this.worker.onmessage = (e: MessageEvent<CalculationResponse>) => {
          const { id, result } = e.data;
          const resolver = this.pendingCalculations.get(id);
          if (resolver) {
            resolver(result);
            this.pendingCalculations.delete(id);
          }
        };
      } catch (error) {
        console.warn('Web Worker not available, falling back to main thread calculations');
        this.worker = null;
      }
    }
  }

  private generateCacheKey(req: Omit<CalculationRequest, 'id'>): string {
    return `${req.itemLevel}-${req.currentLevel}-${req.targetLevel}-${req.tier}-${req.serverType}-${JSON.stringify(req.events)}`;
  }

  private fallbackCalculation(
    itemLevel: number,
    currentLevel: number,
    targetLevel: number,
    tier: string,
    serverType: "Regular" | "Reboot",
    events: any = {}
  ): StarForceCalculation {
    // Simplified fallback calculation for when worker is not available
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

    let totalCost = 0;
    let totalBooms = 0;

    for (let star = currentLevel; star < targetLevel; star++) {
      const baseCost = Math.pow(star + 1, 2.7) * itemLevel * 100;
      const adjustedCost = baseCost * (events.costMultiplier || 1);
      
      let successRate = 0.95 - (star * 0.03);
      if (star >= 15) successRate = Math.max(0.3 - ((star - 15) * 0.05), 0.01);
      
      successRate += (events.successRateBonus || 0);
      successRate = Math.min(successRate, 0.95);
      
      let boomRate = 0;
      if (star >= 15) {
        boomRate = 0.02 + ((star - 15) * 0.01);
        if (events.safeguard && star < 17) boomRate = 0;
      }
      
      const expectedAttempts = 1 / successRate;
      totalCost += adjustedCost * expectedAttempts;
      totalBooms += boomRate * expectedAttempts;
    }

    return {
      currentLevel,
      targetLevel,
      averageCost: Math.round(totalCost),
      averageBooms: Math.round(totalBooms * 100) / 100,
      successRate: 0,
      boomRate: 0,
      costPerAttempt: 0,
      perStarStats: [],
      recommendations: [],
    };
  }

  async calculateStarForce(
    itemLevel: number,
    currentLevel: number,
    targetLevel: number,
    tier: string,
    serverType: "Regular" | "Reboot" = "Regular",
    events: any = {}
  ): Promise<StarForceCalculation> {
    const cacheKey = this.generateCacheKey({
      itemLevel,
      currentLevel,
      targetLevel,
      tier,
      serverType,
      events
    });

    // Check cache first
    if (this.calculationCache.has(cacheKey)) {
      return Promise.resolve(this.calculationCache.get(cacheKey)!);
    }

    // If no worker available, use fallback
    if (!this.worker) {
      const result = this.fallbackCalculation(itemLevel, currentLevel, targetLevel, tier, serverType, events);
      this.calculationCache.set(cacheKey, result);
      return Promise.resolve(result);
    }

    // Use worker for calculation
    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      this.pendingCalculations.set(id, resolve);

      const request: CalculationRequest = {
        id,
        itemLevel,
        currentLevel,
        targetLevel,
        tier,
        serverType,
        events
      };

      this.worker!.postMessage(request);
    });
  }

  // Batch calculation method for multiple equipment pieces
  async calculateBatch(calculations: Array<{
    itemLevel: number;
    currentLevel: number;
    targetLevel: number;
    tier: string;
    serverType?: "Regular" | "Reboot";
    events?: any;
  }>): Promise<StarForceCalculation[]> {
    const promises = calculations.map(calc => 
      this.calculateStarForce(
        calc.itemLevel,
        calc.currentLevel,
        calc.targetLevel,
        calc.tier,
        calc.serverType || "Regular",
        calc.events || {}
      )
    );

    return Promise.all(promises);
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingCalculations.clear();
  }
}

// Singleton instance
export const starForceCalculator = new StarForceCalculationManager();