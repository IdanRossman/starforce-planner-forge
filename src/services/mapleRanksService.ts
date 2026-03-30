import { apiService } from "./api";

export type Region = "north-america" | "europe";

interface NexonCharacter {
  name: string;
  level: number;
  image: string;
}

export const fetchCharacterFromMapleRanks = async (
  characterName: string,
  region: Region = "north-america",
): Promise<NexonCharacter | null> => {
  try {
    return await apiService.get<NexonCharacter>(
      `/api/NexonRanking/character?name=${encodeURIComponent(characterName)}&region=${region}`,
    );
  } catch (error) {
    console.error("NexonRanking: Error fetching character:", error);
    return null;
  }
};
