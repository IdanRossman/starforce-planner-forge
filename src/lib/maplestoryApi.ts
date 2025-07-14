// MapleStory.io API utilities
const MAPLESTORY_API_BASE = 'https://maplestory.io/api';

export interface CharacterSprite {
  url: string;
  width: number;
  height: number;
}

// Available regions
export const REGIONS = {
  GMS: 'gms',
  KMS: 'kms',
  JMS: 'jms',
  TMS: 'tms',
  MSEA: 'msea'
} as const;

// Available versions (typically use 'latest')
export const VERSIONS = {
  LATEST: 'latest',
  V83: '83'
} as const;

// Character skin IDs (basic skin tones)
export const SKIN_IDS = {
  LIGHT: '2000',
  TAN: '2001', 
  DARK: '2002',
  PALE: '2003',
  BLUE: '2004',
  GREEN: '2005',
  WHITE: '2010'
} as const;

// Basic character animations
export const ANIMATIONS = {
  STAND1: 'stand1',
  WALK1: 'walk1',
  ALERT: 'alert'
} as const;

/**
 * Generate a basic character sprite URL
 * This creates a default character appearance since we can't lookup by name
 */
export function generateCharacterSpriteUrl(
  region: string = REGIONS.GMS,
  version: string = VERSIONS.LATEST,
  skinId: string = SKIN_IDS.LIGHT,
  items: string = '1040002,1060002,1072001', // Basic starter clothes
  animation: string = ANIMATIONS.STAND1,
  frame: number = 0
): string {
  return `${MAPLESTORY_API_BASE}/${region}/${version}/Character/center/${skinId}/${items}/${animation}/${frame}`;
}

/**
 * Get class-specific default equipment items
 * This gives each class a more appropriate starting look
 */
export function getClassDefaultItems(className: string): string {
  const classDefaults: { [key: string]: string } = {
    // Warriors
    'Hero': '1040002,1060002,1072001,1302000',
    'Paladin': '1040002,1060002,1072001,1312000', 
    'Dark Knight': '1040002,1060002,1072001,1322000',
    'Dawn Warrior': '1040002,1060002,1072001,1302000',
    
    // Mages
    'Fire/Poison Mage': '1040002,1060002,1072001,1372000',
    'Ice/Lightning Mage': '1040002,1060002,1072001,1372000',
    'Bishop': '1040002,1060002,1072001,1372000',
    'Blaze Wizard': '1040002,1060002,1072001,1372000',
    
    // Archers
    'Bowmaster': '1040002,1060002,1072001,1452000',
    'Marksman': '1040002,1060002,1072001,1462000',
    'Pathfinder': '1040002,1060002,1072001,1452000',
    'Wind Archer': '1040002,1060002,1072001,1452000',
    
    // Thieves
    'Night Lord': '1040002,1060002,1072001,1472000',
    'Shadower': '1040002,1060002,1072001,1332000',
    'Dual Blade': '1040002,1060002,1072001,1342000',
    'Night Walker': '1040002,1060002,1072001,1472000',
    
    // Pirates
    'Buccaneer': '1040002,1060002,1072001,1482000',
    'Corsair': '1040002,1060002,1072001,1492000',
    'Cannoneer': '1040002,1060002,1072001,1532000',
    'Thunder Breaker': '1040002,1060002,1072001,1482000'
  };
  
  return classDefaults[className] || '1040002,1060002,1072001'; // Default basic clothes
}

/**
 * Fetch character sprite with error handling
 */
export async function fetchCharacterSprite(
  className: string,
  region: string = REGIONS.GMS,
  skinId: string = SKIN_IDS.LIGHT
): Promise<CharacterSprite | null> {
  try {
    const items = getClassDefaultItems(className);
    const url = generateCharacterSpriteUrl(region, VERSIONS.LATEST, skinId, items);
    
    console.log('Fetching character sprite for:', className);
    console.log('Generated URL:', url);
    
    // First test with a fetch request to see if there are CORS issues
    try {
      const response = await fetch(url, { mode: 'no-cors' });
      console.log('Fetch response status:', response.status);
    } catch (fetchError) {
      console.error('Fetch failed (likely CORS):', fetchError);
    }
    
    // Test if the image loads successfully
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Try to handle CORS
      
      const timeout = setTimeout(() => {
        console.error('Image load timeout for:', url);
        resolve(null);
      }, 10000); // 10 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        console.log('Image loaded successfully:', url);
        resolve({
          url,
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      
      img.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Image failed to load:', url, error);
        console.error('This is likely due to CORS restrictions on maplestory.io API');
        resolve(null);
      };
      
      img.src = url;
    });
  } catch (error) {
    console.error('Error fetching character sprite:', error);
    return null;
  }
}

/**
 * Get a placeholder character sprite URL based on job category
 */
export function getPlaceholderSprite(className: string): CharacterSprite {
  // Use base64 encoded SVG images to avoid CORS issues
  const placeholders = {
    warrior: createJobPlaceholder('⚔️', '#ff6b6b'),
    mage: createJobPlaceholder('🔮', '#4ecdc4'), 
    archer: createJobPlaceholder('🏹', '#45b7d1'),
    thief: createJobPlaceholder('🗡️', '#f9ca24'),
    pirate: createJobPlaceholder('🏴‍☠️', '#6c5ce7')
  };
  
  // Simple job category detection
  let category = 'warrior'; // default
  if (className.toLowerCase().includes('mage') || className.toLowerCase().includes('wizard') || className.includes('Bishop')) {
    category = 'mage';
  } else if (className.toLowerCase().includes('archer') || className.includes('Bowmaster') || className.includes('Marksman') || className.includes('Pathfinder')) {
    category = 'archer';
  } else if (className.toLowerCase().includes('lord') || className.toLowerCase().includes('shadower') || className.includes('Dual Blade')) {
    category = 'thief';
  } else if (className.toLowerCase().includes('buccaneer') || className.toLowerCase().includes('corsair') || className.includes('Cannoneer')) {
    category = 'pirate';
  }
  
  return {
    url: placeholders[category as keyof typeof placeholders],
    width: 80,
    height: 80
  };
}

/**
 * Create a base64 encoded SVG placeholder
 */
function createJobPlaceholder(emoji: string, color: string): string {
  const svg = `
    <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" fill="${color}" rx="8"/>
      <text x="40" y="45" font-family="Arial" font-size="24" text-anchor="middle" fill="white">${emoji}</text>
      <text x="40" y="65" font-family="Arial" font-size="8" text-anchor="middle" fill="white" opacity="0.8">MapleStory</text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}