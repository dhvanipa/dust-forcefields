import { MapTileMetadata } from "./types";

export type Vec2 = [number, number];

export function world2ToPannableMapCoordinates(pos: Vec2): Vec2 {
  return [-pos[1], pos[0]];
}

export function pannableWorldBoundsFromData(
  data: Pick<MapTileMetadata, "boundsEnd" | "boundsStart">
) {
  return [
    [-data.boundsStart[1], data.boundsStart[0]],
    [-data.boundsEnd[1], data.boundsEnd[0]],
  ] as [Vec2, Vec2];
}
