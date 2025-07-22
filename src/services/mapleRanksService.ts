interface MapleRanksCharacter {
  name: string;
  class: string;
  level: number;
  image: string;
}

export const fetchCharacterFromMapleRanks = async (characterName: string): Promise<MapleRanksCharacter | null> => {
  const targetUrl = `https://mapleranks.com/u/${encodeURIComponent(characterName)}`;
  
  // Use corsproxy.io as primary method since we know it works
  try {
    console.log('MapleRanks: Using corsproxy.io for:', characterName);
    
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    console.log('MapleRanks: Fetching from:', proxyUrl);
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    console.log('MapleRanks: Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const html = await response.text();
      console.log('MapleRanks: Got HTML content, length:', html?.length || 'No content');
      
      if (html && html.length > 100) {
        const result = parseMapleRanksHTML(html);
        if (result) {
          console.log('MapleRanks: Successfully parsed character data');
          return result;
        } else {
          console.warn('MapleRanks: Got HTML but parsing failed');
        }
      } else {
        console.warn('MapleRanks: Insufficient HTML content received');
      }
    } else {
      console.warn('MapleRanks: Proxy request failed with status:', response.status);
    }
  } catch (error) {
    console.error('MapleRanks: Proxy request error:', error);
  }
  
  // If corsproxy.io fails, try direct access as fallback
  try {
    console.log('MapleRanks: Trying direct URL as fallback:', targetUrl);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      mode: 'cors',
      signal: AbortSignal.timeout(8000)
    });
    
    if (response.ok) {
      const html = await response.text();
      if (html && html.length > 100) {
        const result = parseMapleRanksHTML(html);
        if (result) {
          console.log('MapleRanks: Successfully parsed data via direct access');
          return result;
        }
      }
    }
  } catch (error) {
    console.log('MapleRanks: Direct access failed (expected):', error.message);
  }
  
  console.error('MapleRanks: All methods failed');
  return null;
};

const parseMapleRanksHTML = (html: string): MapleRanksCharacter | null => {
  try {
    console.log('MapleRanks: Starting HTML parsing, content length:', html?.length || 'undefined');
    
    // Create a DOM parser to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    console.log('MapleRanks: DOM parsed successfully');
    
    // Extract character name from h3.card-title
    const nameElement = doc.querySelector('h3.card-title');
    const name = nameElement?.textContent?.trim() || '';
    console.log('MapleRanks: Found name element:', nameElement?.textContent, '-> parsed as:', name);
    
    // Extract level from h5.card-text (format: "Lv. 272 (32.961%)")
    const levelElement = doc.querySelector('h5.card-text');
    const levelText = levelElement?.textContent?.trim() || '';
    const levelMatch = levelText.match(/Lv\.\s*(\d+)/);
    const level = levelMatch ? parseInt(levelMatch[1]) : 0;
    console.log('MapleRanks: Found level element:', levelElement?.textContent, '-> parsed as:', level);
    
    // Extract class from p.card-text.mb-0 (format: "Bowmaster in Reboot Hyperion")
    const classServerElement = doc.querySelector('p.card-text.mb-0');
    const classServerText = classServerElement?.textContent?.trim() || '';
    const classServerMatch = classServerText.match(/^(.+?)\s+in\s+(.+)$/);
    const rawCharacterClass = classServerMatch ? classServerMatch[1] : '';
    console.log('MapleRanks: Found class element:', classServerElement?.textContent, '-> raw class:', rawCharacterClass);
    
    // Normalize the character class name to match our dropdown options
    const characterClass = normalizeClassName(rawCharacterClass);
    console.log('MapleRanks: Normalized class from', rawCharacterClass, 'to', characterClass);
    
    // Extract character image from img.card-img-top
    const imageElement = doc.querySelector('img.card-img-top');
    const image = imageElement?.getAttribute('src') || '';
    console.log('MapleRanks: Found image element:', imageElement, '-> parsed as:', image);
    
    if (!name || !level || !characterClass) {
      console.warn('Failed to parse character data from MapleRanks:', {
        name, level, characterClass, image
      });
      return null;
    }
    
    const result = {
      name: name.trim(),
      class: characterClass,
      level,
      image
    };
    
    console.log('MapleRanks: Successfully parsed character:', result);
    return result;
  } catch (error) {
    console.error('Error parsing MapleRanks HTML:', error);
    return null;
  }
};

// Function to normalize class names from MapleRanks to match our dropdown options
const normalizeClassName = (className: string): string => {
  if (!className) return '';
  
  // Mapping of MapleRanks class names to our application's class names
  const classNameMapping: { [key: string]: string } = {
    // Handle common variations
    'Fire/Poison Arch Mage': 'Fire/Poison Mage',
    'Ice/Lightning Arch Mage': 'Ice/Lightning Mage',
    'Bishop': 'Bishop',
    'Bowmaster': 'Bowmaster',
    'Marksman': 'Marksman',
    'Pathfinder': 'Pathfinder',
    'Night Lord': 'Night Lord',
    'Shadower': 'Shadower',
    'Dual Blade': 'Dual Blade',
    'Buccaneer': 'Buccaneer',
    'Corsair': 'Corsair',
    'Cannoneer': 'Cannoneer',
    'Hero': 'Hero',
    'Paladin': 'Paladin',
    'Dark Knight': 'Dark Knight',
    'Dawn Warrior': 'Dawn Warrior',
    'Blaze Wizard': 'Blaze Wizard',
    'Wind Archer': 'Wind Archer',
    'Night Walker': 'Night Walker',
    'Thunder Breaker': 'Thunder Breaker',
    'Mihile': 'Mihile',
    'Aran': 'Aran',
    'Evan': 'Evan',
    'Mercedes': 'Mercedes',
    'Phantom': 'Phantom',
    'Luminous': 'Luminous',
    'Shade': 'Shade',
    'Blaster': 'Blaster',
    'Battle Mage': 'Battle Mage',
    'Wild Hunter': 'Wild Hunter',
    'Mechanic': 'Mechanic',
    'Xenon': 'Xenon',
    'Demon Slayer': 'Demon Slayer',
    'Demon Avenger': 'Demon Avenger',
    'Kaiser': 'Kaiser',
    'Angelic Buster': 'Angelic Buster',
    'Cadena': 'Cadena',
    'Kain': 'Kain',
    'Illium': 'Illium',
    'Ark': 'Ark',
    'Adele': 'Adele',
    'Khali': 'Khali',
    'Lara': 'Lara',
    'Zero': 'Zero',
    'Kinesis': 'Kinesis',
    'Hayato': 'Hayato',
    'Kanna': 'Kanna',
    'Beast Tamer': 'Beast Tamer'
  };
  
  // Try exact match first
  if (classNameMapping[className]) {
    return classNameMapping[className];
  }
  
  // Try case-insensitive match
  const lowerClassName = className.toLowerCase();
  for (const [key, value] of Object.entries(classNameMapping)) {
    if (key.toLowerCase() === lowerClassName) {
      return value;
    }
  }
  
  // If no match found, return the original class name
  console.warn('MapleRanks: Unknown class name:', className);
  return className;
};
