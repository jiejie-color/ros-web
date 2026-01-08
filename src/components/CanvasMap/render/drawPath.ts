import type { PathPlan } from "../../../type";
import type { Coord } from "../hooks/usePanZoom";

export const drawPath = (
    ctx: CanvasRenderingContext2D,
    pathPlan: PathPlan | null,
    worldToCanvas: Coord["worldToCanvas"]
) => {
    if (!pathPlan) return
    const poses = pathPlan.poses;
    const points = poses.map(p => ({
        x: p.pose.position.x,
        y: p.pose.position.y
    }));
    if (!points.length) return;

    ctx.beginPath();
    const first = worldToCanvas(points[0].x, points[0].y);
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < points.length; i++) {
        const p = worldToCanvas(points[i].x, points[i].y);
        ctx.lineTo(p.x, p.y);
    }

    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;
    ctx.stroke();
};