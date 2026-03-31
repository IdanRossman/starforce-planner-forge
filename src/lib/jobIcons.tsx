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
      'Buccaneer', 'Corsair', 'Cannon Master'
    ]
  },
  [CLASS_SUBCATEGORIES.CYGNUS_KNIGHTS]: {
    name: 'Cygnus Knights',
    classes: [
      'Dawn Warrior', 'Blaze Wizard', 'Wind Archer', 'Night Walker', 'Thunder Breaker', 'Mihile'
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
      'Hoyoung', 'Lara', 'Ren'
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
    'Blaster', 'Hayato', 'Zero', 'Adele', 'Ren'
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
    'Buccaneer', 'Corsair', 'Cannon Master', 'Thunder Breaker', 'Shade', 'Mechanic', 'Angelic Buster', 'Mo Xuan','Ark'
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
  return 'Other'; // fallback for unknown classes
};

// Job placeholder images — add entries as official art becomes available
// Filename convention: /characters/{nexon-filename}.png
export const JOB_PLACEHOLDER_IMAGES: Partial<Record<string, string>> = {
  // Explorers
  'Hero':               '/characters/250723-ms-classesjobs-update-hero-395x400-v3.png',
  'Paladin':            '/characters/250723-ms-classesjobs-update-paladin-395x400-1.png',
  'Dark Knight':        '/characters/250723-darkknight-classesjobs-update-hero-395x400-v3.png',
  'Fire/Poison Mage':   '/characters/250723-archmage-fp-classesjobs-update-hero-395x400-v3.png',
  'Ice/Lightning Mage': '/characters/250723-ms-classesjobs-update-arch-mage-il-395x400.png',
  'Bishop':             '/characters/250723-bishop-classesjobs-update-hero-395x400-v3.png',
  'Bowmaster':          '/characters/250723-bowmaster-classesjobs-update-hero-395x400-v3.png',
  'Marksman':           '/characters/250723-ms-classesjobs-update-marksman-395x400.png',
  'Pathfinder':         '/characters/250723-ms-classesjobs-update-pathfinder-395x400.png',
  'Night Lord':         '/characters/250723-ms-classesjobs-update-nightlord-395x400.png',
  'Shadower':           '/characters/250723-ms-classesjobs-update-shadower-395x400.png',
  'Dual Blade':         '/characters/250723-ms-classesjobs-update-dualblade-395x400.png',
  'Buccaneer':          '/characters/250723-buccaneer-classesjobs-update-hero-395x400-v3.png',
  'Corsair':            '/characters/250723-ms-classesjobs-update-corsair-395x400.png',
  'Cannon Master':      '/characters/250723-cannoneer-classesjobs-update-hero-395x400-v3.png',
  // Cygnus Knights
  'Dawn Warrior':       '/characters/250723-ms-classesjobs-update-dawnwarrior-395x400.png',
  'Blaze Wizard':       '/characters/250723-ms-classesjobs-update-blazewizard-395x400.png',
  'Wind Archer':        '/characters/250723-ms-classesjobs-update-windarcher-395x400.png',
  'Night Walker':       '/characters/250723-ms-classesjobs-update-nightwalker-395x400.png',
  'Thunder Breaker':    '/characters/250723-ms-classesjobs-update-thunderbreaker-395x400.png',
  'Mihile':             '/characters/250723-ms-classesjobs-update-mihile-395x400.png',
  // Heroes
  'Aran':               '/characters/aran_img_v255.png',
  'Evan':               '/characters/250723-evan-classesjobs-update-hero-395x400-v3.png',
  'Mercedes':           '/characters/250723-ms-classesjobs-update-mercedes-395x400.png',
  'Phantom':            '/characters/250723-ms-classesjobs-update-phantom-395x400.png',
  'Luminous':           '/characters/250723-luminous-classesjobs-update-hero-395x400-v3.png',
  'Shade':              '/characters/shade_img_v255.png',
  // Resistance
  'Blaster':            '/characters/250723-blaster-classesjobs-update-hero-395x400-v3.png',
  'Battle Mage':        '/characters/250723-battlemage-classesjobs-update-hero-395x400-v3.png',
  'Wild Hunter':        '/characters/wild_hunter_v267_395x400.png',
  'Mechanic':           '/characters/250723-ms-classesjobs-update-mechanic-395x400.png',
  'Xenon':              '/characters/250723-xenon-classesjobs-update-hero-395x400-v3.png',
  'Demon Slayer':       '/characters/250723-ms-classesjobs-update-demonslayer-395x400.png',
  'Demon Avenger':      '/characters/250723-ms-classesjobs-update-demonavenger-395x400.png',
  // Nova
  'Kaiser':             '/characters/250723-ms-classesjobs-update-kaiser-395x400.png',
  'Angelic Buster':     '/characters/angelic-buster-img-v251.png',
  'Cadena':             '/characters/250723-ms-classesjobs-update-cadena-395x400.png',
  'Kain':               '/characters/250723-ms-classesjobs-update-kain-395x400.png',
  // Flora
  'Illium':             '/characters/250723-illium-classesjobs-update-hero-395x400-v3.png',
  'Ark':                '/characters/250723-ms-classesjobs-update-ark-395x400.png',
  'Adele':              '/characters/250723-ms-classesjobs-update-adele-395x400.png',
  'Khali':              '/characters/250723-ms-classesjobs-update-khali-395x400.png',
  // Sengoku
  'Hayato':             '/characters/v266-hayato-395x400.png',
  'Kanna':              '/characters/v266-kanna-395x400.png',
  // Jianghu
  'Lynn':               '/characters/lynn.png',
  'Mo Xuan':            '/characters/mo-xuan-img.png',
  // Anima
  'Hoyoung':            '/characters/250723-hoyoung-classesjobs-update-hero-395x400-v3.png',
  'Lara':               '/characters/250723-lara-classesjobs-update-hero-395x400-v3.png',
  'Ren':                '/characters/251105_ms_ren_characterthumbnail_fullcolor_395x400.png',
  // Shine
  'Sia':                '/characters/sia_astelle_v267_395x400.png',
  // Transcendent
  'Zero':               '/characters/250723-ms-classesjobs-update-zero-395x400.png',
  // Friends World
  'Kinesis':            '/characters/250723-ms-classesjobs-update-kinesis-395x400.png',
};

export const getJobPlaceholderImage = (className: string): string | null => {
  const path = JOB_PLACEHOLDER_IMAGES[className];
  if (!path) return null;
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
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

// Map display names to database job strings
export const getJobDatabaseString = (className: string): string => {
  const jobMapping: Record<string, string> = {
    // Explorers
    'Hero': 'hero',
    'Paladin': 'paladin',
    'Dark Knight': 'dark-knight',
    'Fire/Poison Mage': 'archmage-fire-poison',
    'Ice/Lightning Mage': 'archmage-ice-lightning',
    'Bishop': 'bishop',
    'Bowmaster': 'bowmaster',
    'Marksman': 'marksman',
    'Pathfinder': 'pathfinder',
    'Night Lord': 'night-lord',
    'Shadower': 'shadower',
    'Dual Blade': 'dual-blade',
    'Buccaneer': 'buccaneer',
    'Corsair': 'corsair',
    'Cannon Master': 'cannoneer',
    
    // Cygnus Knights
    'Dawn Warrior': 'dawn-warrior',
    'Blaze Wizard': 'blaze-wizard',
    'Wind Archer': 'wind-archer',
    'Night Walker': 'night-walker',
    'Thunder Breaker': 'thunder-breaker',
    'Mihile': 'mihile',
    
    // Heroes
    'Aran': 'aran',
    'Evan': 'evan',
    'Mercedes': 'mercedes',
    'Phantom': 'phantom',
    'Luminous': 'luminous',
    'Shade': 'shade',
    
    // Resistance
    'Blaster': 'blaster',
    'Battle Mage': 'battle-mage',
    'Wild Hunter': 'wild-hunter',
    'Mechanic': 'mechanic',
    'Xenon': 'xenon',
    'Demon Slayer': 'demon-slayer',
    'Demon Avenger': 'demon-avenger',
    
    // Nova
    'Kaiser': 'kaiser',
    'Angelic Buster': 'angelic-buster',
    'Cadena': 'cadena',
    'Kain': 'kain',
    
    // Flora
    'Illium': 'illium',
    'Ark': 'ark',
    'Adele': 'adele',
    'Khali': 'khali',
    
    // Sengoku
    'Hayato': 'hayato',
    'Kanna': 'kanna',
    
    // Jianghu
    'Lynn': 'lynn',
    // Note: 'Mo Xuan' not in DB list, mapping to generic
    'Mo Xuan': 'mo-xuan',
    
    // Anima
    'Hoyoung': 'hoyoung',
    'Lara': 'lara',
    'Ren': 'ren',
    
    // Shine
    // Note: 'Sia' not in DB list, mapping to generic
    'Sia': 'sia',
    
    // Transcendent
    'Zero': 'zero',
    
    // Friends World
    'Kinesis': 'kinesis'
  };
  
  return jobMapping[className] || className.toLowerCase().replace(/[\s/]/g, '-');
};