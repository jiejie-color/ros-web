import type { Global_Costmap_Message } from "../../../type/topicRespon";
import type { Coord } from "../hooks/usePanZoom";

const costToRGBA = (cost: number) => {
    if (cost < 0) return [0, 0, 0, 0];  // 未知区域：完全透明
    if (cost === 0) return [0, 0, 0, 0]; // 自由空间：完全透明

    if (cost >= 254 || cost >= 100) {
        return [255, 0, 0, 220];         // 障碍物：红色，高透明度
    }

    if (cost >= 99) {
        return [255, 165, 0, 200];       // 高代价：橙色
    }

    const v = 255 - Math.floor((cost / 98) * 255);
    return [v, v, v, 180];              // 中等代价：从浅灰到深灰
};

let costmapCache: {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    resolution: number;
    originX: number;
    originY: number;
    stamp?: number;
} | null = null;

export const drawCostMap = (
    ctx: CanvasRenderingContext2D,
    costMap: Global_Costmap_Message,
    worldToCanvas: Coord["worldToCanvas"],
) => {
    if (!costMap?.msg?.data?.length) return;

    const { data, info } = costMap.msg;
    const { width, height, resolution, origin } = info;

    const stamp =
        costMap.msg.header?.stamp?.sec ??
        costMap.msg.header?.stamp?.nanosec ??
        Date.now();
    const needRebuild =
        !costmapCache ||
        costmapCache.width !== width ||
        costmapCache.height !== height ||
        costmapCache.resolution !== resolution ||
        costmapCache.originX !== origin.position.x ||
        costmapCache.originY !== origin.position.y ||
        costmapCache.stamp !== stamp;

    if (needRebuild) {
        console.log("needRebuild");
        const off = document.createElement("canvas");
        off.width = width;
        off.height = height;
        const offCtx = off.getContext("2d")!;

        const img = offCtx.createImageData(width, height);
        const buf = img.data;

        for (let i = 0; i < data.length; i++) {
            const cost = data[i];
            const [r, g, b, a] = costToRGBA(cost);
            const p = i * 4;
            buf[p] = r;
            buf[p + 1] = g;
            buf[p + 2] = b;
            buf[p + 3] = a;
        }

        offCtx.putImageData(img, 0, 0);

        costmapCache = {
            canvas: off,
            width,
            height,
            resolution,
            originX: origin.position.x,
            originY: origin.position.y,
            stamp,
        };
    }

    if (!costmapCache) return;

    const p0 = worldToCanvas(origin.position.x, origin.position.y);
    const p1 = worldToCanvas(
        origin.position.x + width * resolution,
        origin.position.y + height * resolution,
    );

    const w = p1.x - p0.x;
    const h = p0.y - p1.y;

    ctx.save();
    ctx.globalAlpha = 0.8;

    ctx.translate(p0.x, p0.y);
    // Y 翻转
    ctx.scale(1, -1);

    ctx.drawImage(
        costmapCache.canvas,
        0,
        0,
        w,
        h,
    );

    ctx.restore();
};
