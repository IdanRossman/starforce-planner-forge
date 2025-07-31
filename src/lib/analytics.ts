// Google Analytics 4 Event Tracking Utilities

declare global {
  interface Window {
    gtag: (command: string, action: string, parameters?: Record<string, unknown>) => void;
  }
}

// Track character creation
export const trackCharacterCreation = (characterClass: string, characterName?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'character_created', {
      event_category: 'character_management',
      character_class: characterClass,
      character_name: characterName || 'unnamed',
      value: 1
    });
  }
};

// Track equipment additions
export const trackEquipmentAdded = (equipmentSlot: string, equipmentName?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'equipment_added', {
      event_category: 'equipment_management',
      equipment_slot: equipmentSlot,
      equipment_name: equipmentName || 'unknown',
      value: 1
    });
  }
};

// Track StarForce calculator usage
export const trackStarForceCalculation = (itemCount: number, totalCost?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'starforce_calculation', {
      event_category: 'calculator_usage',
      item_count: itemCount,
      estimated_cost: totalCost || 0,
      value: itemCount
    });
  }
};

// Track StarForce goal completions
export const trackStarForceCompletion = (equipmentName: string, starLevel: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'starforce_completed', {
      event_category: 'goal_completion',
      equipment_name: equipmentName,
      star_level: starLevel,
      value: starLevel
    });
  }
};

// Track tab switches (equipment vs calculator)
export const trackTabSwitch = (fromTab: string, toTab: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'tab_switch', {
      event_category: 'navigation',
      from_tab: fromTab,
      to_tab: toTab
    });
  }
};

// Track equipment transfers
export const trackEquipmentTransfer = (sourceEquipment: string, targetEquipment: string, starLevel: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'equipment_transfer', {
      event_category: 'equipment_management',
      source_equipment: sourceEquipment,
      target_equipment: targetEquipment,
      star_level: starLevel,
      value: starLevel
    });
  }
};

// Track character deletions
export const trackCharacterDeletion = (characterClass: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'character_deleted', {
      event_category: 'character_management',
      character_class: characterClass
    });
  }
};

// Track feature usage
export const trackFeatureUsage = (feature: string, action: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'feature_usage', {
      event_category: 'user_interaction',
      feature_name: feature,
      action: action,
      value: value || 1
    });
  }
};
