import { Sword, Wand2, Target, Ship, Zap } from "lucide-react";

// Job category mapping
export const JOB_CATEGORIES = {
  WARRIOR: 'warrior',
  MAGE: 'mage', 
  ARCHER: 'archer',
  THIEF: 'thief',
  PIRATE: 'pirate'
} as const;

// Class subcategories
export const CLASS_SUBCATEGORIES = {
  EXPLORERS: 'Explorers',
  CYGNUS_KNIGHTS: 'Cygnus Knights',
  HEROES: 'Heroes',
  RESISTANCE: 'Resistance',
  NOVA: 'Nova',
  FLORA: 'Flora',
  SENGOKU: 'Sengoku',
  JIANGHU: 'Jianghu',
  ANIMA: 'Anima',
  SHINE: 'Shine',
  TRANSCENDENT: 'Transcendent',
  FRIENDS_WORLD: 'Friends World'
} as const;

// Organized class data with subcategories
export const ORGANIZED_CLASSES = {
  [CLASS_SUBCATEGORIES.EXPLORERS]: {
    name: 'Explorers',
    classes: [
      'Hero', 'Paladin', 'Dark Knight',
      'Fire/Poison Mage', 'Ice/Lightning Mage', 'Bishop',
      'Bowmaster', 'Marksman', 'Pathfinder',
      'Night Lord', 'Shadower', 'Dual Blade',
      'Buccaneer', 'Corsair', 'Cannoneer'
    ]
  },
  [CLASS_SUBCATEGORIES.CYGNUS_KNIGHTS]: {
    name: 'Cygnus Knights',
    classes: [
      'Dawn Warrior', 'Blaze Wizard', 'Wind Archer', 'Night Walker', 'Thunder Breaker'
    ]
  },
  [CLASS_SUBCATEGORIES.HEROES]: {
    name: 'Heroes',
    classes: [
      'Aran', 'Evan', 'Mercedes', 'Phantom', 'Luminous', 'Shade'
    ]
  },
  [CLASS_SUBCATEGORIES.RESISTANCE]: {
    name: 'Resistance',
    classes: [
      'Blaster', 'Battle Mage', 'Wild Hunter', 'Mechanic', 'Xenon', 'Demon Slayer', 'Demon Avenger'
    ]
  },
  [CLASS_SUBCATEGORIES.NOVA]: {
    name: 'Nova',
    classes: [
      'Kaiser', 'Angelic Buster', 'Cadena', 'Kain'
    ]
  },
  [CLASS_SUBCATEGORIES.FLORA]: {
    name: 'Flora',
    classes: [
      'Illium', 'Ark', 'Adele', 'Khali'
    ]
  },
  [CLASS_SUBCATEGORIES.SENGOKU]: {
    name: 'Sengoku',
    classes: [
      'Hayato', 'Kanna'
    ]
  },
  [CLASS_SUBCATEGORIES.JIANGHU]: {
    name: 'Jianghu',
    classes: [
      'Lynn', 'Mo Xuan'
    ]
  },
  [CLASS_SUBCATEGORIES.ANIMA]: {
    name: 'Anima',
    classes: [
      'Hoyoung', 'Lara'
    ]
  },
  [CLASS_SUBCATEGORIES.SHINE]: {
    name: 'Shine',
    classes: [
      'Sia'
    ]
  },
  [CLASS_SUBCATEGORIES.TRANSCENDENT]: {
    name: 'Transcendent',
    classes: [
      'Zero'
    ]
  },
  [CLASS_SUBCATEGORIES.FRIENDS_WORLD]: {
    name: 'Friends World',
    classes: [
      'Kinesis'
    ]
  }
};

// Map character classes to job categories
export const getJobCategory = (className: string): string => {
  const warriors = [
    'Hero', 'Paladin', 'Dark Knight', 'Dawn Warrior', 'Aran', 'Kaiser', 'Demon Slayer', 'Demon Avenger',
    'Blaster', 'Hayato', 'Zero', 'Adele', 'Ark'
  ];
  
  const mages = [
    'Fire/Poison Mage', 'Ice/Lightning Mage', 'Bishop', 'Blaze Wizard', 'Evan', 'Luminous', 
    'Battle Mage', 'Kanna', 'Kinesis', 'Illium', 'Lara', 'Lynn', 'Sia'
  ];
  
  const archers = [
    'Bowmaster', 'Marksman', 'Pathfinder', 'Wind Archer', 'Mercedes', 'Wild Hunter', 'Kain'
  ];
  
  const thieves = [
    'Night Lord', 'Shadower', 'Dual Blade', 'Night Walker', 'Phantom', 'Xenon', 'Cadena', 'Khali', 'Hoyoung'
  ];
  
  const pirates = [
    'Buccaneer', 'Corsair', 'Cannoneer', 'Thunder Breaker', 'Shade', 'Mechanic', 'Angelic Buster', 'Mo Xuan'
  ];
  
  if (warriors.includes(className)) return JOB_CATEGORIES.WARRIOR;
  if (mages.includes(className)) return JOB_CATEGORIES.MAGE;
  if (archers.includes(className)) return JOB_CATEGORIES.ARCHER;
  if (thieves.includes(className)) return JOB_CATEGORIES.THIEF;
  if (pirates.includes(className)) return JOB_CATEGORIES.PIRATE;
  
  return JOB_CATEGORIES.WARRIOR; // default fallback
};

// Get class subcategory
export const getClassSubcategory = (className: string): string => {
  for (const [key, category] of Object.entries(ORGANIZED_CLASSES)) {
    if (category.classes.includes(className)) {
      return category.name;
    }
  }
  return CLASS_SUBCATEGORIES.OTHER;
};

// Get job icon component
export const getJobIcon = (className: string) => {
  const category = getJobCategory(className);
  
  switch (category) {
    case JOB_CATEGORIES.WARRIOR:
      return Sword;
    case JOB_CATEGORIES.MAGE:
      return Wand2;
    case JOB_CATEGORIES.ARCHER:
      return Target;
    case JOB_CATEGORIES.THIEF:
      return Zap;
    case JOB_CATEGORIES.PIRATE:
      return Ship;
    default:
      return Sword;
  }
};

// Get job colors for styling
export const getJobColors = (className: string) => {
  const category = getJobCategory(className);
  
  switch (category) {
    case JOB_CATEGORIES.WARRIOR:
      return {
        bg: 'from-red-500 to-red-600',
        text: 'text-red-600',
        bgMuted: 'bg-red-500/20',
        border: 'border-red-500/30'
      };
    case JOB_CATEGORIES.MAGE:
      return {
        bg: 'from-blue-500 to-blue-600',
        text: 'text-blue-600',
        bgMuted: 'bg-blue-500/20',
        border: 'border-blue-500/30'
      };
    case JOB_CATEGORIES.ARCHER:
      return {
        bg: 'from-green-500 to-green-600',
        text: 'text-green-600',
        bgMuted: 'bg-green-500/20',
        border: 'border-green-500/30'
      };
    case JOB_CATEGORIES.THIEF:
      return {
        bg: 'from-purple-500 to-purple-600',
        text: 'text-purple-600',
        bgMuted: 'bg-purple-500/20',
        border: 'border-purple-500/30'
      };
    case JOB_CATEGORIES.PIRATE:
      return {
        bg: 'from-orange-500 to-orange-600',
        text: 'text-orange-600',
        bgMuted: 'bg-orange-500/20',
        border: 'border-orange-500/30'
      };
    default:
      return {
        bg: 'from-primary to-maple-orange',
        text: 'text-primary',
        bgMuted: 'bg-primary/20',
        border: 'border-primary/30'
      };
  }
};

// Get job category display name
export const getJobCategoryName = (className: string) => {
  const category = getJobCategory(className);
  
  switch (category) {
    case JOB_CATEGORIES.WARRIOR:
      return 'Warrior';
    case JOB_CATEGORIES.MAGE:
      return 'Mage';
    case JOB_CATEGORIES.ARCHER:
      return 'Archer';
    case JOB_CATEGORIES.THIEF:
      return 'Thief';
    case JOB_CATEGORIES.PIRATE:
      return 'Pirate';
    default:
      return 'Warrior';
  }
};