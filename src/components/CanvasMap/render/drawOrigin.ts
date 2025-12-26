import type { Coord } from "../hooks/usePanZoom";

export const drawOrigin = (
  ctx: CanvasRenderingContext2D,
  worldToCanvas: Coord["worldToCanvas"]
) => {
  const { x, y } = worldToCanvas(0, 0);
  ctx.fillStyle = "blue";
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
};
