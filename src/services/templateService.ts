import { Equipment, EquipmentSlot, EquipmentType } from '@/types';
import { Template, TemplateEquipmentResponse, apiService } from './api';

// Cache for template data
const templateCache = new Map<string, { data: Template[] | Equipment[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function transformTemplateEquipment(apiEquipment: TemplateEquipmentResponse): Equipment {
  // Determine equipment type based on slot
  const getEquipmentType = (type: string): EquipmentType => {
    if (type === 'weapon' || type === 'secondary') return 'weapon';
    if (['ring', 'pendant', 'earrings', 'face', 'eye', 'heart', 'badge', 'medal', 'pocket'].includes(type)) return 'accessory';
    return 'armor';
  };

  // Map API slot names to your EquipmentSlot enum
  const mapSlotName = (slotName: string): EquipmentSlot => {
    const slotMapping: Record<string, EquipmentSlot> = {
      'earrings': 'earring',
      // Add other mappings if needed
    };
    return (slotMapping[slotName] || slotName) as EquipmentSlot;
  };

  return {
    id: apiEquipment.id.toString(),
    name: apiEquipment.name, // Add the equipment name
    slot: mapSlotName(apiEquipment.slot_name),
    type: getEquipmentType(apiEquipment.type),
    level: apiEquipment.level,
    set: apiEquipment.set,
    currentStarForce: apiEquipment.current_starforce,
    targetStarForce: apiEquipment.target_starforce,
    tier: null,
    starforceable: apiEquipment.starforceable,
    image: apiEquipment.storage_url
  };
}

export async function getAllTemplates(): Promise<Template[]> {
  const cacheKey = 'all-templates';
  const cached = templateCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as Template[];
  }

  try {
    console.log('Fetching all templates from API...');
    const templates = await apiService.getTemplates();
    
    templateCache.set(cacheKey, {
      data: templates,
      timestamp: Date.now()
    });
    
    console.log(`Successfully loaded ${templates.length} templates`);
    return templates;
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    throw error;
  }
}

export async function getTemplateEquipmentForJob(templateId: number, job: string): Promise<Equipment[]> {
  const cacheKey = `template-${templateId}-job-${job}`;
  const cached = templateCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as Equipment[];
  }

  try {
    console.log(`Fetching template ${templateId} equipment for job: ${job}`);
    const templateEquipment = await apiService.getTemplateEquipment(templateId, job);
    const equipment = templateEquipment.map(transformTemplateEquipment);
    
    console.log(`Successfully loaded ${equipment.length} equipment items from template`);
    
    templateCache.set(cacheKey, {
      data: equipment,
      timestamp: Date.now()
    });
    
    return equipment;
  } catch (error) {
    console.error(`Failed to fetch template ${templateId} equipment for job ${job}:`, error);
    throw error;
  }
}

export function clearTemplateCache(): void {
  templateCache.clear();
}
