import { CHAPTERS, STORY_EVENTS } from '../constants';
import { queries, world } from './world';
export function initializeStory() {
    const existingStory = [...queries.story];
    if (existingStory.length > 0) {
        return existingStory[0];
    }
    const storyEntity = world.add({
        position: { x: 0, y: 0, z: 0 },
        story: {
            currentChapter: 0,
            chaptersCompleted: [],
            bossesDefeated: [],
            totalShards: 0,
        },
    });
    initializeChapters();
    return storyEntity;
}
function initializeChapters() {
    for (const chapter of CHAPTERS) {
        world.add({
            position: { x: 0, y: 0, z: 0 },
            chapter: {
                id: chapter.id,
                data: chapter,
                isActive: chapter.id === 0,
                isCompleted: false,
            },
        });
    }
}
export function startChapter(chapterId) {
    const storyEntity = [...queries.story][0];
    if (!storyEntity)
        return;
    const chapter = CHAPTERS[chapterId];
    if (!chapter)
        return;
    for (const chapterEntity of queries.chapters) {
        if (chapterEntity.chapter.id === chapterId) {
            chapterEntity.chapter.isActive = true;
            chapterEntity.chapter.startTime = performance.now();
        }
        else {
            chapterEntity.chapter.isActive = false;
        }
    }
    storyEntity.story.currentChapter = chapterId;
    world.add({
        position: { x: 0, y: 0, z: 0 },
        storyEvent: {
            type: STORY_EVENTS.CHAPTER_START,
            chapterId,
            timestamp: performance.now(),
            data: { chapterName: chapter.name, quest: chapter.quest },
        },
    });
    if (chapterId === 0) {
        startCutscene('intro', chapterId, 8000);
    }
    else {
        startCutscene('chapter_plate', chapterId, 3000);
    }
    world.add({
        position: { x: 0, y: 0, z: 0 },
        narrative: {
            questText: chapter.quest,
            chapterName: chapter.name,
            setting: chapter.setting,
        },
    });
}
export function completeChapter(chapterId) {
    const storyEntity = [...queries.story][0];
    if (!storyEntity)
        return;
    for (const chapterEntity of queries.chapters) {
        if (chapterEntity.chapter.id === chapterId) {
            chapterEntity.chapter.isCompleted = true;
            chapterEntity.chapter.completionTime = performance.now();
        }
    }
    if (!storyEntity.story.chaptersCompleted.includes(chapterId)) {
        storyEntity.story.chaptersCompleted.push(chapterId);
    }
    world.add({
        position: { x: 0, y: 0, z: 0 },
        storyEvent: {
            type: STORY_EVENTS.CHAPTER_COMPLETE,
            chapterId,
            timestamp: performance.now(),
        },
    });
    const nextChapterId = chapterId + 1;
    if (nextChapterId < CHAPTERS.length) {
        startChapter(nextChapterId);
    }
    else {
        startCutscene('outro', chapterId, 8000);
    }
}
export function startCutscene(type, chapterId, duration) {
    const cutsceneEntity = world.add({
        position: { x: 0, y: 0, z: 0 },
        cutscene: {
            type,
            chapterId,
            duration,
            startTime: performance.now(),
            isPlaying: true,
        },
    });
    world.add({
        position: { x: 0, y: 0, z: 0 },
        storyEvent: {
            type: STORY_EVENTS.CUTSCENE_START,
            chapterId,
            timestamp: performance.now(),
            data: { cutsceneType: type, duration },
        },
    });
    return cutsceneEntity;
}
export function endCutscene(cutsceneEntity) {
    if (!cutsceneEntity.cutscene)
        return;
    cutsceneEntity.cutscene.isPlaying = false;
    world.add({
        position: { x: 0, y: 0, z: 0 },
        storyEvent: {
            type: STORY_EVENTS.CUTSCENE_END,
            chapterId: cutsceneEntity.cutscene.chapterId,
            timestamp: performance.now(),
            data: { cutsceneType: cutsceneEntity.cutscene.type },
        },
    });
}
export function triggerBossEncounter(chapterId, bossName) {
    world.add({
        position: { x: 0, y: 0, z: 0 },
        storyEvent: {
            type: STORY_EVENTS.BOSS_ENCOUNTER,
            chapterId,
            timestamp: performance.now(),
            data: { bossName },
        },
    });
    startCutscene('boss_intro', chapterId, 2000);
}
export function defeatBoss(chapterId, bossName) {
    const storyEntity = [...queries.story][0];
    if (!storyEntity)
        return;
    if (!storyEntity.story.bossesDefeated.includes(bossName)) {
        storyEntity.story.bossesDefeated.push(bossName);
    }
    world.add({
        position: { x: 0, y: 0, z: 0 },
        storyEvent: {
            type: STORY_EVENTS.BOSS_DEFEATED,
            chapterId,
            timestamp: performance.now(),
            data: { bossName },
        },
    });
    startCutscene('boss_defeat', chapterId, 3000);
}
export function updateCutscenes() {
    const now = performance.now();
    const toEnd = [];
    for (const cutscene of queries.playingCutscenes) {
        const elapsed = now - cutscene.cutscene.startTime;
        if (elapsed >= cutscene.cutscene.duration) {
            toEnd.push(cutscene);
        }
    }
    for (const entity of toEnd) {
        endCutscene(entity);
    }
}
export function cleanupStoryEvents() {
    const now = performance.now();
    const oldEvents = [];
    for (const event of queries.storyEvents) {
        if (now - event.storyEvent.timestamp > 5000) {
            oldEvents.push(event);
        }
    }
    for (const entity of oldEvents) {
        world.remove(entity);
    }
}
export function getCurrentChapter() {
    const storyEntity = [...queries.story][0];
    if (!storyEntity)
        return null;
    return CHAPTERS[storyEntity.story.currentChapter] || null;
}
export function getChapterProgress() {
    const storyEntity = [...queries.story][0];
    if (!storyEntity) {
        return { current: 0, total: CHAPTERS.length, completed: [] };
    }
    return {
        current: storyEntity.story.currentChapter,
        total: CHAPTERS.length,
        completed: storyEntity.story.chaptersCompleted,
    };
}
export function isInCutscene() {
    return [...queries.playingCutscenes].length > 0;
}
export function getActiveCutscene() {
    const playing = [...queries.playingCutscenes];
    return playing.length > 0 ? playing[0].cutscene : null;
}
export function storySystemTick() {
    updateCutscenes();
    cleanupStoryEvents();
}
