/**
 * Game State Manager
 *
 * Manages global game state with persistence.
 *
 * @module core/game-state
 */

/**
 * Game State class
 */
export class GameState {
  constructor() {
    this.currentChapter = 0;
    this.health = 5;
    this.maxHealth = 5;
    this.warmth = 100;
    this.maxWarmth = 100;
    this.shards = 0;
    this.inventory = [];
    this.completedQuests = [];
    this.activeQuests = [];
    this.discoveredSecrets = [];
    this.activatedCheckpoints = [];
    this.defeatedEnemies = [];
    this.defeatedEnemiesByType = {};
    this.enemyGroups = {};
    this.unlockedDoors = [];
    this.gameTime = 0;
    this.playTime = 0;
    this.deaths = 0;
    this.lastCheckpoint = null;
    this.settings = {
      musicVolume: 0.7,
      sfxVolume: 0.8,
      showQuestTracker: true,
      showTutorialHints: true,
    };
    this.listeners = [];
  }

  /**
   * Subscribe to state changes
   *
   * @param {Function} callback - Called when state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners of state change
   * @private
   */
  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    }
  }

  /**
   * Take damage
   *
   * @param {number} amount - Damage amount
   * @returns {boolean} True if player died
   */
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.notify();

    if (this.health <= 0) {
      this.deaths++;
      return true; // Player died
    }

    return false;
  }

  /**
   * Heal player
   *
   * @param {number} amount - Heal amount ('full' or number)
   */
  heal(amount) {
    if (amount === 'full') {
      this.health = this.maxHealth;
    } else {
      this.health = Math.min(this.maxHealth, this.health + amount);
    }
    this.notify();
  }

  /**
   * Drain warmth
   *
   * @param {number} amount - Warmth to drain
   */
  drainWarmth(amount) {
    this.warmth = Math.max(0, this.warmth - amount);
    this.notify();

    // Take damage if warmth too low
    if (this.warmth <= 0) {
      return this.takeDamage(1);
    }

    return false;
  }

  /**
   * Restore warmth
   *
   * @param {number} amount - Warmth to restore ('full' or number)
   */
  restoreWarmth(amount) {
    if (amount === 'full') {
      this.warmth = this.maxWarmth;
    } else {
      this.warmth = Math.min(this.maxWarmth, this.warmth + amount);
    }
    this.notify();
  }

  /**
   * Collect shards
   *
   * @param {number} amount - Number of shards
   */
  collectShards(amount = 1) {
    this.shards += amount;
    this.notify();
  }

  /**
   * Add item to inventory
   *
   * @param {string} itemId - Item ID
   * @param {number} amount - Amount to add
   */
  addItem(itemId, amount = 1) {
    for (let i = 0; i < amount; i++) {
      this.inventory.push(itemId);
    }
    this.notify();
  }

  /**
   * Remove item from inventory
   *
   * @param {string} itemId - Item ID
   * @param {number} amount - Amount to remove
   * @returns {boolean} True if item was removed
   */
  removeItem(itemId, amount = 1) {
    let removed = 0;
    for (let i = 0; i < amount; i++) {
      const index = this.inventory.indexOf(itemId);
      if (index > -1) {
        this.inventory.splice(index, 1);
        removed++;
      }
    }

    if (removed > 0) {
      this.notify();
    }

    return removed === amount;
  }

  /**
   * Check if player has item
   *
   * @param {string} itemId - Item ID
   * @returns {boolean}
   */
  hasItem(itemId) {
    return this.inventory.includes(itemId);
  }

  /**
   * Complete quest
   *
   * @param {string} questId - Quest ID
   */
  completeQuest(questId) {
    if (!this.completedQuests.includes(questId)) {
      this.completedQuests.push(questId);

      // Remove from active
      const index = this.activeQuests.indexOf(questId);
      if (index > -1) {
        this.activeQuests.splice(index, 1);
      }

      this.notify();
    }
  }

  /**
   * Start quest
   *
   * @param {string} questId - Quest ID
   */
  startQuest(questId) {
    if (!this.activeQuests.includes(questId) && !this.completedQuests.includes(questId)) {
      this.activeQuests.push(questId);
      this.notify();
    }
  }

  /**
   * Mark enemy as defeated
   *
   * @param {string} enemyId - Enemy ID
   * @param {string} enemyType - Enemy type
   */
  defeatEnemy(enemyId, enemyType) {
    if (!this.defeatedEnemies.includes(enemyId)) {
      this.defeatedEnemies.push(enemyId);

      if (!this.defeatedEnemiesByType[enemyType]) {
        this.defeatedEnemiesByType[enemyType] = 0;
      }
      this.defeatedEnemiesByType[enemyType]++;

      this.notify();
    }
  }

  /**
   * Mark enemy group as defeated
   *
   * @param {string} groupId - Group ID
   */
  defeatEnemyGroup(groupId) {
    if (!this.enemyGroups[groupId]) {
      this.enemyGroups[groupId] = {};
    }
    this.enemyGroups[groupId].defeated = true;
    this.notify();
  }

  /**
   * Discover secret
   *
   * @param {string} secretId - Secret ID
   */
  discoverSecret(secretId) {
    if (!this.discoveredSecrets.includes(secretId)) {
      this.discoveredSecrets.push(secretId);
      this.notify();
    }
  }

  /**
   * Activate checkpoint
   *
   * @param {string} checkpointId - Checkpoint ID
   */
  activateCheckpoint(checkpointId) {
    if (!this.activatedCheckpoints.includes(checkpointId)) {
      this.activatedCheckpoints.push(checkpointId);
      this.lastCheckpoint = checkpointId;
      this.notify();
    }
  }

  /**
   * Unlock door
   *
   * @param {string} doorId - Door ID
   */
  unlockDoor(doorId) {
    if (!this.unlockedDoors.includes(doorId)) {
      this.unlockedDoors.push(doorId);
      this.notify();
    }
  }

  /**
   * Progress to next chapter
   */
  nextChapter() {
    if (this.currentChapter < 9) {
      this.currentChapter++;
      this.notify();
    }
  }

  /**
   * Set chapter
   *
   * @param {number} chapterId - Chapter ID
   */
  setChapter(chapterId) {
    if (chapterId >= 0 && chapterId <= 9) {
      this.currentChapter = chapterId;
      this.notify();
    }
  }

  /**
   * Update play time
   *
   * @param {number} deltaTime - Time in ms
   */
  updatePlayTime(deltaTime) {
    this.playTime += deltaTime;
    this.gameTime += deltaTime;
  }

  /**
   * Respawn at last checkpoint
   */
  respawn() {
    this.health = this.maxHealth;
    this.warmth = this.maxWarmth;
    this.notify();
  }

  /**
   * Serialize state for saving
   *
   * @returns {Object} Serialized state
   */
  serialize() {
    return {
      currentChapter: this.currentChapter,
      health: this.health,
      maxHealth: this.maxHealth,
      warmth: this.warmth,
      maxWarmth: this.maxWarmth,
      shards: this.shards,
      inventory: this.inventory,
      completedQuests: this.completedQuests,
      activeQuests: this.activeQuests,
      discoveredSecrets: this.discoveredSecrets,
      activatedCheckpoints: this.activatedCheckpoints,
      defeatedEnemies: this.defeatedEnemies,
      defeatedEnemiesByType: this.defeatedEnemiesByType,
      enemyGroups: this.enemyGroups,
      unlockedDoors: this.unlockedDoors,
      playTime: this.playTime,
      deaths: this.deaths,
      lastCheckpoint: this.lastCheckpoint,
      settings: this.settings,
    };
  }

  /**
   * Deserialize state from save
   *
   * @param {Object} data - Serialized state
   */
  deserialize(data) {
    if (!data) return;

    // Safe property assignment - avoid prototype pollution
    const safeKeys = [
      'currentChapter', 'health', 'maxHealth', 'warmth', 'maxWarmth',
      'shards', 'inventory', 'completedQuests', 'activeQuests',
      'discoveredSecrets', 'activatedCheckpoints', 'defeatedEnemies',
      'defeatedEnemiesByType', 'enemyGroups', 'unlockedDoors',
      'playTime', 'deaths', 'lastCheckpoint', 'settings'
    ];

    for (const key of safeKeys) {
      if (Object.hasOwn(data, key)) {
        this[key] = data[key];
      }
    }

    this.gameTime = 0;
    this.listeners = [];
    this.notify();
  }

  /**
   * Save to localStorage
   *
   * @param {string} slot - Save slot name
   */
  save(slot = 'default') {
    try {
      const data = this.serialize();
      localStorage.setItem(`otterblade_save_${slot}`, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load from localStorage
   *
   * @param {string} slot - Save slot name
   * @returns {boolean} Success
   */
  load(slot = 'default') {
    try {
      const data = localStorage.getItem(`otterblade_save_${slot}`);
      if (!data) return false;

      const parsed = JSON.parse(data);

      // Basic validation
      if (typeof parsed !== 'object' || parsed === null) {
        console.error('Invalid save data format');
        return false;
      }

      this.deserialize(parsed);
      return true;
    } catch (error) {
      console.error('Failed to load game:', error);
      return false;
    }
  }

  /**
   * Check if save exists
   *
   * @param {string} slot - Save slot name
   * @returns {boolean}
   */
  hasSave(slot = 'default') {
    return localStorage.getItem(`otterblade_save_${slot}`) !== null;
  }

  /**
   * Delete save
   *
   * @param {string} slot - Save slot name
   */
  deleteSave(slot = 'default') {
    localStorage.removeItem(`otterblade_save_${slot}`);
  }

  /**
   * Reset to initial state
   */
  reset() {
    const initial = new GameState();
    Object.assign(this, initial);
    this.notify();
  }
}
