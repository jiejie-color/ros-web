import type { Robot } from "../../../type";
import type { Coord } from "../hooks/usePanZoom";

export const drawRobot = (
  ctx: CanvasRenderingContext2D,
  robot: Robot,
  worldToCanvas: Coord["worldToCanvas"],
  scale: number
) => {
  const { x, y } = worldToCanvas(robot.x, robot.y);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-robot.yaw);  // 注意负号：Canvas 旋转是顺时针，yaw 通常是逆时针

  const bodyRadius = 0.25 * scale;  // 身体大小（米转像素）
  const arrowLength = 0.4 * scale;

  // 画圆形身体（蓝色半透明）
  ctx.fillStyle = "rgba(0, 100, 255, 0.7)";
  ctx.beginPath();
  ctx.arc(0, 0, bodyRadius, 0, Math.PI * 2);
  ctx.fill();

  // 画轮廓
  ctx.strokeStyle = "#003366";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 画前方方向箭头（红色）
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.moveTo(arrowLength, 0);
  ctx.lineTo(arrowLength * 0.6, arrowLength * 0.4);
  ctx.lineTo(arrowLength * 0.6, -arrowLength * 0.4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
};
