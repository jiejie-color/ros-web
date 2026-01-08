import type { MapMessage } from "../../../type";
import type { Coord } from "../hooks/usePanZoom";

export const drawMap = (
  ctx: CanvasRenderingContext2D,
  mapData: MapMessage | null,
  worldToCanvas: Coord["worldToCanvas"],
  scale: number
) => {
  if (!mapData) return;

  ctx.fillStyle = "#303030";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const { width, height, resolution, origin } = mapData.info;
  const data = mapData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = data[y * width + x];
      // 根据值设置颜色
      if (v < 0 || v === 100) {
        ctx.fillStyle = "#000000"; // 黑色：未知 + 障碍物
      } else if (v > 0) {
        ctx.fillStyle = "#999"; // 灰色：部分占用
      } else {
        ctx.fillStyle = "#c0c0c0"; // 白色：自由空间
      }
      const wx = origin.position.x + x * resolution;
      const wy = origin.position.y + y * resolution;
      const { x: cx, y: cy } = worldToCanvas(wx, wy);
      ctx.fillRect(cx, cy, resolution * scale + 1, resolution * scale + 1);
      // ctx.fillRect(cx, cy, resolution * scale, resolution * scale);
    }
  }
};
