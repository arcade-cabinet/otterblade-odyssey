import { World } from "miniplex";
import createReactAPI from "miniplex-react";
import type { Object3D } from "three";

export type Entity = {
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  
  health?: { current: number; max: number };
  
  player?: true;
  enemy?: { type: "skirmisher" | "shielded" | "ranged" | "flyer" | "trap" | "elite" };
  boss?: { phase: number; maxPhase: number; name: string };
  
  sprite?: { src: string; width: number; height: number; flipX?: boolean };
  parallax?: { layer: number; scrollFactor: number };
  
  platform?: { width: number; height: number };
  checkpoint?: { roomIndex: number };
  shard?: true;
  
  object3d?: Object3D;
  
  facingRight?: boolean;
  grounded?: boolean;
  
  controls?: {
    left: boolean;
    right: boolean;
    jump: boolean;
    crouch: boolean;
    attack: boolean;
  };
  
  coyoteTime?: number;
  jumpBuffer?: number;
  
  damage?: { amount: number; source: Entity };
  dead?: true;
  
  tag?: string[];
};

export const world = new World<Entity>();

export const ECS = createReactAPI(world);

export const queries = {
  players: world.with("player", "position"),
  enemies: world.with("enemy", "position"),
  bosses: world.with("boss", "position", "health"),
  moving: world.with("position", "velocity"),
  sprites: world.with("sprite", "position"),
  parallaxLayers: world.with("parallax", "sprite"),
  platforms: world.with("platform", "position"),
  checkpoints: world.with("checkpoint", "position"),
  shards: world.with("shard", "position"),
  withHealth: world.with("health"),
  dead: world.with("dead"),
  controlled: world.with("controls", "velocity"),
};
