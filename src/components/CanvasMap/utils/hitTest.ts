import type { Waypoint } from "../../../type";
import type { Coord } from "../hooks/usePanZoom";

export const hitTestWaypoint = (
  cx: number,
  cy: number,
  waypoints: Waypoint[],
  worldToCanvas: Coord["worldToCanvas"]
): Waypoint | null => {
  for (const p of waypoints) {
    const { x: px, y: py } = worldToCanvas(p.x, p.y);
    if (Math.hypot(px - cx, py - cy) <= 8) {
      return p;
    }
  }
  return null;
};
