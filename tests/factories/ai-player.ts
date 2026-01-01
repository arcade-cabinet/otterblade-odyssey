/**
 * AI Player Simulator - YUKA-based player movement for automated testing
 *
 * Simulates a player that can:
 * - Navigate through levels using pathfinding
 * - Perform all player actions (jump, attack, roll, slink)
 * - React to enemies and hazards
 * - Complete objectives deterministically
 *
 * This is like enemy AI, but with player capabilities.
 */

import type { NavigationNode, LevelGeometry } from './level-parser';
import { findPath, findNearestPlatform } from './level-parser';

export type PlayerAction =
  | 'idle'
  | 'move_left'
  | 'move_right'
  | 'jump'
  | 'attack'
  | 'roll'
  | 'slink';

export interface PlayerState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  facing: 1 | -1;
  grounded: boolean;
  action: PlayerAction;
  health: number;
  currentPlatformId: string | null;
}

export interface AIPlayerConfig {
  geometry: LevelGeometry;
  goalX: number;
  goalY: number;
  moveSpeed: number;
  jumpForce: number;
  decisionInterval: number; // ms between decisions
}

/**
 * AI Player Controller - Makes decisions about player movement
 */
export class AIPlayer {
  private state: PlayerState;
  private config: AIPlayerConfig;
  private path: NavigationNode[] = [];
  private currentPathIndex = 0;
  private lastDecisionTime = 0;
  private stuck = false;
  private stuckCounter = 0;

  constructor(config: AIPlayerConfig) {
    this.config = config;
    this.state = {
      x: config.geometry.startPosition.x,
      y: config.geometry.startPosition.y,
      velocityX: 0,
      velocityY: 0,
      facing: 1,
      grounded: true,
      action: 'idle',
      health: 100,
      currentPlatformId: null,
    };

    // Calculate initial path
    this.calculatePath();
  }

  /**
   * Calculate path to goal using navigation graph
   */
  private calculatePath(): void {
    // Find nearest platform to start position
    const startPlatform = findNearestPlatform(
      this.config.geometry.platforms,
      this.state.x,
      this.state.y
    );

    // Find nearest platform to goal
    const endPlatform = findNearestPlatform(
      this.config.geometry.platforms,
      this.config.goalX,
      this.config.goalY
    );

    if (!startPlatform || !endPlatform) {
      console.warn('AI Player: Could not find start or end platform');
      return;
    }

    // Use A* to find path
    const path = findPath(
      this.config.geometry.navigationGraph,
      startPlatform.id,
      endPlatform.id
    );

    if (path) {
      this.path = path;
      this.currentPathIndex = 0;
      console.log(`AI Player: Found path with ${path.length} waypoints`);
    } else {
      console.warn('AI Player: No path found to goal');
    }
  }

  /**
   * Update AI state and return the action to take
   */
  public update(currentTime: number, currentState: PlayerState): PlayerAction {
    // Update internal state
    this.state = { ...currentState };

    // Check if we need to make a new decision
    if (currentTime - this.lastDecisionTime < this.config.decisionInterval) {
      return this.state.action; // Continue current action
    }

    this.lastDecisionTime = currentTime;

    // Check if stuck (not making progress)
    this.checkIfStuck();

    // If we've completed the path, idle
    if (this.currentPathIndex >= this.path.length) {
      return 'idle';
    }

    // Get current target waypoint
    const targetNode = this.path[this.currentPathIndex];

    // Check if we've reached current waypoint
    const distToTarget = Math.sqrt(
      Math.pow(targetNode.x - this.state.x, 2) +
      Math.pow(targetNode.y - this.state.y, 2)
    );

    if (distToTarget < 50) {
      // Reached waypoint, move to next
      this.currentPathIndex++;
      if (this.currentPathIndex >= this.path.length) {
        return 'idle';
      }
      return this.decideAction();
    }

    // Decide action based on path
    return this.decideAction();
  }

  /**
   * Decide which action to take based on current waypoint
   */
  private decideAction(): PlayerAction {
    if (this.currentPathIndex >= this.path.length) return 'idle';

    const target = this.path[this.currentPathIndex];
    const dx = target.x - this.state.x;
    const dy = target.y - this.state.y;

    // If we're stuck, try jumping
    if (this.stuck) {
      this.stuckCounter++;
      if (this.stuckCounter > 3) {
        // Re-calculate path after being stuck too long
        this.calculatePath();
        this.stuck = false;
        this.stuckCounter = 0;
      }
      return this.state.grounded ? 'jump' : 'move_right';
    }

    // Get the edge to current target
    const prevNode = this.currentPathIndex > 0 ? this.path[this.currentPathIndex - 1] : null;
    const edge = prevNode?.connections.find(c => c.to === target.platform.id);

    // Execute action based on edge type
    if (edge) {
      switch (edge.action) {
        case 'jump':
          // Need to jump to reach platform
          if (this.state.grounded) {
            return 'jump';
          }
          // While in air, move toward target
          return dx > 0 ? 'move_right' : 'move_left';

        case 'fall':
          // Just move toward target and fall
          return dx > 0 ? 'move_right' : 'move_left';

        case 'walk':
          // Simple horizontal movement
          return Math.abs(dx) < 10 ? 'idle' : (dx > 0 ? 'move_right' : 'move_left');
      }
    }

    // Default: move toward target horizontally
    if (Math.abs(dx) < 10) {
      // Need vertical movement
      if (Math.abs(dy) > 50 && this.state.grounded) {
        return 'jump';
      }
      return 'idle';
    }

    return dx > 0 ? 'move_right' : 'move_left';
  }

  /**
   * Check if player is stuck (not making progress)
   */
  private checkIfStuck(): void {
    // Simple stuck detection: if we're on the ground and action is move but velocity is low
    if (
      this.state.grounded &&
      (this.state.action === 'move_left' || this.state.action === 'move_right') &&
      Math.abs(this.state.velocityX) < 0.5
    ) {
      this.stuck = true;
    } else {
      this.stuck = false;
      this.stuckCounter = 0;
    }
  }

  /**
   * Get current state (for debugging)
   */
  public getState(): PlayerState {
    return { ...this.state };
  }

  /**
   * Get current progress (0-1)
   */
  public getProgress(): number {
    if (this.path.length === 0) return 0;
    return this.currentPathIndex / this.path.length;
  }

  /**
   * Check if goal is reached
   */
  public isGoalReached(): boolean {
    const distToGoal = Math.sqrt(
      Math.pow(this.config.goalX - this.state.x, 2) +
      Math.pow(this.config.goalY - this.state.y, 2)
    );
    return distToGoal < 100;
  }
}

/**
 * Convert AI actions to Playwright keyboard commands
 */
export function actionToKeyboard(action: PlayerAction): {
  press?: string[];
  release?: string[];
} {
  switch (action) {
    case 'move_left':
      return { press: ['ArrowLeft'], release: ['ArrowRight'] };
    case 'move_right':
      return { press: ['ArrowRight'], release: ['ArrowLeft'] };
    case 'jump':
      return { press: ['Space'] };
    case 'attack':
      return { press: ['KeyX'] };
    case 'roll':
      return { press: ['KeyC'] };
    case 'slink':
      return { press: ['ArrowDown'] };
    case 'idle':
    default:
      return { release: ['ArrowLeft', 'ArrowRight', 'ArrowDown'] };
  }
}
