import { Sword, Wand2, Target, Ship, Zap } from "lucide-react";

// Job category mapping
export const JOB_CATEGORIES = {
  WARRIOR: 'warrior',
  MAGE: 'mage', 
  ARCHER: 'archer',
  THIEF: 'thief',
  PIRATE: 'pirate'
} as const;

// Map character classes to job categories
export const getJobCategory = (className: string): string => {
  const warriors = [
    'Hero', 'Paladin', 'Dark Knight', 'Dawn Warrior', 'Aran', 'Kaiser', 'Demon Slayer', 'Demon Avenger',
    'Blaster', 'Hayato', 'Zero', 'Adele', 'Ark'
  ];
  
  const mages = [
    'Fire/Poison Mage', 'Ice/Lightning Mage', 'Bishop', 'Blaze Wizard', 'Evan', 'Luminous', 
    'Battle Mage', 'Kanna', 'Kinesis', 'Illium', 'Lara'
  ];
  
  const archers = [
    'Bowmaster', 'Marksman', 'Pathfinder', 'Wind Archer', 'Mercedes', 'Wild Hunter', 'Kain'
  ];
  
  const thieves = [
    'Night Lord', 'Shadower', 'Dual Blade', 'Night Walker', 'Phantom', 'Xenon', 'Cadena', 'Khali'
  ];
  
  const pirates = [
    'Buccaneer', 'Corsair', 'Cannoneer', 'Thunder Breaker', 'Shade', 'Mechanic', 'Angelic Buster', 'Beast Tamer'
  ];
  
  if (warriors.includes(className)) return JOB_CATEGORIES.WARRIOR;
  if (mages.includes(className)) return JOB_CATEGORIES.MAGE;
  if (archers.includes(className)) return JOB_CATEGORIES.ARCHER;
  if (thieves.includes(className)) return JOB_CATEGORIES.THIEF;
  if (pirates.includes(className)) return JOB_CATEGORIES.PIRATE;
  
  return JOB_CATEGORIES.WARRIOR; // default fallback
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