import { Equipment, EquipmentSlot, EquipmentType, EquipmentTier } from '@/types';
import { EQUIPMENT_DATABASE } from '@/data/equipmentDatabase';
import { getJobDatabaseString } from '@/lib/jobIcons';
import { apiService } from './api';

// Map equipment slots to API equipment types
const SLOT_TO_TYPE_MAP: Record<EquipmentSlot, string> = {
  weapon: 'weapon',
  secondary: 'secondary',
  emblem: 'emblem',
  hat: 'hat',
  top: 'top',
  bottom: 'bottom',
  overall: 'overall',
  shoes: 'shoes',
  gloves: 'gloves',
  cape: 'cape',
  belt: 'belt',
  shoulder: 'shoulder',
  face: 'face',
  eye: 'eye',
  earring: 'earrings',
  ring1: 'ring',
  ring2: 'ring',
  ring3: 'ring',
  ring4: 'ring',
  pendant1: 'pendant',
  pendant2: 'pendant',
  pocket: 'pocket',
  heart: 'heart',
  badge: 'badge',
  medal: 'medal'
};

interface ApiEquipment {
  id: number;
  name: string;
  type: string;
  set?: string;
  job?: string;
  class?: string;
  level: number;
  base_attack?: number;
  starforceable: boolean;
  maplestory_io_id?: string;
  storage_url?: string;
}

// Cache for API data
const equipmentCache = new Map<string, { data: Equipment[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function transformApiEquipment(apiEquipment: ApiEquipment): Equipment {
  // Determine equipment type based on slot
  const getEquipmentType = (type: string): EquipmentType => {
    if (type === 'weapon' || type === 'secondary') return 'weapon';
    if (['ring', 'pendant', 'earrings', 'face', 'eye', 'heart', 'badge', 'medal', 'pocket'].includes(type)) return 'accessory';
    return 'armor';
  };

  return {
    id: apiEquipment.id.toString(),
    slot: apiEquipment.type as EquipmentSlot,
    type: getEquipmentType(apiEquipment.type),
    level: apiEquipment.level,
    set: apiEquipment.set || apiEquipment.name,
    currentStarForce: 0,
    targetStarForce: 0,
    tier: null,
    starforceable: apiEquipment.starforceable,
    image: apiEquipment.storage_url
  };
}

export async function getEquipmentBySlotAndJob(slot: EquipmentSlot, job: string): Promise<{ equipment: Equipment[]; source: 'api' | 'local' }> {
  const cacheKey = `slot-${slot}-job-${job}`;
  const cached = equipmentCache.get(cacheKey);
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { equipment: cached.data, source: 'api' };
  }

  try {
    const equipmentType = SLOT_TO_TYPE_MAP[slot];
    const dbJobString = getJobDatabaseString(job);
    
    const apiData = await apiService.get<ApiEquipment[]>(`/Equipment/type/${equipmentType}/job/${dbJobString}`);
    
    const equipment = apiData.map(transformApiEquipment);
    
    // Cache the result
    equipmentCache.set(cacheKey, {
      data: equipment,
      timestamp: Date.now()
    });
    
    return { equipment, source: 'api' };
  } catch (error) {
    console.warn(`Failed to fetch equipment from API for slot ${slot} and job ${job}, falling back to slot-only data:`, error);
    
    // Fallback to slot-only data if job-specific fails
    return getEquipmentBySlot(slot);
  }
}

export async function getEquipmentBySlot(slot: EquipmentSlot): Promise<{ equipment: Equipment[]; source: 'api' | 'local' }> {
  const cacheKey = `slot-${slot}`;
  const cached = equipmentCache.get(cacheKey);
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { equipment: cached.data, source: 'api' };
  }

  try {
    const equipmentType = SLOT_TO_TYPE_MAP[slot];
    const apiData = await apiService.get<ApiEquipment[]>(`/Equipment?type=${equipmentType}`);
    
    const equipment = apiData.map(transformApiEquipment);
    
    // Cache the result
    equipmentCache.set(cacheKey, {
      data: equipment,
      timestamp: Date.now()
    });
    
    return { equipment, source: 'api' };
  } catch (error) {
    console.warn('Failed to fetch equipment from API, falling back to local data:', error);
    
    // Fallback to local data - convert database format to Equipment format
    const localEquipmentData = EQUIPMENT_DATABASE[slot] || [];
    const localEquipment: Equipment[] = localEquipmentData.map((item, index) => ({
      id: `${slot}-${index}`,
      slot,
      type: slot === 'weapon' || slot === 'secondary' ? 'weapon' : 
            ['ring1', 'ring2', 'ring3', 'ring4', 'pendant1', 'pendant2', 'earring', 'face', 'eye', 'heart', 'badge', 'medal', 'pocket'].includes(slot) ? 'accessory' : 'armor',
      level: item.level,
      set: item.set || item.name,
      currentStarForce: 0,
      targetStarForce: 0,
      tier: item.tier,
      starforceable: slot !== 'heart' && slot !== 'badge' && slot !== 'medal', // Most equipment is starforceable except these
      image: item.image
    }));
    
    return { equipment: localEquipment, source: 'local' };
  }
}

export async function getAllEquipment(): Promise<{ equipment: Equipment[]; source: 'api' | 'local' }> {
  const cacheKey = 'all-equipment';
  const cached = equipmentCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { equipment: cached.data, source: 'api' };
  }

  try {
    const apiData = await apiService.get<ApiEquipment[]>('/Equipment');
    const equipment = apiData.map(transformApiEquipment);
    
    equipmentCache.set(cacheKey, {
      data: equipment,
      timestamp: Date.now()
    });
    
    return { equipment, source: 'api' };
  } catch (error) {
    console.warn('Failed to fetch all equipment from API, falling back to local data:', error);
    
    // Fallback to local data - convert all database entries to Equipment format
    const localEquipment: Equipment[] = [];
    Object.entries(EQUIPMENT_DATABASE).forEach(([slot, items]) => {
      items.forEach((item, index) => {
        localEquipment.push({
          id: `${slot}-${index}`,
          slot: slot as EquipmentSlot,
          type: slot === 'weapon' || slot === 'secondary' ? 'weapon' : 
                ['ring1', 'ring2', 'ring3', 'ring4', 'pendant1', 'pendant2', 'earring', 'face', 'eye', 'heart', 'badge', 'medal', 'pocket'].includes(slot) ? 'accessory' : 'armor',
          level: item.level,
          set: item.set || item.name,
          currentStarForce: 0,
          targetStarForce: 0,
          tier: item.tier,
          starforceable: slot !== 'heart' && slot !== 'badge' && slot !== 'medal',
          image: item.image
        });
      });
    });
    
    return { equipment: localEquipment, source: 'local' };
  }
}

export async function testApiConnection(): Promise<boolean> {
  try {
    return await apiService.testConnection();
  } catch {
    return false;
  }
}
