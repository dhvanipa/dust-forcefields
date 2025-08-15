import type { ReadonlyVec3, Vec3 } from "@dust/world/internal";

const worldLowerCorner: Vec3 = [-1536, -64, -3072];
const worldUpperCorner: Vec3 = [2560, 320, 1024];

export const minZoom = -1;
export const maxZoom = 4;
export const tileSize = 512;
export const bounds = [
  worldToMapCoordinates(worldLowerCorner),
  worldToMapCoordinates(worldUpperCorner),
];

export type Vec2 = [x: number, y: number];

export function worldToMapCoordinates(pos: ReadonlyVec3): Vec2 {
  return [-pos[2], pos[0]];
}
