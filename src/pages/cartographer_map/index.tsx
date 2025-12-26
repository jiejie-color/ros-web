import { useEffect, useRef, useState } from "react";
import { useCanvasInit } from "../../components/CanvasMap/hooks/useCanvasInit";
import { drawMap } from "../../components/CanvasMap/render/drawMap";
import type { MapMessage, Waypoint } from "../../type";
import { usePanZoom } from "../../components/CanvasMap/hooks/usePanZoom";
import type { WaypointEditState } from "../../components/CanvasMap/types";

export const Cartographer_map = (props: {
    cartographer_map: MapMessage | null;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { ctxRef } = useCanvasInit(canvasRef, containerRef);
    const [waypointEditState, setWaypointEditState] = useState<WaypointEditState>("drag");
    const [editingNode, setEditingNode] = useState<Waypoint | null>(null);
    const [, setIsEditingNode] = useState<boolean>(false);

    const { view, coord } = usePanZoom(
        canvasRef,
        waypointEditState,
        setWaypointEditState,
        setEditingNode,
        setIsEditingNode,
        props.cartographer_map
    );
    useEffect(() => {
        const ctx = ctxRef.current;
        if (!ctx || !props.cartographer_map) return;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        drawMap(ctx, props.cartographer_map, coord.worldToCanvas, view.scale);
    }, [props, view, ctxRef, coord, editingNode]);
    return (
        <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
            <canvas ref={canvasRef} />
        </div>
    );
}
