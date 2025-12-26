import type { MapMessage } from "../../../type";
import type { Coord } from "../hooks/usePanZoom";

export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  mapData: MapMessage,
  worldToCanvas: Coord["worldToCanvas"],
  scale: number,
  baseGridSize = 1
) => {
  if (!mapData) return;

  const { width, height, resolution, origin } = mapData.info;

  const mapW = width * resolution;
  const mapH = height * resolution;

  // 自适应网格密度（像素）
  let gridPx = baseGridSize * scale;
  while (gridPx < 30) gridPx *= 2;
  while (gridPx > 120) gridPx /= 2;

  const gridMeter = gridPx / scale;

  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= mapW; x += gridMeter) {
    const wx = origin.position.x + x;
    const p1 = worldToCanvas(wx, origin.position.y);
    const p2 = worldToCanvas(wx, origin.position.y + mapH);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  for (let y = 0; y <= mapH; y += gridMeter) {
    const wy = origin.position.y + y;
    const p1 = worldToCanvas(origin.position.x, wy);
    const p2 = worldToCanvas(origin.position.x + mapW, wy);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
};
