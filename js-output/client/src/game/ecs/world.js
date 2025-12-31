import { World } from 'miniplex';
import createReactAPI from 'miniplex-react';
export const world = new World();
export const ECS = createReactAPI(world);
export const queries = {
    players: world.with('player', 'position'),
    enemies: world.with('enemy', 'position'),
    bosses: world.with('boss', 'position', 'health'),
    moving: world.with('position', 'velocity'),
    sprites: world.with('sprite', 'position'),
    parallaxLayers: world.with('parallax', 'sprite'),
    platforms: world.with('platform', 'position'),
    checkpoints: world.with('checkpoint', 'position'),
    shards: world.with('shard', 'position'),
    withHealth: world.with('health'),
    dead: world.with('dead'),
    controlled: world.with('controls', 'velocity'),
    story: world.with('story'),
    chapters: world.with('chapter'),
    activeChapter: world.with('chapter').where((e) => e.chapter.isActive),
    cutscenes: world.with('cutscene'),
    playingCutscenes: world.with('cutscene').where((e) => e.cutscene.isPlaying),
    storyEvents: world.with('storyEvent'),
    narratives: world.with('narrative'),
};
