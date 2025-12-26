import type { Waypoint } from "../../../type";
import type { Coord } from "../hooks/usePanZoom";

export const drawWaypoints = (
  ctx: CanvasRenderingContext2D,
  waypoints: Waypoint[],
  worldToCanvas: Coord["worldToCanvas"]
) => {
  // 绘制 Waypoints
  waypoints.forEach((p) => {
    const { x: cx, y: cy } = worldToCanvas(p.x, p.y);

    ctx.save();
    ctx.fillStyle = "#00ff88";
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "12px sans-serif";
    ctx.fillText(p.name, cx + 8, cy - 8);
    ctx.restore();
  });
};
