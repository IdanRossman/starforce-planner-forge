interface NexonCharacter {
  name: string;
  class: string;
  level: number;
  image: string;
}

interface NexonAPIResponse {
  totalCount: number;
  ranks: Array<{
    characterID: number;
    characterName: string;
    exp: number;
    gap: number;
    jobDetail: number;
    jobID: number;
    level: number;
    rank: number;
    startRank: number;
    worldID: number;
    characterImgURL: string;
    isSearchTarget: boolean;
    legionLevel: number;
    raidPower: number;
    tierID: number;
    score: number;
  }>;
}

export type Region = 'north-america' | 'europe';

/**
 * Fetch character data from Nexon's official MapleStory ranking API
 * @param characterName - The name of the character to search for
 * @param region - The region to search in: 'north-america' or 'europe'
 * @returns Character data or null if not found
 */
export const fetchCharacterFromMapleRanks = async (
  characterName: string,
  region: Region = 'north-america'
): Promise<NexonCharacter | null> => {
  try {
    // Map region to API endpoint
    const regionCode = region === 'europe' ? 'eu' : 'na';
    
    // Nexon API endpoint
    const apiUrl = `https://www.nexon.com/api/maplestory/no-auth/ranking/v2/${regionCode}?type=overall&id=weekly&reboot_index=0&page_index=1&character_name=${encodeURIComponent(characterName)}`;
    
    // Use CORS proxy to bypass CORS restrictions
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
    
    console.log(`Nexon API: Fetching character "${characterName}" from ${region} (${regionCode})`);
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    if (!response.ok) {
      console.warn(`Nexon API: Request failed with status ${response.status}`);
      return null;
    }
    
    const data: NexonAPIResponse = await response.json();
    
    console.log('Nexon API: Response received:', data);
    
    // Check if any results were found
    if (!data.ranks || data.ranks.length === 0) {
      console.warn('Nexon API: No character found with that name');
      return null;
    }
    
    // Get the first result (should be exact match if isSearchTarget is true)
    const characterData = data.ranks.find(rank => rank.isSearchTarget) || data.ranks[0];
    
    const result: NexonCharacter = {
      name: characterData.characterName,
      class: '', // Will need to be set manually by user for now
      level: characterData.level,
      image: characterData.characterImgURL
    };
    
    console.log('Nexon API: Successfully parsed character:', result);
    return result;
    
  } catch (error) {
    console.error('Nexon API: Error fetching character:', error);
    return null;
  }
};
