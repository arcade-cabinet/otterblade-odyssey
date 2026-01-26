/**
 * Otterblade Odyssey Branding
 * Core brand identity, visual style, and narrative guidance
 */

export const brand = {
  name: 'Otterblade Odyssey',
  tagline: 'Zephyros Rising',

  // Visual identity
  identity: {
    // Warm, brave, hopeful, "cozy-but-heroic"
    mood: ['warm', 'brave', 'hopeful', 'cozy-heroic'] as const,

    // Materials: moss, stone, lantern light, cloth, leather, iron
    materials: ['moss', 'stone', 'lantern-light', 'cloth', 'leather', 'iron'] as const,

    // Storytelling: wordless narrative (British pantomime tradition)
    storytelling: 'wordless-narrative' as const,
  },

  // World identity
  world: {
    name: 'Willowmere',
    location: 'The Hearthhold',
    protagonist: 'Finn the Otter',
    antagonist: 'Zephyros',
    legacy: 'The Otterblade',
    regions: ['Willowmere', 'Willow Banks', 'The Hearthhold', 'The Great Hearth'] as const,
  },

  // Visual style guide
  style: {
    // REQUIRED
    required: [
      'Anthropomorphic woodland animals ONLY',
      'Warm storybook aesthetic',
      'Moss, stone, lantern light',
      'Protagonist: Finn the otter warrior',
      'Willowmere Hearthhold setting',
    ],

    // FORBIDDEN
    forbidden: [
      'Human characters (NO knights, villagers, soldiers)',
      'Neon, sci-fi, or horror elements',
      'Glowing energy weapons or magic beams',
      'Anime/JRPG styling',
    ],
  },

  // Emotional core
  themes: {
    warmth: 'Warmth of hearth against darkness',
    responsibility: 'Weight of inherited responsibility',
    community: 'Simple joy of home and community',
    courage: 'Courage of youth answering the call',
  },
} as const;

export const chapters = [
  { id: 0, name: 'The Calling', location: "Finn's Cottage", quest: 'Answer the Call' },
  { id: 1, name: 'River Path', location: 'Willow Banks', quest: 'Reach the Gatehouse' },
  { id: 2, name: 'The Gatehouse', location: 'Northern Gate', quest: 'Cross the Threshold' },
  { id: 3, name: 'Great Hall', location: 'Central Hearthhold', quest: 'Take the Oath' },
  { id: 4, name: 'The Archives', location: 'Library Spire', quest: 'Find the Ancient Map' },
  {
    id: 5,
    name: 'Deep Cellars',
    location: 'Underground Passages',
    quest: 'Descend into the Depths',
  },
  { id: 6, name: 'Kitchen Gardens', location: 'Southern Grounds', quest: 'Rally the Defenders' },
  { id: 7, name: 'Bell Tower', location: 'Highest Spire', quest: 'Sound the Alarm' },
  { id: 8, name: "Storm's Edge", location: 'Outer Ramparts', quest: 'Face Zephyros' },
  { id: 9, name: 'New Dawn', location: 'The Great Hearth', quest: 'The Everember Rekindled' },
] as const;
