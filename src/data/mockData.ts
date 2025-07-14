import { Character } from "@/types";

export const mockCharacters: Character[] = [
  {
    id: "default-galadriel",
    name: "Galadriel",
    class: "Mercedes",
    level: 284,
    server: "Reboot",
    equipment: [
      {
        id: "weapon-1",
        slot: "weapon",
        type: "weapon",
        set: "Arcane Umbra Dual Bowguns",
        level: 200,
        currentStarForce: 17,
        targetStarForce: 22,
        tier: "legendary",
        starforceable: true,
      },
      {
        id: "secondary-1",
        slot: "secondary",
        type: "weapon",
        set: "Arcane Umbra Bowstring",
        level: 200,
        currentStarForce: 15,
        targetStarForce: 17,
        tier: "legendary",
        starforceable: true,
      },
      {
        id: "badge-1",
        slot: "badge",
        type: "accessory",
        set: "Crystal Ventus Badge",
        level: 150,
        currentStarForce: 0,
        targetStarForce: 0,
        tier: "legendary",
        starforceable: false, // Badges cannot be starforced
      },
      {
        id: "medal-1",
        slot: "medal",
        type: "accessory",
        set: "Tenebris Expedition Medal",
        level: 120,
        currentStarForce: 0,
        targetStarForce: 0,
        tier: "unique",
        starforceable: false, // Medals cannot be starforced
      }
    ]
  }
];