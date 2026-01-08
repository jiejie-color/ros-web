export const drawFreePoints = (
    ctx: CanvasRenderingContext2D,
    freePoints: { x: number; y: number }[],
) => {
    if (freePoints.length === 0) {
        return;
    }
    ctx.beginPath();
    ctx.moveTo(freePoints[0].x, freePoints[0].y);
    for (let i = 1; i < freePoints.length; i++) {
        const x = freePoints[i].x
        const y = freePoints[i].y
        ctx.strokeStyle = "rgba(255,0,0,0.9)";
        ctx.lineWidth = 2;
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    ctx.closePath();
};
