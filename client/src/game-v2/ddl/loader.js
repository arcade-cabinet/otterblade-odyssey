/**
 * DDL Manifest Loader - Reads chapter JSON files
 */

export class ManifestLoader {
  constructor() {
    this.manifests = new Map();
    this.chapterSlugs = [
      'the-calling',
      'river-path', 
      'gatehouse',
      'great-hall',
      'archives',
      'deep-cellars',
      'kitchen-gardens',
      'bell-tower',
      'storms-edge',
      'new-dawn'
    ];
  }

  async loadChapter(chapterId) {
    if (this.manifests.has(chapterId)) {
      return this.manifests.get(chapterId);
    }

    const slug = this.chapterSlugs[chapterId];
    const path = `/src/data/manifests/chapters/chapter-${chapterId}-${slug}.json`;

    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const manifest = await response.json();
      this.manifests.set(chapterId, manifest);
      console.log(`📜 Loaded manifest: ${manifest.name}`);
      return manifest;
    } catch (error) {
      console.warn(`⚠️ Failed to load chapter ${chapterId}, using fallback`);
      return this.getFallbackManifest(chapterId);
    }
  }

  async loadAllChapters() {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(this.loadChapter(i));
    }
    await Promise.all(promises);
    console.log('✅ All 10 chapters loaded');
  }

  getFallbackManifest(id) {
    const names = [
      'The Calling', 'River Path', 'The Gatehouse', 
      'Great Hall', 'The Archives', 'Deep Cellars',
      'Kitchen Gardens', 'Bell Tower', "Storm's Edge", 'New Dawn'
    ];

    const quests = [
      'Answer the Call', 'Reach the Gatehouse', 'Cross the Threshold',
      'Defend the Great Hall', 'Find the Ancient Map', 'Descend into the Depths',
      'Rally the Defenders', 'Ascend to the Bells', 'Reach Zephyros', 'A New Dawn'
    ];

    const locations = [
      "Finn's Cottage", 'River Path', 'Abbey Gatehouse',
      'Main Hall', 'Abbey Library', 'Underground Cellars',
      'Courtyard', 'Bell Tower', 'Storm Peak', 'Victory Hall'
    ];

    // Simple procedural level generation
    const platforms = [];
    const groundY = 450;
    const platformSpacing = 250;

    // Ground platform
    platforms.push({
      x: 0, y: groundY, width: 2000, height: 50, type: 'ground'
    });

    // Floating platforms - gets progressively higher
    for (let i = 1; i <= 5; i++) {
      platforms.push({
        x: i * platformSpacing,
        y: groundY - (i * 50),
        width: 150,
        height: 20,
        type: 'platform'
      });
    }

    return {
      id,
      name: names[id] || `Chapter ${id}`,
      location: locations[id] || 'Unknown',
      narrative: {
        theme: 'Adventure awaits',
        quest: quests[id] || 'Complete the chapter',
      },
      connections: {
        previousChapter: id > 0 ? id - 1 : null,
        nextChapter: id < 9 ? id + 1 : null,
        transitionIn: {
          type: 'spawn',
          playerSpawnPoint: { x: 200, y: 300 }
        },
        transitionOut: {
          type: 'portal',
          exitPoint: { x: 1800, y: 400 }
        }
      },
      levelDefinition: {
        biome: this.getBiome(id),
        boundaries: platforms,
        segments: [],
        enemySpawns: this.getEnemySpawns(id),
        collectibles: this.getCollectibles(id)
      }
    };
  }

  getBiome(id) {
    if (id <= 1) return 'forest';
    if (id <= 3) return 'abbey';
    if (id <= 5) return 'dungeon';
    if (id <= 7) return 'abbey';
    return 'mountains';
  }

  getEnemySpawns(id) {
    // More enemies in later chapters
    const count = Math.min(id + 2, 8);
    const spawns = [];

    for (let i = 0; i < count; i++) {
      spawns.push({
        x: 400 + i * 200,
        y: 300,
        type: 'scout',
        behaviorPattern: 'patrol'
      });
    }

    // Boss fight in chapters 3, 5, 8
    if ([3, 5, 8].includes(id)) {
      spawns.push({
        x: 1500,
        y: 350,
        type: 'boss',
        behaviorPattern: 'aggressive'
      });
    }

    return spawns;
  }

  getCollectibles(id) {
    const collectibles = [];
    
    // Scatter ember shards throughout level
    for (let i = 0; i < 10; i++) {
      collectibles.push({
        type: 'shard',
        x: 300 + i * 150,
        y: 200 + Math.sin(i) * 100
      });
    }

    return collectibles;
  }
}
