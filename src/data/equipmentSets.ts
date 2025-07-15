// Equipment Set Definitions with Colors
export const EQUIPMENT_SETS = {
  // Boss Sets
  'Chaos Root Abyss': { name: 'Chaos Root Abyss', color: 'bg-red-500/20 text-red-700 border-red-200' },
  'Arcane Umbra': { name: 'Arcane Umbra', color: 'bg-purple-500/20 text-purple-700 border-purple-200' },
  'Genesis Liberated': { name: 'Genesis Liberated', color: 'bg-yellow-500/20 text-yellow-700 border-yellow-200' },
  'Eternal': { name: 'Eternal', color: 'bg-blue-500/20 text-blue-700 border-blue-200' },
  
  // Equipment Sets
  'Pensalir': { name: 'Pensalir', color: 'bg-gray-500/20 text-gray-700 border-gray-200' },
  'Sweetwater': { name: 'Sweetwater', color: 'bg-cyan-500/20 text-cyan-700 border-cyan-200' },
  'Absolab': { name: 'Absolab', color: 'bg-orange-500/20 text-orange-700 border-orange-200' },
  
  // Boss Equipment
  'Gollux': { name: 'Gollux', color: 'bg-green-500/20 text-green-700 border-green-200' },
  'Pink Bean': { name: 'Pink Bean', color: 'bg-pink-500/20 text-pink-700 border-pink-200' },
  'Tyrant': { name: 'Tyrant', color: 'bg-red-600/20 text-red-800 border-red-300' },
  'Pitched Boss': { name: 'Pitched Boss', color: 'bg-indigo-500/20 text-indigo-700 border-indigo-200' },
  'Kalos': { name: 'Kalos', color: 'bg-violet-500/20 text-violet-700 border-violet-200' },
  
  // Special Sets
  'Boss': { name: 'Boss', color: 'bg-slate-500/20 text-slate-700 border-slate-200' },
  'Magnus': { name: 'Magnus', color: 'bg-emerald-500/20 text-emerald-700 border-emerald-200' },
  'Von Leon': { name: 'Von Leon', color: 'bg-amber-500/20 text-amber-700 border-amber-200' },
  'Chaos Horntail': { name: 'Chaos Horntail', color: 'bg-lime-500/20 text-lime-700 border-lime-200' },
  'Chaos Zakum': { name: 'Chaos Zakum', color: 'bg-teal-500/20 text-teal-700 border-teal-200' },
  
  // Other Sets
  'MapleStory': { name: 'MapleStory', color: 'bg-red-500/20 text-red-700 border-red-200' },
  'Hero': { name: 'Hero', color: 'bg-blue-600/20 text-blue-800 border-blue-300' },
  'Cygnus': { name: 'Cygnus', color: 'bg-sky-500/20 text-sky-700 border-sky-200' },
  'Resistance': { name: 'Resistance', color: 'bg-stone-500/20 text-stone-700 border-stone-200' },
  'Android': { name: 'Android', color: 'bg-neutral-500/20 text-neutral-700 border-neutral-200' },
} as const;

export const EQUIPMENT_BY_SLOT = {
  // Weapons
  weapon: [
    { name: 'Pensalir', level: 140, tier: null, setKey: 'Pensalir', imageUrl: 'https://maplestory.io/api/GMS/238/item/1372084/icon' },
    { name: 'Fafnir', level: 150, tier: null, setKey: 'Chaos Root Abyss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1372082/icon' },
    { name: 'Sweetwater', level: 160, tier: null, setKey: 'Sweetwater', imageUrl: 'https://maplestory.io/api/GMS/238/item/1372103/icon' },
    { name: 'Absolab', level: 160, tier: null, setKey: 'Absolab', imageUrl: 'https://maplestory.io/api/GMS/238/item/1372180/icon' },
    { name: 'Arcane Umbra', level: 200, tier: null, setKey: 'Arcane Umbra', imageUrl: 'https://maplestory.io/api/GMS/238/item/1372216/icon' },
    { name: 'Genesis', level: 200, tier: null, setKey: 'Genesis Liberated', imageUrl: 'https://maplestory.io/api/GMS/238/item/1372254/icon' },
    { name: 'Eternal', level: 250, tier: null, setKey: 'Eternal', imageUrl: 'https://maplestory.io/api/GMS/238/item/1372310/icon' },
  ],
  secondary: [
    { name: 'Generic', level: 100, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1092030/icon' },
    { name: 'Deimos Sage Shield', level: 130, tier: null, setKey: 'Boss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1098000/icon' },
    { name: 'Deimos Shadow Shield', level: 130, tier: null, setKey: 'Boss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1098001/icon' },
    { name: 'Princess No', level: 140, tier: null, setKey: 'Boss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1098027/icon' },
    { name: 'Sweetwater', level: 160, tier: null, setKey: 'Sweetwater', imageUrl: 'https://maplestory.io/api/GMS/238/item/1098028/icon' },
    { name: 'Absolab', level: 160, tier: null, setKey: 'Absolab', imageUrl: 'https://maplestory.io/api/GMS/238/item/1098029/icon' },
    { name: 'Arcane Umbra', level: 200, tier: null, setKey: 'Arcane Umbra', imageUrl: 'https://maplestory.io/api/GMS/238/item/1098030/icon' },
    { name: 'Eternal', level: 250, tier: null, setKey: 'Eternal', imageUrl: 'https://maplestory.io/api/GMS/238/item/1098031/icon' },
    { name: 'Genesis', level: 200, tier: null, setKey: 'Genesis Liberated', imageUrl: 'https://maplestory.io/api/GMS/238/item/1098032/icon' },
  ],
  emblem: [
    { name: 'Gold Maple Leaf Emblem', level: 100, tier: null, setKey: 'MapleStory', imageUrl: 'https://maplestory.io/api/GMS/238/item/1190000/icon' },
    { name: 'Gold Hero Emblem', level: 100, tier: null, setKey: 'Hero', imageUrl: 'https://maplestory.io/api/GMS/238/item/1190001/icon' },
    { name: 'Gold Cygnus Emblem', level: 100, tier: null, setKey: 'Cygnus', imageUrl: 'https://maplestory.io/api/GMS/238/item/1190002/icon' },
    { name: 'Gold Resistance Emblem', level: 100, tier: null, setKey: 'Resistance', imageUrl: 'https://maplestory.io/api/GMS/238/item/1190003/icon' },
    { name: 'Mitras Rage', level: 100, tier: null, setKey: 'Boss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1190010/icon' },
  ],

  // Armor pieces
  hat: [
    { name: 'Pensalir', level: 140, tier: null, setKey: 'Pensalir', imageUrl: 'https://maplestory.io/api/GMS/238/item/1003735/icon' },
    { name: 'Fafnir', level: 150, tier: null, setKey: 'Chaos Root Abyss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1003739/icon' },
    { name: 'Sweetwater', level: 160, tier: null, setKey: 'Sweetwater', imageUrl: 'https://maplestory.io/api/GMS/238/item/1003998/icon' },
    { name: 'Absolab', level: 160, tier: null, setKey: 'Absolab', imageUrl: 'https://maplestory.io/api/GMS/238/item/1004341/icon' },
    { name: 'Arcane Umbra', level: 200, tier: null, setKey: 'Arcane Umbra', imageUrl: 'https://maplestory.io/api/GMS/238/item/1004404/icon' },
    { name: 'Eternal', level: 250, tier: null, setKey: 'Eternal', imageUrl: 'https://maplestory.io/api/GMS/238/item/1004450/icon' },
  ],
  top: [
    { name: 'Pensalir', level: 140, tier: null, setKey: 'Pensalir', imageUrl: 'https://maplestory.io/api/GMS/238/item/1042180/icon' },
    { name: 'Fafnir', level: 150, tier: null, setKey: 'Chaos Root Abyss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1042181/icon' },
    { name: 'Sweetwater', level: 160, tier: null, setKey: 'Sweetwater', imageUrl: 'https://maplestory.io/api/GMS/238/item/1042259/icon' },
    { name: 'Absolab', level: 160, tier: null, setKey: 'Absolab', imageUrl: 'https://maplestory.io/api/GMS/238/item/1042309/icon' },
    { name: 'Arcane Umbra', level: 200, tier: null, setKey: 'Arcane Umbra', imageUrl: 'https://maplestory.io/api/GMS/238/item/1042356/icon' },
    { name: 'Eternal', level: 250, tier: null, setKey: 'Eternal', imageUrl: 'https://maplestory.io/api/GMS/238/item/1042400/icon' },
  ],
  bottom: [
    { name: 'Pensalir', level: 140, tier: null, setKey: 'Pensalir', imageUrl: 'https://maplestory.io/api/GMS/238/item/1062115/icon' },
    { name: 'Fafnir', level: 150, tier: null, setKey: 'Chaos Root Abyss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1062116/icon' },
    { name: 'Sweetwater', level: 160, tier: null, setKey: 'Sweetwater', imageUrl: 'https://maplestory.io/api/GMS/238/item/1062165/icon' },
    { name: 'Absolab', level: 160, tier: null, setKey: 'Absolab', imageUrl: 'https://maplestory.io/api/GMS/238/item/1062208/icon' },
    { name: 'Arcane Umbra', level: 200, tier: null, setKey: 'Arcane Umbra', imageUrl: 'https://maplestory.io/api/GMS/238/item/1062255/icon' },
    { name: 'Eternal', level: 250, tier: null, setKey: 'Eternal', imageUrl: 'https://maplestory.io/api/GMS/238/item/1062300/icon' },
  ],
  overall: [
    { name: 'Pensalir', level: 140, tier: null, setKey: 'Pensalir', imageUrl: 'https://maplestory.io/api/GMS/238/item/1052357/icon' },
    { name: 'Absolab', level: 160, tier: null, setKey: 'Absolab', imageUrl: 'https://maplestory.io/api/GMS/238/item/1052681/icon' },
    { name: 'Arcane Umbra', level: 200, tier: null, setKey: 'Arcane Umbra', imageUrl: 'https://maplestory.io/api/GMS/238/item/1052729/icon' },
  ],
  shoes: [
    { name: 'Pensalir', level: 140, tier: null, setKey: 'Pensalir', imageUrl: 'https://maplestory.io/api/GMS/238/item/1072455/icon' },
    { name: 'Fafnir', level: 150, tier: null, setKey: 'Chaos Root Abyss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1072456/icon' },
    { name: 'Sweetwater', level: 160, tier: null, setKey: 'Sweetwater', imageUrl: 'https://maplestory.io/api/GMS/238/item/1072743/icon' },
    { name: 'Absolab', level: 160, tier: null, setKey: 'Absolab', imageUrl: 'https://maplestory.io/api/GMS/238/item/1072761/icon' },
    { name: 'Arcane Umbra', level: 200, tier: null, setKey: 'Arcane Umbra', imageUrl: 'https://maplestory.io/api/GMS/238/item/1072808/icon' },
    { name: 'Eternal', level: 250, tier: null, setKey: 'Eternal', imageUrl: 'https://maplestory.io/api/GMS/238/item/1072850/icon' },
  ],
  gloves: [
    { name: 'Pensalir', level: 140, tier: null, setKey: 'Pensalir', imageUrl: 'https://maplestory.io/api/GMS/238/item/1082268/icon' },
    { name: 'Fafnir', level: 150, tier: null, setKey: 'Chaos Root Abyss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1082269/icon' },
    { name: 'Sweetwater', level: 160, tier: null, setKey: 'Sweetwater', imageUrl: 'https://maplestory.io/api/GMS/238/item/1082543/icon' },
    { name: 'Absolab', level: 160, tier: null, setKey: 'Absolab', imageUrl: 'https://maplestory.io/api/GMS/238/item/1082587/icon' },
    { name: 'Arcane Umbra', level: 200, tier: null, setKey: 'Arcane Umbra', imageUrl: 'https://maplestory.io/api/GMS/238/item/1082634/icon' },
    { name: 'Eternal', level: 250, tier: null, setKey: 'Eternal', imageUrl: 'https://maplestory.io/api/GMS/238/item/1082680/icon' },
  ],
  cape: [
    { name: 'Absolab', level: 160, tier: null, setKey: 'Absolab', imageUrl: 'https://maplestory.io/api/GMS/238/item/1102481/icon' },
    { name: 'Arcane Umbra', level: 200, tier: null, setKey: 'Arcane Umbra', imageUrl: 'https://maplestory.io/api/GMS/238/item/1102528/icon' },
    { name: 'Eternal', level: 250, tier: null, setKey: 'Eternal', imageUrl: 'https://maplestory.io/api/GMS/238/item/1102570/icon' },
  ],
  belt: [
    { name: 'Pink Bean', level: 140, tier: null, setKey: 'Pink Bean', imageUrl: 'https://maplestory.io/api/GMS/238/item/1132040/icon' },
    { name: 'Reinforced Gollux', level: 140, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1132172/icon' },
    { name: 'Superior Gollux', level: 150, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1132174/icon' },
    { name: 'Tyrant', level: 150, tier: null, setKey: 'Tyrant', imageUrl: 'https://maplestory.io/api/GMS/238/item/1132184/icon' },
  ],
  shoulder: [
    { name: 'Absolab', level: 160, tier: null, setKey: 'Absolab', imageUrl: 'https://maplestory.io/api/GMS/238/item/1152174/icon' },
    { name: 'Arcane Umbra', level: 200, tier: null, setKey: 'Arcane Umbra', imageUrl: 'https://maplestory.io/api/GMS/238/item/1152221/icon' },
    { name: 'Eternal', level: 250, tier: null, setKey: 'Eternal', imageUrl: 'https://maplestory.io/api/GMS/238/item/1152260/icon' },
  ],

  // Face & Eye accessories
  face: [
    { name: 'Aquatic Letter Face Accessory', level: 50, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1012057/icon' },
    { name: 'Twilight Mark', level: 140, tier: null, setKey: 'Boss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1012316/icon' },
    { name: 'Sweetwater Tattoo', level: 160, tier: null, setKey: 'Sweetwater', imageUrl: 'https://maplestory.io/api/GMS/238/item/1012432/icon' },
    { name: 'Berserked', level: 200, tier: null, setKey: 'Pitched Boss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1012632/icon' },
  ],
  eye: [
    { name: 'Aquatic Letter Eye Accessory', level: 100, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1022082/icon' },
    { name: 'Black Bean Mark', level: 135, tier: null, setKey: 'Boss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1022211/icon' },
    { name: 'Papulatus Mark', level: 145, tier: null, setKey: 'Boss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1022231/icon' },
    { name: 'Sweetwater Monocle', level: 160, tier: null, setKey: 'Sweetwater', imageUrl: 'https://maplestory.io/api/GMS/238/item/1022278/icon' },
    { name: 'Magic Eyepatch', level: 160, tier: null, setKey: 'Magnus', imageUrl: 'https://maplestory.io/api/GMS/238/item/1022279/icon' },
  ],

  // Jewelry
  earring: [
    { name: 'Dea Sidus Earring', level: 130, tier: null, setKey: 'Von Leon', imageUrl: 'https://maplestory.io/api/GMS/238/item/1032062/icon' },
    { name: 'Meister Earrings', level: 140, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1032230/icon' },
    { name: 'Reinforced Gollux', level: 140, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1032238/icon' },
    { name: 'Superior Gollux', level: 150, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1032240/icon' },
    { name: 'Commanding Force Earring', level: 200, tier: null, setKey: 'Pitched Boss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1032308/icon' },
  ],
  ring1: [
    { name: 'Oz Ring', level: 110, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1113149/icon' },
    { name: 'Event Ring', level: 120, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112300/icon' },
    { name: 'Silver Blossom Ring', level: 110, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112806/icon' },
    { name: 'Treasure Hunter John Ring', level: 125, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112965/icon' },
    { name: 'Reinforced Gollux Ring', level: 140, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1112926/icon' },
    { name: 'Meister Ring', level: 140, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112905/icon' },
    { name: 'Kanna\'s Treasure', level: 140, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112940/icon' },
    { name: 'Superior Gollux', level: 150, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1112928/icon' },
    { name: 'Guardian Angel Ring', level: 160, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1113074/icon' },
    { name: 'Eternal Terror', level: 200, tier: null, setKey: 'Pitched Boss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1113308/icon' },
    { name: 'Whisper of the Source', level: 250, tier: null, setKey: 'Kalos', imageUrl: 'https://maplestory.io/api/GMS/238/item/1113350/icon' },
  ],
  ring2: [
    { name: 'Oz Ring', level: 110, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1113149/icon' },
    { name: 'Event Ring', level: 120, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112300/icon' },
    { name: 'Silver Blossom Ring', level: 110, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112806/icon' },
    { name: 'Treasure Hunter John Ring', level: 125, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112965/icon' },
    { name: 'Reinforced Gollux Ring', level: 140, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1112926/icon' },
    { name: 'Meister Ring', level: 140, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112905/icon' },
    { name: 'Kanna\'s Treasure', level: 140, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112940/icon' },
    { name: 'Superior Gollux', level: 150, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1112928/icon' },
    { name: 'Guardian Angel Ring', level: 160, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1113074/icon' },
    { name: 'Eternal Terror', level: 200, tier: null, setKey: 'Pitched Boss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1113308/icon' },
    { name: 'Whisper of the Source', level: 250, tier: null, setKey: 'Kalos', imageUrl: 'https://maplestory.io/api/GMS/238/item/1113350/icon' },
  ],
  ring3: [
    { name: 'Oz Ring', level: 110, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1113149/icon' },
    { name: 'Event Ring', level: 120, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112300/icon' },
    { name: 'Silver Blossom Ring', level: 110, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112806/icon' },
    { name: 'Treasure Hunter John Ring', level: 125, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112965/icon' },
    { name: 'Reinforced Gollux Ring', level: 140, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1112926/icon' },
    { name: 'Meister Ring', level: 140, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112905/icon' },
    { name: 'Kanna\'s Treasure', level: 140, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112940/icon' },
    { name: 'Superior Gollux', level: 150, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1112928/icon' },
    { name: 'Guardian Angel Ring', level: 160, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1113074/icon' },
    { name: 'Eternal Terror', level: 200, tier: null, setKey: 'Pitched Boss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1113308/icon' },
    { name: 'Whisper of the Source', level: 250, tier: null, setKey: 'Kalos', imageUrl: 'https://maplestory.io/api/GMS/238/item/1113350/icon' },
  ],
  ring4: [
    { name: 'Oz Ring', level: 110, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1113149/icon' },
    { name: 'Event Ring', level: 120, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112300/icon' },
    { name: 'Silver Blossom Ring', level: 110, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112806/icon' },
    { name: 'Treasure Hunter John Ring', level: 125, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112965/icon' },
    { name: 'Reinforced Gollux Ring', level: 140, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1112926/icon' },
    { name: 'Meister Ring', level: 140, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112905/icon' },
    { name: 'Kanna\'s Treasure', level: 140, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1112940/icon' },
    { name: 'Superior Gollux', level: 150, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1112928/icon' },
    { name: 'Guardian Angel Ring', level: 160, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1113074/icon' },
    { name: 'Eternal Terror', level: 200, tier: null, setKey: 'Pitched Boss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1113308/icon' },
    { name: 'Whisper of the Source', level: 250, tier: null, setKey: 'Kalos', imageUrl: 'https://maplestory.io/api/GMS/238/item/1113350/icon' },
  ],
  pendant1: [
    { name: 'Chaos Horntail Necklace', level: 120, tier: null, setKey: 'Chaos Horntail', imageUrl: 'https://maplestory.io/api/GMS/238/item/1122000/icon' },
    { name: 'Mechinator Pendent', level: 120, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1122076/icon' },
    { name: 'Dominator Pendant', level: 140, tier: null, setKey: 'Boss', imageUrl: 'https://maplestory.io/api/GMS/238/item/1122019/icon' },
    { name: 'Reinforced Gollux Pendent', level: 140, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1122017/icon' },
    { name: 'Daybreak Pendant', level: 140, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1122020/icon' },
    { name: 'Superior Gollux', level: 150, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1122021/icon' },
    { name: 'Source of Suffering', level: 160, tier: null, setKey: 'Magnus', imageUrl: 'https://maplestory.io/api/GMS/238/item/1122268/icon' },
    { name: 'Oath of Death', level: 250, tier: null, setKey: 'Kalos', imageUrl: 'https://maplestory.io/api/GMS/238/item/1122320/icon' },
  ],
  pendant2: [
    { name: 'Chaos Horntail Necklace', level: 120, tier: null, setKey: 'Chaos Horntail', imageUrl: 'https://maplestory.io/api/GMS/238/item/1122000/icon' },
    { name: 'Mechinator Pendent', level: 120, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1122076/icon' },
    { name: 'Dominator Pendant', level: 140, tier: null, setKey: 'Boss', imageUrl: 'https://static.wikia.nocookie.net/maplestory/images/c/c3/Eqp_Dominator_Pendant.png/revision/latest?cb=20160106061857' },
    { name: 'Reinforced Gollux Pendent', level: 140, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1122017/icon' },
    { name: 'Daybreak Pendant', level: 140, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1122020/icon' },
    { name: 'Superior Gollux', level: 150, tier: null, setKey: 'Gollux', imageUrl: 'https://maplestory.io/api/GMS/238/item/1122021/icon' },
    { name: 'Source of Suffering', level: 160, tier: null, setKey: 'Magnus', imageUrl: 'https://maplestory.io/api/GMS/238/item/1122268/icon' },
    { name: 'Oath of Death', level: 250, tier: null, setKey: 'Kalos', imageUrl: 'https://maplestory.io/api/GMS/238/item/1122320/icon' },
  ],

  // Special items
  pocket: [
    { name: 'Stone of Eternal Life', level: 0, tier: null, setKey: 'Pink Bean', imageUrl: 'https://maplestory.io/api/GMS/238/item/1162000/icon' },
    { name: 'Pink Holy Cup', level: 140, tier: null, setKey: 'Pink Bean', imageUrl: 'https://maplestory.io/api/GMS/238/item/1162054/icon' },
    { name: 'Cursed Magical Book', level: 160, tier: null, setKey: 'Magnus', imageUrl: 'https://maplestory.io/api/GMS/238/item/1162080/icon' },
  ],
  heart: [
    { name: 'Lidium Heart', level: 30, tier: null, setKey: 'Android', imageUrl: 'https://maplestory.io/api/GMS/238/item/1672000/icon' },
    { name: 'Fairy Heart', level: 100, tier: null, setKey: 'Android', imageUrl: 'https://maplestory.io/api/GMS/238/item/1672001/icon' },
    { name: 'Black Heart', level: 120, tier: null, setKey: 'Android', imageUrl: 'https://maplestory.io/api/GMS/238/item/1672002/icon' },
    { name: 'Total Control', level: 200, tier: null, setKey: 'Android', imageUrl: 'https://maplestory.io/api/GMS/238/item/1672020/icon' },
  ],
  badge: [
    { name: 'Crystal Ventus Badge', level: 100, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1182000/icon' },
    { name: 'Sengoku Hakase Badge', level: 160, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1182087/icon' },
    { name: 'Genesis Badge', level: 200, tier: null, setKey: 'Genesis Liberated', imageUrl: 'https://maplestory.io/api/GMS/238/item/1182285/icon' },
  ],
  medal: [
    { name: 'Zakum Slayer', level: 50, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1142010/icon' },
    { name: 'Chaos Zakum Slayer', level: 120, tier: null, setKey: 'Chaos Zakum', imageUrl: 'https://maplestory.io/api/GMS/238/item/1142011/icon' },
    { name: 'Horntail Slayer', level: 120, tier: null, imageUrl: 'https://maplestory.io/api/GMS/238/item/1142012/icon' },
    { name: 'Chaos Horntail Slayer', level: 130, tier: null, setKey: 'Chaos Horntail', imageUrl: 'https://maplestory.io/api/GMS/238/item/1142013/icon' },
    { name: 'Von Leon Slayer', level: 140, tier: null, setKey: 'Von Leon', imageUrl: 'https://maplestory.io/api/GMS/238/item/1142157/icon' },
  ],
};
