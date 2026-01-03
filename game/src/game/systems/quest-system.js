/**
 * Quest System
 *
 * Manages quests, objectives, and rewards from DDL manifests.
 *
 * @module systems/quest-system
 */

/**
 * Quest System class
 */
export class QuestSystem {
  constructor() {
    this.activeQuests = [];
    this.completedQuests = [];
    this.questDefinitions = new Map();
  }

  /**
   * Register quest definitions from chapter manifest
   *
   * @param {Object} manifest - Chapter manifest
   */
  registerQuests(manifest) {
    if (!manifest || !manifest.quests) return;

    for (const questDef of manifest.quests) {
      this.questDefinitions.set(questDef.id, questDef);
    }
  }

  /**
   * Start a quest
   *
   * @param {string} questId - Quest ID
   * @returns {Object|null} Quest object or null if failed
   */
  startQuest(questId) {
    // Check if already active or completed
    if (this.isQuestActive(questId) || this.isQuestCompleted(questId)) {
      console.warn(`Quest ${questId} already active or completed`);
      return null;
    }

    const questDef = this.questDefinitions.get(questId);
    if (!questDef) {
      console.error(`Quest definition not found: ${questId}`);
      return null;
    }

    const quest = {
      id: questId,
      name: questDef.name,
      description: questDef.description,
      objectives: questDef.objectives.map((obj) => ({
        ...obj,
        current: 0,
        completed: false,
      })),
      rewards: questDef.rewards || [],
      optional: questDef.optional || false,
      startTime: Date.now(),
    };

    this.activeQuests.push(quest);

    return quest;
  }

  /**
   * Update objective progress
   *
   * @param {string} questId - Quest ID
   * @param {string} objectiveId - Objective ID
   * @param {number} amount - Amount to increment (default 1)
   */
  updateObjective(questId, objectiveId, amount = 1) {
    const quest = this.activeQuests.find((q) => q.id === questId);
    if (!quest) {
      console.warn(`Active quest not found: ${questId}`);
      return;
    }

    const objective = quest.objectives.find((obj) => obj.id === objectiveId);
    if (!objective) {
      console.warn(`Objective not found: ${objectiveId} in quest ${questId}`);
      return;
    }

    if (objective.completed) return;

    objective.current = Math.min(objective.current + amount, objective.required);

    if (objective.current >= objective.required) {
      objective.completed = true;
      this.checkQuestCompletion(questId);
    }
  }

  /**
   * Check if all objectives are completed
   * @private
   */
  checkQuestCompletion(questId) {
    const quest = this.activeQuests.find((q) => q.id === questId);
    if (!quest) return;

    const allCompleted = quest.objectives.every((obj) => obj.completed);

    if (allCompleted) {
      this.completeQuest(questId);
    }
  }

  /**
   * Complete a quest
   *
   * @param {string} questId - Quest ID
   * @returns {Object|null} Rewards or null
   */
  completeQuest(questId) {
    const questIndex = this.activeQuests.findIndex((q) => q.id === questId);
    if (questIndex === -1) {
      console.warn(`Active quest not found: ${questId}`);
      return null;
    }

    const quest = this.activeQuests[questIndex];

    // Move to completed
    this.activeQuests.splice(questIndex, 1);
    this.completedQuests.push(questId);

    return quest.rewards;
  }

  /**
   * Check if quest is active
   *
   * @param {string} questId - Quest ID
   * @returns {boolean}
   */
  isQuestActive(questId) {
    return this.activeQuests.some((q) => q.id === questId);
  }

  /**
   * Check if quest is completed
   *
   * @param {string} questId - Quest ID
   * @returns {boolean}
   */
  isQuestCompleted(questId) {
    return this.completedQuests.includes(questId);
  }

  /**
   * Get active quest by ID
   *
   * @param {string} questId - Quest ID
   * @returns {Object|null}
   */
  getActiveQuest(questId) {
    return this.activeQuests.find((q) => q.id === questId) || null;
  }

  /**
   * Get all active quests
   *
   * @returns {Array}
   */
  getAllActiveQuests() {
    return [...this.activeQuests];
  }

  /**
   * Get objective progress for a quest
   *
   * @param {string} questId - Quest ID
   * @returns {Array|null}
   */
  getObjectiveProgress(questId) {
    const quest = this.activeQuests.find((q) => q.id === questId);
    if (!quest) return null;

    return quest.objectives.map((obj) => ({
      id: obj.id,
      description: obj.description,
      current: obj.current,
      required: obj.required,
      completed: obj.completed,
      optional: obj.optional || false,
    }));
  }

  /**
   * Abandon a quest
   *
   * @param {string} questId - Quest ID
   * @returns {boolean} Success
   */
  abandonQuest(questId) {
    const questIndex = this.activeQuests.findIndex((q) => q.id === questId);
    if (questIndex === -1) return false;

    const quest = this.activeQuests[questIndex];

    // Can't abandon non-optional quests
    if (!quest.optional) {
      console.warn(`Cannot abandon required quest: ${questId}`);
      return false;
    }

    this.activeQuests.splice(questIndex, 1);
    return true;
  }

  /**
   * Get quest completion percentage
   *
   * @param {string} questId - Quest ID
   * @returns {number} Percentage (0-100)
   */
  getQuestProgress(questId) {
    const quest = this.activeQuests.find((q) => q.id === questId);
    if (!quest) return 0;

    const totalObjectives = quest.objectives.length;
    const completedObjectives = quest.objectives.filter((obj) => obj.completed).length;

    return Math.round((completedObjectives / totalObjectives) * 100);
  }

  /**
   * Serialize quest system state
   *
   * @returns {Object} Serialized state
   */
  serialize() {
    return {
      activeQuests: this.activeQuests,
      completedQuests: this.completedQuests,
    };
  }

  /**
   * Deserialize quest system state
   *
   * @param {Object} data - Serialized state
   */
  deserialize(data) {
    if (data.activeQuests) {
      this.activeQuests = data.activeQuests;
    }
    if (data.completedQuests) {
      this.completedQuests = data.completedQuests;
    }
  }

  /**
   * Clear all quests
   */
  clear() {
    this.activeQuests = [];
    this.completedQuests = [];
    this.questDefinitions.clear();
  }
}

// Export singleton instance
export const questSystem = new QuestSystem();
