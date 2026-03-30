import { Equipment, EquipmentSlot, EquipmentType, EquipmentTier, StorageItem } from '@/types';
import { EQUIPMENT_DATABASE } from '@/data/equipmentDatabase';
import { getJobDatabaseString } from '@/lib/jobIcons';
import { apiService } from './api';

// ── Slot name maps shared with the backend ──────────────────────────────────
// Maps frontend EquipmentSlot → backend equipmentSlot string
export const SLOT_TO_BACKEND_NAME: Record<EquipmentSlot, string> = {
  hat: 'Hat', top: 'Top', bottom: 'Bottom', overall: 'Overall',
  weapon: 'Weapon', secondary: 'Secondary', emblem: 'Emblem',
  face: 'Face', eye: 'Eye', earring: 'Earrings',
  ring1: 'Ring1', ring2: 'Ring2', ring3: 'Ring3', ring4: 'Ring4',
  pendant1: 'Pendant1', pendant2: 'Pendant2',
  belt: 'Belt', gloves: 'Gloves', shoes: 'Shoes',
  cape: 'Cape', shoulder: 'Shoulder',
  heart: 'Heart', pocket: 'Pocket', badge: 'Badge', medal: 'Medal',
};

// Maps backend equipmentSlot string → frontend EquipmentSlot
export const BACKEND_NAME_TO_SLOT: Record<string, EquipmentSlot> = Object.fromEntries(
  Object.entries(SLOT_TO_BACKEND_NAME).map(([k, v]) => [v, k as EquipmentSlot])
);

// Map slot type for API equipment types
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

// Reverse mapping from API types back to internal slot names
const TYPE_TO_SLOT_MAP: Record<string, EquipmentSlot> = {
  'weapon': 'weapon',
  'secondary': 'secondary',
  'emblem': 'emblem',
  'hat': 'hat',
  'top': 'top',
  'bottom': 'bottom',
  'overall': 'overall',
  'shoes': 'shoes',
  'gloves': 'gloves',
  'cape': 'cape',
  'belt': 'belt',
  'shoulder': 'shoulder',
  'face': 'face',
  'eye': 'eye',
  'earrings': 'earring', // Map API 'earrings' back to internal 'earring'
  'ring': 'ring1', // Default to ring1, though this might need special handling
  'pendant': 'pendant1', // Default to pendant1, though this might need special handling
  'pocket': 'pocket',
  'heart': 'heart',
  'badge': 'badge',
  'medal': 'medal'
};

interface ApiEquipment {
  id: number;
  name: string;
  type: string;
  set?: string;
  job?: string;
  class?: string;
  level: number;
  baseAttack?: number;
  starforceable: boolean;
  mapleStoryIoId?: string;
  storageUrl?: string;
}

// Cache for API data
const equipmentCache = new Map<string, { data: Equipment[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function transformApiEquipment(apiEquipment: ApiEquipment, targetSlot?: EquipmentSlot): Equipment {
  // Determine equipment type based on slot
  const getEquipmentType = (type: string): EquipmentType => {
    if (type === 'weapon' || type === 'secondary') return 'weapon';
    if (['ring', 'pendant', 'earrings', 'face', 'eye', 'heart', 'badge', 'medal', 'pocket'].includes(type)) return 'accessory';
    return 'armor';
  };

  // Convert API type back to internal slot name
  const getInternalSlot = (apiType: string, targetSlot?: EquipmentSlot): EquipmentSlot => {
    // If we have a target slot (from the request context), use that for generic types
    if (targetSlot && (apiType === 'ring' || apiType === 'pendant')) {
      return targetSlot;
    }
    
    // For non-generic types, use the mapping
    return TYPE_TO_SLOT_MAP[apiType] || apiType as EquipmentSlot;
  };

  return {
    id: apiEquipment.id.toString(),
    catalogId: apiEquipment.id.toString(),
    name: apiEquipment.name,
    slot: getInternalSlot(apiEquipment.type, targetSlot),
    type: getEquipmentType(apiEquipment.type),
    level: apiEquipment.level,
    set: apiEquipment.set,
    currentStarForce: 0,
    targetStarForce: 0,
    tier: null,
    starforceable: apiEquipment.starforceable,
    image: apiEquipment.storageUrl,
    itemType: apiEquipment.type,
    base_attack: apiEquipment.baseAttack,
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
    
    const apiData = await apiService.get<ApiEquipment[]>(`/api/equipment/equipment-by-job?job=${dbJobString}&type=${equipmentType}`);
    
    const equipment = apiData.map(item => transformApiEquipment(item, slot));
    
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
    const apiData = await apiService.get<ApiEquipment[]>(`/api/equipment/equipment-by-job?type=${equipmentType}`);
    
    const equipment = apiData.map(item => transformApiEquipment(item, slot));
    
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
      image: item.image,
      itemType: SLOT_TO_TYPE_MAP[slot], // Map slot to database type for local data
      base_attack: undefined, // Local data doesn't have base attack info
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
    const apiData = await apiService.get<ApiEquipment[]>('/api/equipment/equipments');
    const equipment = apiData.map(item => transformApiEquipment(item)); // No target slot for "all equipment"
    
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
          image: item.image,
          itemType: SLOT_TO_TYPE_MAP[slot as EquipmentSlot], // Map slot to database type for local data
          base_attack: undefined, // Local data doesn't have base attack info
        });
      });
    });
    
    return { equipment: localEquipment, source: 'local' };
  }
}

/**
 * Given the raw slots returned by GET /api/character/{id}/equipment, look up
 * each catalog item and return fully-formed equipped + storage items.
 * equipmentSlot === null → storage item; non-null → equipped item.
 */
export async function buildEquipmentFromSlots(
  backendSlots: Array<{
    id: string;
    equipmentSlot: string | null;
    equipmentId: number | null;
    currentStarforce: number;
    targetStarforce: number;
    currentPotential: string;
    targetPotential: string;
  }>
): Promise<{ equipped: Equipment[]; storage: StorageItem[] }> {
  const filledSlots = backendSlots.filter(s => s.equipmentId !== null);
  if (filledSlots.length === 0) return { equipped: [], storage: [] };

  const { equipment: catalog } = await getAllEquipment();
  const catalogMap = new Map(catalog.map(eq => [eq.id, eq]));

  const equipped: Equipment[] = [];
  const storage: StorageItem[] = [];

  for (const slot of filledSlots) {
    const catalogItem = catalogMap.get(String(slot.equipmentId!));
    if (!catalogItem) continue;

    if (slot.equipmentSlot !== null) {
      // Equipped item
      const frontendSlot = BACKEND_NAME_TO_SLOT[slot.equipmentSlot];
      if (!frontendSlot) continue;
      equipped.push({
        ...catalogItem,
        id: `${frontendSlot}-${crypto.randomUUID()}`,
        slot: frontendSlot,
        currentStarForce: slot.currentStarforce,
        targetStarForce: slot.targetStarforce,
        currentPotentialValue: slot.currentPotential || undefined,
        targetPotentialValue: slot.targetPotential || undefined,
      });
    } else {
      // Storage item
      storage.push({
        id: slot.id,
        catalogId: String(slot.equipmentId!),
        name: catalogItem.name,
        set: catalogItem.set,
        image: catalogItem.image,
        level: catalogItem.level,
        starforceable: catalogItem.starforceable,
        currentStarForce: slot.currentStarforce,
        targetStarForce: slot.targetStarforce,
        currentPotential: slot.currentPotential || undefined,
        targetPotential: slot.targetPotential || undefined,
        itemType: catalogItem.itemType,
        type: catalogItem.type,
      });
    }
  }

  return { equipped, storage };
}

export async function testApiConnection(): Promise<boolean> {
  try {
    return await apiService.testConnection();
  } catch {
    return false;
  }
}
