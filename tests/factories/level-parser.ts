/**
 * Level Parser - Extracts testable geometry from chapter manifests
 *
 * Parses JSON chapter definitions into structures useful for:
 * - AI pathfinding (navigation graphs)
 * - Collision detection testing
 * - Automated playthrough validation
 */

import type { ChapterManifest } from '../../client/src/game/data/manifest-schemas';

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'semi_solid' | 'ice' | 'crumbling';
  segment: number;
}

export interface Wall {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  segment: number;
}

export interface NavigationNode {
  id: string;
  x: number;
  y: number;
  platform: Platform;
  connections: NavigationEdge[];
}

export interface NavigationEdge {
  to: string;
  cost: number;
  action: 'walk' | 'jump' | 'fall';
  distance: number;
}

export interface LevelGeometry {
  platforms: Platform[];
  walls: Wall[];
  navigationGraph: Map<string, NavigationNode>;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  triggers: Array<{ id: string; x: number; y: number; width: number; height: number }>;
}

/**
 * Convert a chapter manifest into LevelGeometry containing testable world geometry and navigation data.
 *
 * @param chapter - The ChapterManifest to parse
 * @returns A LevelGeometry object containing:
 *  - `platforms`: parsed platforms with positions, sizes, types, and segment indices
 *  - `walls`: parsed walls with positions, sizes, and segment indices
 *  - `navigationGraph`: a Map of NavigationNodes built from platforms
 *  - `startPosition` and `endPosition`: default or derived start/end coordinates
 *  - `triggers`: extracted `enter_region` triggers with id, x, y, width, and height
 */
export function parseLevel(chapter: ChapterManifest): LevelGeometry {
  const platforms: Platform[] = [];
  const walls: Wall[] = [];
  const triggers: LevelGeometry['triggers'] = [];

  // Extract platforms and walls from segments
  let platformCounter = 0;
  let wallCounter = 0;

  for (let segmentIdx = 0; segmentIdx < chapter.level.segments.length; segmentIdx++) {
    const segment = chapter.level.segments[segmentIdx];

    // Parse platforms
    for (const platform of segment.platforms) {
      platforms.push({
        id: `platform_${platformCounter++}`,
        x: platform.x,
        y: platform.y,
        width: platform.width,
        height: 25, // Standard platform height
        type: (platform.type as Platform['type']) || 'solid',
        segment: segmentIdx,
      });
    }

    // Parse walls if present
    if (segment.walls) {
      for (const wall of segment.walls) {
        walls.push({
          id: `wall_${wallCounter++}`,
          x: wall.x,
          y: wall.y,
          width: wall.width,
          height: wall.height,
          segment: segmentIdx,
        });
      }
    }
  }

  // Extract triggers from chapter triggers
  for (const trigger of chapter.triggers || []) {
    if (trigger.type === 'enter_region' && trigger.region) {
      triggers.push({
        id: trigger.id,
        x: trigger.region.x,
        y: trigger.region.y,
        width: trigger.region.width,
        height: trigger.region.height,
      });
    }
  }

  // Build navigation graph
  const navigationGraph = buildNavigationGraph(platforms);

  // Determine start/end positions
  const startPosition = { x: 100, y: 450 }; // Default start
  const endPosition =
    platforms.length > 0
      ? { x: platforms[platforms.length - 1].x, y: platforms[platforms.length - 1].y - 50 }
      : { x: 1000, y: 450 };

  return {
    platforms,
    walls,
    navigationGraph,
    startPosition,
    endPosition,
    triggers,
  };
}

/**
 * Create a navigation graph where each platform becomes a node and edges represent traversable actions.
 *
 * The node position is derived from the platform's center/top surface. Edges are added between nodes
 * when relative positions allow traversal and are labeled with an action (`walk`, `jump`, or `fall`),
 * a traversal cost, and the straight-line distance.
 *
 * @param platforms - Array of platforms to convert into navigation nodes
 * @returns A map from platform id to its corresponding NavigationNode (including connections)
 */
function buildNavigationGraph(platforms: Platform[]): Map<string, NavigationNode> {
  const graph = new Map<string, NavigationNode>();

  // Create nodes from platforms
  for (const platform of platforms) {
    const node: NavigationNode = {
      id: platform.id,
      x: platform.x + platform.width / 2,
      y: platform.y - 25, // Player stands on top
      platform,
      connections: [],
    };
    graph.set(platform.id, node);
  }

  // Build edges between platforms
  for (const fromPlatform of platforms) {
    const fromNode = graph.get(fromPlatform.id);
    if (!fromNode) {
      console.error(`[Navigation Graph] Missing fromNode for platform ${fromPlatform.id}`);
      continue;
    }

    for (const toPlatform of platforms) {
      if (fromPlatform.id === toPlatform.id) continue;

      const toNode = graph.get(toPlatform.id);
      if (!toNode) {
        console.error(`[Navigation Graph] Missing toNode for platform ${toPlatform.id}`);
        continue;
      }
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Determine if connection is possible
      let action: NavigationEdge['action'] | null = null;
      let cost = distance;

      // Horizontal walk (same level or gentle slope)
      if (Math.abs(dy) < 50 && Math.abs(dx) < 200) {
        action = 'walk';
        cost = distance;
      }
      // Jump up (reasonable height and distance)
      else if (dy < 0 && dy > -150 && Math.abs(dx) < 200) {
        action = 'jump';
        cost = distance * 1.5; // Jumping is harder
      }
      // Fall down
      else if (dy > 0 && Math.abs(dx) < 100) {
        action = 'fall';
        cost = distance * 0.8; // Falling is easier
      }

      if (action) {
        fromNode.connections.push({
          to: toPlatform.id,
          cost,
          action,
          distance,
        });
      }
    }
  }

  return graph;
}

/**
 * Finds a path of navigation nodes between two platforms using the A* algorithm.
 *
 * @param graph - Map of platform id to NavigationNode representing the navigation graph
 * @param startPlatformId - Id of the starting platform node
 * @param endPlatformId - Id of the target platform node
 * @returns An array of NavigationNodes in traversal order from start to end, or `null` if the start or end node is missing from the graph or no path exists
 */
export function findPath(
  graph: Map<string, NavigationNode>,
  startPlatformId: string,
  endPlatformId: string
): NavigationNode[] | null {
  const openSet = new Set<string>([startPlatformId]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  gScore.set(startPlatformId, 0);

  const endNode = graph.get(endPlatformId);
  const startNode = graph.get(startPlatformId);
  if (!endNode || !startNode) {
    console.error(
      `[Pathfinding] Missing ${!startNode ? 'start' : ''} ${!startNode && !endNode ? 'and' : ''} ${!endNode ? 'end' : ''} node (start: ${startPlatformId}, end: ${endPlatformId})`
    );
    return null;
  }

  fScore.set(startPlatformId, heuristic(startNode, endNode));

  while (openSet.size > 0) {
    // Get node with lowest fScore
    let current = '';
    let lowestF = Infinity;
    for (const id of openSet) {
      const f = fScore.get(id) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        current = id;
      }
    }

    if (current === endPlatformId) {
      return reconstructPath(cameFrom, current, graph);
    }

    openSet.delete(current);
    const currentNode = graph.get(current);
    if (!currentNode) {
      console.error(`[Pathfinding] Missing current node ${current} from graph during A* search`);
      continue;
    }

    for (const edge of currentNode.connections) {
      const tentativeG = (gScore.get(current) ?? Infinity) + edge.cost;

      if (tentativeG < (gScore.get(edge.to) ?? Infinity)) {
        cameFrom.set(edge.to, current);
        gScore.set(edge.to, tentativeG);

        const neighbor = graph.get(edge.to);
        if (!neighbor) {
          console.error(
            `[Pathfinding] Missing neighbor node ${edge.to} referenced by edge from ${current}`
          );
          continue;
        }
        fScore.set(edge.to, tentativeG + heuristic(neighbor, endNode));

        openSet.add(edge.to);
      }
    }
  }

  return null; // No path found
}

function heuristic(a: NavigationNode, b: NavigationNode): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Reconstructs the navigation path ending at the specified node.
 *
 * @param cameFrom - Map of node id to its predecessor node id in the search tree
 * @param current - The id of the end node to reconstruct the path for
 * @param graph - Map of node id to NavigationNode providing node details
 * @returns The path as an array of NavigationNodes ordered from start to `current`; returns an empty array if the path cannot be reconstructed due to missing nodes
 */
function reconstructPath(
  cameFrom: Map<string, string>,
  current: string,
  graph: Map<string, NavigationNode>
): NavigationNode[] {
  const startNode = graph.get(current);
  if (!startNode) {
    console.error(`[Path Reconstruction] Missing start node ${current}`);
    return [];
  }

  const path: NavigationNode[] = [startNode];

  while (cameFrom.has(current)) {
    const next = cameFrom.get(current);
    if (!next) {
      console.error(`[Path Reconstruction] Missing predecessor for ${current}`);
      break;
    }

    const nextNode = graph.get(next);
    if (!nextNode) {
      console.error(`[Path Reconstruction] Missing node ${next} in graph`);
      break;
    }

    current = next;
    path.unshift(nextNode);
  }

  return path;
}

/**
 * Selects the platform whose center is closest to the provided world coordinates.
 *
 * Distance is computed from each platform's center point (platform.x + platform.width / 2, platform.y).
 *
 * @param x - X coordinate in world space to compare against
 * @param y - Y coordinate in world space to compare against
 * @returns The nearest `Platform`, or `null` if `platforms` is empty
 */
export function findNearestPlatform(platforms: Platform[], x: number, y: number): Platform | null {
  if (platforms.length === 0) return null;

  let nearest = platforms[0];
  let minDist = Infinity;

  for (const platform of platforms) {
    const centerX = platform.x + platform.width / 2;
    const centerY = platform.y;
    const dx = centerX - x;
    const dy = centerY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < minDist) {
      minDist = dist;
      nearest = platform;
    }
  }

  return nearest;
}