/**
 * Tests for Quest System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QuestSystem } from '../quest-system.js';

describe('QuestSystem', () => {
  let questSystem;
  let sampleManifest;

  beforeEach(() => {
    questSystem = new QuestSystem();
    
    sampleManifest = {
      quests: [
        {
          id: 'quest-1',
          name: 'Test Quest',
          description: 'A test quest',
          objectives: [
            { id: 'obj-1', description: 'Objective 1', required: 3 },
            { id: 'obj-2', description: 'Objective 2', required: 1 }
          ],
          rewards: [
            { type: 'shards', amount: 5 }
          ],
          optional: false
        },
        {
          id: 'quest-2',
          name: 'Optional Quest',
          description: 'An optional quest',
          objectives: [
            { id: 'obj-3', description: 'Optional objective', required: 5 }
          ],
          rewards: [],
          optional: true
        }
      ]
    };
  });

  describe('registerQuests()', () => {
    it('should register quests from manifest', () => {
      questSystem.registerQuests(sampleManifest);
      
      expect(questSystem.questDefinitions.size).toBe(2);
      expect(questSystem.questDefinitions.has('quest-1')).toBe(true);
      expect(questSystem.questDefinitions.has('quest-2')).toBe(true);
    });

    it('should handle empty manifest', () => {
      questSystem.registerQuests({});
      expect(questSystem.questDefinitions.size).toBe(0);
    });
  });

  describe('startQuest()', () => {
    beforeEach(() => {
      questSystem.registerQuests(sampleManifest);
    });

    it('should start a quest', () => {
      const quest = questSystem.startQuest('quest-1');
      
      expect(quest).not.toBeNull();
      expect(quest.id).toBe('quest-1');
      expect(quest.objectives.length).toBe(2);
      expect(questSystem.activeQuests.length).toBe(1);
    });

    it('should initialize objectives with current=0', () => {
      const quest = questSystem.startQuest('quest-1');
      
      expect(quest.objectives[0].current).toBe(0);
      expect(quest.objectives[0].completed).toBe(false);
    });

    it('should not start already active quest', () => {
      questSystem.startQuest('quest-1');
      const result = questSystem.startQuest('quest-1');
      
      expect(result).toBeNull();
      expect(questSystem.activeQuests.length).toBe(1);
    });

    it('should not start completed quest', () => {
      questSystem.startQuest('quest-1');
      questSystem.completeQuest('quest-1');
      
      const result = questSystem.startQuest('quest-1');
      expect(result).toBeNull();
    });

    it('should return null for non-existent quest', () => {
      const result = questSystem.startQuest('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('updateObjective()', () => {
    beforeEach(() => {
      questSystem.registerQuests(sampleManifest);
      questSystem.startQuest('quest-1');
    });

    it('should update objective progress', () => {
      questSystem.updateObjective('quest-1', 'obj-1', 1);
      
      const quest = questSystem.getActiveQuest('quest-1');
      expect(quest.objectives[0].current).toBe(1);
    });

    it('should mark objective as completed when required met', () => {
      questSystem.updateObjective('quest-1', 'obj-1', 3);
      
      const quest = questSystem.getActiveQuest('quest-1');
      expect(quest.objectives[0].completed).toBe(true);
    });

    it('should not exceed required amount', () => {
      questSystem.updateObjective('quest-1', 'obj-1', 10);
      
      const quest = questSystem.getActiveQuest('quest-1');
      expect(quest.objectives[0].current).toBe(3); // Clamped to required
    });

    it('should complete quest when all objectives done', () => {
      questSystem.updateObjective('quest-1', 'obj-1', 3);
      questSystem.updateObjective('quest-1', 'obj-2', 1);
      
      expect(questSystem.isQuestCompleted('quest-1')).toBe(true);
      expect(questSystem.isQuestActive('quest-1')).toBe(false);
    });

    it('should not update completed objective', () => {
      questSystem.updateObjective('quest-1', 'obj-1', 3);
      questSystem.updateObjective('quest-1', 'obj-1', 1);
      
      const quest = questSystem.getActiveQuest('quest-1');
      expect(quest.objectives[0].current).toBe(3);
    });
  });

  describe('completeQuest()', () => {
    beforeEach(() => {
      questSystem.registerQuests(sampleManifest);
      questSystem.startQuest('quest-1');
    });

    it('should complete quest and return rewards', () => {
      const rewards = questSystem.completeQuest('quest-1');
      
      expect(rewards).toEqual([{ type: 'shards', amount: 5 }]);
      expect(questSystem.completedQuests).toContain('quest-1');
      expect(questSystem.activeQuests).not.toContain('quest-1');
    });

    it('should return null for non-existent quest', () => {
      const rewards = questSystem.completeQuest('non-existent');
      expect(rewards).toBeNull();
    });
  });

  describe('getQuestProgress()', () => {
    beforeEach(() => {
      questSystem.registerQuests(sampleManifest);
      questSystem.startQuest('quest-1');
    });

    it('should return 0% for new quest', () => {
      const progress = questSystem.getQuestProgress('quest-1');
      expect(progress).toBe(0);
    });

    it('should return 50% when half objectives complete', () => {
      questSystem.updateObjective('quest-1', 'obj-1', 3);
      
      const progress = questSystem.getQuestProgress('quest-1');
      expect(progress).toBe(50);
    });

    it('should return 100% when all objectives complete', () => {
      questSystem.updateObjective('quest-1', 'obj-1', 3);
      questSystem.updateObjective('quest-1', 'obj-2', 1);
      
      const progress = questSystem.getQuestProgress('quest-1');
      expect(progress).toBe(100);
    });

    it('should return 0 for non-existent quest', () => {
      const progress = questSystem.getQuestProgress('non-existent');
      expect(progress).toBe(0);
    });
  });

  describe('abandonQuest()', () => {
    beforeEach(() => {
      questSystem.registerQuests(sampleManifest);
    });

    it('should abandon optional quest', () => {
      questSystem.startQuest('quest-2');
      const result = questSystem.abandonQuest('quest-2');
      
      expect(result).toBe(true);
      expect(questSystem.activeQuests).not.toContain('quest-2');
    });

    it('should not abandon required quest', () => {
      questSystem.startQuest('quest-1');
      const result = questSystem.abandonQuest('quest-1');
      
      expect(result).toBe(false);
      expect(questSystem.activeQuests).toContain('quest-1');
    });

    it('should return false for non-existent quest', () => {
      const result = questSystem.abandonQuest('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('serialize/deserialize()', () => {
    beforeEach(() => {
      questSystem.registerQuests(sampleManifest);
      questSystem.startQuest('quest-1');
      questSystem.updateObjective('quest-1', 'obj-1', 2);
    });

    it('should serialize state', () => {
      const state = questSystem.serialize();
      
      expect(state.activeQuests).toHaveLength(1);
      expect(state.activeQuests[0].id).toBe('quest-1');
      expect(state.activeQuests[0].objectives[0].current).toBe(2);
    });

    it('should deserialize state', () => {
      const state = questSystem.serialize();
      
      const newQuestSystem = new QuestSystem();
      newQuestSystem.deserialize(state);
      
      expect(newQuestSystem.activeQuests).toHaveLength(1);
      expect(newQuestSystem.activeQuests[0].id).toBe('quest-1');
      expect(newQuestSystem.activeQuests[0].objectives[0].current).toBe(2);
    });
  });

  describe('clear()', () => {
    beforeEach(() => {
      questSystem.registerQuests(sampleManifest);
      questSystem.startQuest('quest-1');
    });

    it('should clear all quests', () => {
      questSystem.clear();
      
      expect(questSystem.activeQuests).toHaveLength(0);
      expect(questSystem.completedQuests).toHaveLength(0);
      expect(questSystem.questDefinitions.size).toBe(0);
    });
  });
});
