import type { LaserScan, Robot } from "../../../type";
import type { Coord } from "../hooks/usePanZoom";

export const drawLaserScan = (
  ctx: CanvasRenderingContext2D,
  laserScan: LaserScan,
  worldToCanvas: Coord["worldToCanvas"],
  robot: Robot
) => {
  if (!laserScan) return;

  ctx.fillStyle = "#ff0000"; // 红色点
  const { angle_min, angle_increment, ranges } = laserScan;

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    if (range < laserScan.range_min || range > laserScan.range_max || !isFinite(range)) continue;

    const angle = angle_min + i * angle_increment + robot.yaw;
    const wx = robot.x + range * Math.cos(angle);
    const wy = robot.y + range * Math.sin(angle);

    const { x: cx, y: cy } = worldToCanvas(wx, wy);
    ctx.beginPath();
    ctx.arc(cx, cy, 1, 0, Math.PI * 2);
    ctx.fill();
  }
};