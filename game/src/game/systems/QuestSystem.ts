/**
 * Quest System
 *
 * Manages quests, objectives, and rewards from DDL manifests.
 */

export interface QuestObjectiveDefinition {
  id: string;
  description: string;
  required: number;
  optional?: boolean;
}

export interface QuestDefinition {
  id: string;
  name: string;
  description?: string;
  objectives: QuestObjectiveDefinition[];
  rewards?: Array<Record<string, unknown>>;
  optional?: boolean;
}

export interface QuestState {
  id: string;
  name: string;
  description?: string;
  objectives: Array<QuestObjectiveDefinition & { current: number; completed: boolean }>;
  rewards: Array<Record<string, unknown>>;
  optional: boolean;
  startTime: number;
}

export interface QuestManifest {
  quests?: QuestDefinition[];
}

/**
 * Quest System class
 */
export class QuestSystem {
  activeQuests: QuestState[] = [];
  completedQuests: string[] = [];
  questDefinitions: Map<string, QuestDefinition> = new Map();

  /**
   * Register quest definitions from chapter manifest
   */
  registerQuests(manifest: QuestManifest): void {
    if (!manifest?.quests) return;

    for (const questDef of manifest.quests) {
      this.questDefinitions.set(questDef.id, questDef);
    }
  }

  /**
   * Start a quest
   */
  startQuest(questId: string): QuestState | null {
    if (this.isQuestActive(questId) || this.isQuestCompleted(questId)) {
      return null;
    }

    const questDef = this.questDefinitions.get(questId);
    if (!questDef) {
      return null;
    }

    const quest: QuestState = {
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
   */
  updateObjective(questId: string, objectiveId: string, amount: number = 1): void {
    const quest = this.activeQuests.find((q) => q.id === questId);
    if (!quest) return;

    const objective = quest.objectives.find((obj) => obj.id === objectiveId);
    if (!objective || objective.completed) return;

    objective.current = Math.min(objective.current + amount, objective.required);

    if (objective.current >= objective.required) {
      objective.completed = true;
      this.checkQuestCompletion(questId);
    }
  }

  /**
   * Complete a quest
   */
  completeQuest(questId: string): Array<Record<string, unknown>> | null {
    const questIndex = this.activeQuests.findIndex((q) => q.id === questId);
    if (questIndex === -1) {
      return null;
    }

    const quest = this.activeQuests[questIndex];
    this.activeQuests.splice(questIndex, 1);
    this.completedQuests.push(questId);
    return quest.rewards;
  }

  /**
   * Check if quest is active
   */
  isQuestActive(questId: string): boolean {
    return this.activeQuests.some((q) => q.id === questId);
  }

  /**
   * Check if quest is completed
   */
  isQuestCompleted(questId: string): boolean {
    return this.completedQuests.includes(questId);
  }

  /**
   * Get active quest by ID
   */
  getActiveQuest(questId: string): QuestState | null {
    return this.activeQuests.find((q) => q.id === questId) || null;
  }

  /**
   * Get all active quests
   */
  getAllActiveQuests(): QuestState[] {
    return [...this.activeQuests];
  }

  /**
   * Get objective progress for a quest
   */
  getObjectiveProgress(questId: string): Array<QuestObjectiveDefinition & { current: number; completed: boolean }> | null {
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
   */
  abandonQuest(questId: string): boolean {
    const questIndex = this.activeQuests.findIndex((q) => q.id === questId);
    if (questIndex === -1) return false;

    const quest = this.activeQuests[questIndex];
    if (!quest.optional) {
      return false;
    }

    this.activeQuests.splice(questIndex, 1);
    return true;
  }

  /**
   * Get quest completion percentage
   */
  getQuestProgress(questId: string): number {
    if (this.isQuestCompleted(questId)) {
      return 100;
    }

    const quest = this.activeQuests.find((q) => q.id === questId);
    if (!quest) return 0;

    const totalObjectives = quest.objectives.length;
    const completedObjectives = quest.objectives.filter((obj) => obj.completed).length;

    return Math.round((completedObjectives / totalObjectives) * 100);
  }

  /**
   * Serialize quest system state
   */
  serialize(): { activeQuests: QuestState[]; completedQuests: string[] } {
    return {
      activeQuests: this.activeQuests,
      completedQuests: this.completedQuests,
    };
  }

  /**
   * Deserialize quest system state
   */
  deserialize(state: { activeQuests?: QuestState[]; completedQuests?: string[] }): void {
    this.activeQuests = state.activeQuests || [];
    this.completedQuests = state.completedQuests || [];
  }

  private checkQuestCompletion(questId: string): void {
    const quest = this.activeQuests.find((q) => q.id === questId);
    if (!quest) return;

    const allCompleted = quest.objectives.every((obj) => obj.completed);
    if (allCompleted) {
      this.completeQuest(questId);
    }
  }
}
