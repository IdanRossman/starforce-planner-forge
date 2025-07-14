import { Character } from "@/types";

export const mockCharacters: Character[] = [
  {
    id: "1",
    name: "WindWalker",
    class: "Wind Archer",
    level: 275,
    server: "Reboot",
    equipment: [
      {
        id: "eq1",
        slot: "weapon",
        name: "Absolab Bow",
        type: "weapon",
        level: 160,
        set: "Absolab",
        currentStarForce: 17,
        targetStarForce: 22,
        tier: "legendary"
      },
      {
        id: "eq2",
        slot: "top",
        name: "Absolab Archer Top",
        type: "armor",
        level: 160,
        set: "Absolab",
        currentStarForce: 15,
        targetStarForce: 17,
        tier: "legendary"
      },
      {
        id: "eq3",
        slot: "bottom",
        name: "Absolab Archer Bottom",
        type: "armor",
        level: 160,
        set: "Absolab",
        currentStarForce: 12,
        targetStarForce: 17,
        tier: "unique"
      },
      {
        id: "eq4",
        slot: "gloves",
        name: "Absolab Archer Gloves",
        type: "armor",
        level: 160,
        set: "Absolab",
        currentStarForce: 10,
        targetStarForce: 15,
        tier: "unique"
      },
      {
        id: "eq5",
        slot: "shoes",
        name: "Absolab Archer Shoes",
        type: "armor",
        level: 160,
        set: "Absolab",
        currentStarForce: 8,
        targetStarForce: 15,
        tier: "epic"
      }
    ]
  },
  {
    id: "2",
    name: "IceMage",
    class: "Ice/Lightning Arch Mage",
    level: 250,
    server: "Scania",
    equipment: [
      {
        id: "eq6",
        slot: "weapon",
        name: "Arcane Umbra Staff",
        type: "weapon",
        level: 200,
        set: "Arcane Umbra",
        currentStarForce: 20,
        targetStarForce: 22,
        tier: "legendary"
      },
      {
        id: "eq7",
        slot: "secondary",
        name: "Arcane Umbra Orb",
        type: "weapon",
        level: 200,
        set: "Arcane Umbra",
        currentStarForce: 18,
        targetStarForce: 22,
        tier: "legendary"
      },
      {
        id: "eq8",
        slot: "hat",
        name: "Arcane Umbra Mage Hat",
        type: "armor",
        level: 200,
        set: "Arcane Umbra",
        currentStarForce: 17,
        targetStarForce: 17,
        tier: "legendary"
      }
    ]
  },
  {
    id: "3",
    name: "ShadowNinja",
    class: "Night Lord",
    level: 280,
    server: "Bera",
    equipment: [
      {
        id: "eq9",
        slot: "weapon",
        name: "Genesis Dagger",
        type: "weapon",
        level: 200,
        set: "Genesis",
        currentStarForce: 22,
        targetStarForce: 25,
        tier: "legendary"
      },
      {
        id: "eq10",
        slot: "secondary",
        name: "Genesis Katara",
        type: "weapon",
        level: 200,
        set: "Genesis",
        currentStarForce: 21,
        targetStarForce: 25,
        tier: "legendary"
      }
    ]
  }
];