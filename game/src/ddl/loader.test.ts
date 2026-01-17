/**
 * Unit tests for DDL manifest loader
 * Tests cover caching, validation, error handling, and all manifest types
 */

import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ALL_CHAPTER_IDS,
  clearManifestCache,
  getCacheStats,
  getChapterManifestSync,
  getEnemiesManifestSync,
  getNPCsManifestSync,
  isValidChapterId,
  loadChapterManifest,
  loadChapterPlatesManifest,
  loadCinematicsManifest,
  loadEffectsManifest,
  loadEnemiesManifest,
  loadItemsManifest,
  loadNPCsManifest,
  loadScenesManifest,
  loadSoundsManifest,
  loadSpritesManifest,
  preloadManifests,
  TOTAL_CHAPTERS,
} from './loader';

// Mock fetch globally with proper typing
const mockFetch = vi.fn() as Mock;
global.fetch = mockFetch;

describe('DDL Loader - Cache Management', () => {
  beforeEach(() => {
    clearManifestCache();
    vi.clearAllMocks();
  });

  it('should start with empty cache', () => {
    const stats = getCacheStats();
    expect(stats.size).toBe(0);
    expect(stats.keys).toEqual([]);
  });

  it('should cache manifests after loading', async () => {
    const mockData = {
      id: 0,
      name: 'The Calling',
      location: 'Test',
      narrative: {
        theme: 'test',
        quest: 'test quest',
        emotionalArc: {
          opening: 'test',
          midpoint: 'test',
          climax: 'test',
          resolution: 'test',
        },
        storyBeats: [],
      },
      connections: {
        previousChapter: null,
        nextChapter: 1,
      },
      level: {
        bounds: { startX: 0, endX: 1000, minY: 0, maxY: 600 },
        biome: 'forest',
        spawnPoint: { x: 100, y: 450 },
        segments: [],
      },
      media: {
        chapterPlate: 'test.png',
        parallaxBackground: 'test-bg.png',
      },
      environment: {
        lighting: {
          ambientColor: '#FFFFFF',
          ambientIntensity: 0.8,
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    await loadChapterManifest(0);

    const stats = getCacheStats();
    expect(stats.size).toBe(1);
    expect(stats.keys).toContain('chapters/chapter-0-the-calling.json');
  });

  it('should not refetch cached manifests', async () => {
    const mockData = {
      id: 0,
      name: 'The Calling',
      location: 'Test',
      narrative: {
        theme: 'test',
        quest: 'test quest',
        emotionalArc: {
          opening: 'test',
          midpoint: 'test',
          climax: 'test',
          resolution: 'test',
        },
        storyBeats: [],
      },
      connections: {
        previousChapter: null,
        nextChapter: 1,
      },
      level: {
        bounds: { startX: 0, endX: 1000, minY: 0, maxY: 600 },
        biome: 'forest',
        spawnPoint: { x: 100, y: 450 },
        segments: [],
      },
      media: {
        chapterPlate: 'test.png',
        parallaxBackground: 'test-bg.png',
      },
      environment: {
        lighting: {
          ambientColor: '#FFFFFF',
          ambientIntensity: 0.8,
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    // First load
    await loadChapterManifest(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Second load should use cache
    await loadChapterManifest(0);
    expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1, not 2
  });

  it('should clear cache when requested', async () => {
    const mockData = {
      category: 'enemies',
      assets: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    await loadEnemiesManifest();
    expect(getCacheStats().size).toBe(1);

    clearManifestCache();
    expect(getCacheStats().size).toBe(0);
  });
});

describe('DDL Loader - Chapter Loading', () => {
  beforeEach(() => {
    clearManifestCache();
    vi.clearAllMocks();
  });

  it('should reject invalid chapter IDs', async () => {
    await expect(loadChapterManifest(-1)).rejects.toThrow('Invalid chapter ID: -1');
    await expect(loadChapterManifest(10)).rejects.toThrow('Invalid chapter ID: 10');
    await expect(loadChapterManifest(NaN)).rejects.toThrow('Invalid chapter ID');
    await expect(loadChapterManifest('foo' as unknown as number)).rejects.toThrow(
      'Invalid chapter ID'
    );
  });

  it('should validate chapter ID helper', () => {
    expect(isValidChapterId(0)).toBe(true);
    expect(isValidChapterId(9)).toBe(true);
    expect(isValidChapterId(-1)).toBe(false);
    expect(isValidChapterId(10)).toBe(false);
    expect(isValidChapterId(5.5)).toBe(false);
    expect(isValidChapterId(NaN)).toBe(false);
  });

  it('should export chapter constants', () => {
    expect(ALL_CHAPTER_IDS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(TOTAL_CHAPTERS).toBe(10);
  });

  it('should throw error for 404 responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(loadChapterManifest(0)).rejects.toThrow(
      'Failed to fetch manifest at /data/manifests/chapters/chapter-0-the-calling.json: 404 Not Found'
    );
  });

  it('should throw error for invalid JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    });

    await expect(loadChapterManifest(0)).rejects.toThrow('Invalid JSON in manifest');
  });

  it('should throw error for network failures', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(loadChapterManifest(0)).rejects.toThrow('Failed to load manifest');
  });

  it('should throw error if sync accessor called before preload', () => {
    expect(() => getChapterManifestSync(0)).toThrow(
      'Chapter 0 not loaded. Call preloadManifests()'
    );
  });
});

describe('DDL Loader - Schema Validation', () => {
  beforeEach(() => {
    clearManifestCache();
    vi.clearAllMocks();
  });

  it('should reject chapter manifest with missing required fields', async () => {
    const invalidData = {
      id: 0,
      // Missing name, location, narrative, etc.
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => invalidData,
    });

    await expect(loadChapterManifest(0)).rejects.toThrow('Invalid chapter-0 manifest');
  });

  it('should reject chapter manifest with wrong types', async () => {
    const invalidData = {
      id: 'zero', // Should be number
      name: 'The Calling',
      location: 'Test',
      narrative: {},
      connections: {},
      level: {},
      media: {},
      environment: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => invalidData,
    });

    await expect(loadChapterManifest(0)).rejects.toThrow('Invalid chapter-0 manifest');
  });

  it('should reject enemies manifest with wrong category', async () => {
    const invalidData = {
      category: 'wrong',
      assets: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => invalidData,
    });

    await expect(loadEnemiesManifest()).rejects.toThrow('Invalid enemies manifest');
  });

  it('should reject enemies manifest with malformed assets', async () => {
    const invalidData = {
      category: 'enemies',
      assets: [
        {
          id: 'enemy1',
          // Missing required fields: name, filename, status, type
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => invalidData,
    });

    await expect(loadEnemiesManifest()).rejects.toThrow('Invalid enemies manifest');
  });

  it('should reject NPCs manifest with missing species data', async () => {
    const invalidData = {
      category: 'npcs',
      version: '1.0.0',
      description: 'Test',
      // Missing species field
      npcs: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => invalidData,
    });

    await expect(loadNPCsManifest()).rejects.toThrow('Invalid NPCs manifest');
  });
});

describe('DDL Loader - Entity Manifests', () => {
  beforeEach(() => {
    clearManifestCache();
    vi.clearAllMocks();
  });

  it('should load and validate enemies manifest', async () => {
    const mockData = {
      category: 'enemies',
      assets: [
        {
          id: 'enemy_scout',
          name: 'Scout',
          filename: 'scout.png',
          status: 'complete',
          type: 'sprite_sheet',
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await loadEnemiesManifest();
    expect(result.category).toBe('enemies');
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].id).toBe('enemy_scout');
  });

  it('should load and validate NPCs manifest', async () => {
    const mockData = {
      category: 'npcs',
      version: '1.0.0',
      description: 'Test NPCs',
      species: {
        otter: {
          description: 'Brave otters',
          physique: 'Sleek',
          personality: ['brave'],
          roles: ['warrior'],
          colors: { fur: ['#5D4E37'] },
        },
      },
      npcs: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await loadNPCsManifest();
    expect(result.category).toBe('npcs');
    expect(result.version).toBe('1.0.0');
    expect(result.species.otter).toBeDefined();
  });

  it('should throw if sync accessor called before load', () => {
    expect(() => getEnemiesManifestSync()).toThrow('Enemies manifest not loaded');
    expect(() => getNPCsManifestSync()).toThrow('NPCs manifest not loaded');
  });
});

describe('DDL Loader - Asset Manifests', () => {
  beforeEach(() => {
    clearManifestCache();
    vi.clearAllMocks();
  });

  const testAssetManifest = (
    loader: () => Promise<unknown>,
    category: string,
    _filename: string
  ) => {
    it(`should load ${category} manifest`, async () => {
      const mockData = {
        category,
        assets: [
          {
            id: `${category}_test`,
            name: 'Test Asset',
            filename: 'test.png',
            status: 'complete',
            type: 'image',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await loader();
      expect(result.category).toBe(category);
      expect(result.assets).toHaveLength(1);
    });
  };

  testAssetManifest(loadSpritesManifest, 'sprites', 'sprites.json');
  testAssetManifest(loadCinematicsManifest, 'cinematics', 'cinematics.json');
  testAssetManifest(loadSoundsManifest, 'sounds', 'sounds.json');
  testAssetManifest(loadEffectsManifest, 'effects', 'effects.json');
  testAssetManifest(loadItemsManifest, 'items', 'items.json');
  testAssetManifest(loadScenesManifest, 'scenes', 'scenes.json');
  testAssetManifest(loadChapterPlatesManifest, 'chapter-plates', 'chapter-plates.json');
});

describe('DDL Loader - Preload System', () => {
  beforeEach(() => {
    clearManifestCache();
    vi.clearAllMocks();
  });

  it('should preload all manifests in parallel', async () => {
    // Mock all manifests
    mockFetch.mockImplementation((url: string) => {
      const mockData: Record<string, unknown> = {};

      if (url.includes('chapter-')) {
        mockData.id = 0;
        mockData.name = 'Test';
        mockData.location = 'Test';
        mockData.narrative = {
          theme: 'test',
          quest: 'test',
          emotionalArc: {
            opening: 'test',
            midpoint: 'test',
            climax: 'test',
            resolution: 'test',
          },
          storyBeats: [],
        };
        mockData.connections = { previousChapter: null, nextChapter: 1 };
        mockData.level = {
          bounds: { startX: 0, endX: 1000, minY: 0, maxY: 600 },
          biome: 'forest',
          spawnPoint: { x: 100, y: 450 },
          segments: [],
        };
        mockData.media = {
          chapterPlate: 'test.png',
          parallaxBackground: 'test-bg.png',
        };
        mockData.environment = {
          lighting: { ambientColor: '#FFFFFF', ambientIntensity: 0.8 },
        };
      } else if (url.includes('enemies.json')) {
        mockData.category = 'enemies';
        mockData.assets = [];
      } else if (url.includes('npcs.json')) {
        mockData.category = 'npcs';
        mockData.version = '1.0.0';
        mockData.description = 'Test';
        mockData.species = {};
        mockData.npcs = [];
      } else {
        const category = url.split('/').pop()?.replace('.json', '') || 'unknown';
        mockData.category = category;
        mockData.assets = [];
      }

      return Promise.resolve({
        ok: true,
        json: async () => mockData,
      });
    });

    await preloadManifests({ logProgress: false });

    const stats = getCacheStats();
    // 10 chapters + enemies + npcs + 7 asset manifests = 19
    expect(stats.size).toBe(19);
  });

  it('should support selective preloading', async () => {
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          category: 'enemies',
          assets: [],
        }),
      });
    });

    await preloadManifests({
      manifestTypes: ['enemies'],
      logProgress: false,
    });

    const stats = getCacheStats();
    expect(stats.size).toBe(1);
    expect(stats.keys).toContain('enemies.json');
  });

  it('should not throw on individual failures when throwOnError=false', async () => {
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call (chapter 0) fails
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        });
      }
      // Subsequent calls succeed
      return Promise.resolve({
        ok: true,
        json: async () => ({
          category: 'enemies',
          assets: [],
        }),
      });
    });

    // Should not throw
    await expect(
      preloadManifests({
        manifestTypes: ['enemies'],
        logProgress: false,
        throwOnError: false,
      })
    ).resolves.toBeUndefined();
  });

  it('should allow sync access after preload', async () => {
    const mockChapterData = {
      id: 0,
      name: 'The Calling',
      location: 'Test',
      narrative: {
        theme: 'test',
        quest: 'test quest',
        emotionalArc: {
          opening: 'test',
          midpoint: 'test',
          climax: 'test',
          resolution: 'test',
        },
        storyBeats: [],
      },
      connections: {
        previousChapter: null,
        nextChapter: 1,
      },
      level: {
        bounds: { startX: 0, endX: 1000, minY: 0, maxY: 600 },
        biome: 'forest',
        spawnPoint: { x: 100, y: 450 },
        segments: [],
      },
      media: {
        chapterPlate: 'test.png',
        parallaxBackground: 'test-bg.png',
      },
      environment: {
        lighting: {
          ambientColor: '#FFFFFF',
          ambientIntensity: 0.8,
        },
      },
    };

    const mockEnemiesData = {
      category: 'enemies',
      assets: [],
    };

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('chapter-0')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockChapterData,
        });
      } else if (url.includes('enemies.json')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockEnemiesData,
        });
      }
      throw new Error('Unexpected fetch');
    });

    await preloadManifests({
      manifestTypes: ['chapters', 'enemies'],
      logProgress: false,
    });

    // Should not throw
    const chapter = getChapterManifestSync(0);
    expect(chapter.name).toBe('The Calling');

    const enemies = getEnemiesManifestSync();
    expect(enemies.category).toBe('enemies');
  });
});
