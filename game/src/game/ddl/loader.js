export const CHAPTERS = [
  { id: 0, name: "The Calling", location: "Finn's Cottage", quest: "Answer the Call" },
  { id: 1, name: "River Path", location: "Willow Banks", quest: "Reach the Gatehouse" },
  { id: 2, name: "The Gatehouse", location: "Northern Gate", quest: "Cross the Threshold" },
  { id: 3, name: "Great Hall", location: "Central Hearthhold", quest: "Take the Oath" },
  { id: 4, name: "The Archives", location: "Library Spire", quest: "Find the Ancient Map" },
  { id: 5, name: "Deep Cellars", location: "Underground Passages", quest: "Descend into the Depths" },
  { id: 6, name: "Kitchen Gardens", location: "Southern Grounds", quest: "Rally the Defenders" },
  { id: 7, name: "Bell Tower", location: "Highest Spire", quest: "Sound the Alarm" },
  { id: 8, name: "Storm's Edge", location: "Outer Ramparts", quest: "Face Zephyros" },
  { id: 9, name: "New Dawn", location: "The Great Hearth", quest: "The Everember Rekindled" }
];

export async function loadChapter(chapterId) {
  const chapter = CHAPTERS[chapterId];
  if (!chapter) return null;
  
  // Generate simple procedural level
  const level = {
    id: chapterId,
    ...chapter,
    platforms: generatePlatforms(chapterId),
    enemies: generateEnemies(chapterId),
    collectibles: generateCollectibles(chapterId),
    exitX: 1800
  };
  
  return level;
}

function generatePlatforms(chapterId) {
  const platforms = [];
  
  // Ground
  platforms.push({ x: 900, y: 550, width: 1800, height: 50, solid: true });
  
  // Platforms increase in complexity per chapter
  const platformCount = 3 + chapterId;
  for (let i = 0; i < platformCount; i++) {
    platforms.push({
      x: 200 + i * 250,
      y: 450 - (i % 3) * 80,
      width: 150,
      height: 20,
      solid: true
    });
  }
  
  return platforms;
}

function generateEnemies(chapterId) {
  const enemies = [];
  const enemyCount = Math.min(chapterId + 1, 5);
  
  for (let i = 0; i < enemyCount; i++) {
    enemies.push({
      x: 400 + i * 300,
      y: 400,
      type: 'galeborn',
      hp: 25,
      damage: 8
    });
  }
  
  return enemies;
}

function generateCollectibles(chapterId) {
  const collectibles = [];
  const shardCount = 3 + Math.floor(chapterId / 2);
  
  for (let i = 0; i < shardCount; i++) {
    collectibles.push({
      x: 300 + i * 200,
      y: 350,
      type: 'shard'
    });
  }
  
  return collectibles;
}
