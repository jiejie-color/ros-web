import { useEffect, useRef, useState } from "react";
import type { CanvasMapProps, WaypointEditState } from "./types";
import { useCanvasInit } from "./hooks/useCanvasInit";
import { usePanZoom } from "./hooks/usePanZoom";
import { drawMap } from "./render/drawMap";
import { drawRobot } from "./render/drawRobot";
// import { drawGrid } from "./render/drawGrid";
import { drawWaypoints } from "./render/drawWaypoints";
import { ContextMenu } from "./components/ContextMenu";
import type { Waypoint } from "../../type";
import { Bottom } from "../Bottom";
import { WaypointEditor } from "./components/WaypointEditor";
import { drawArrow } from "./render/drawArrow";

const CanvasMap = (props: CanvasMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waypointEditState, setWaypointEditState] =
    useState<WaypointEditState>("drag");
  const [editingNode, setEditingNode] = useState<Waypoint | null>(null);
  const [isEditingNode, setIsEditingNode] = useState<boolean>(false);

  const { view, coord } = usePanZoom(
    canvasRef,
    waypointEditState,
    setWaypointEditState,
    setEditingNode,
    setIsEditingNode,
    props.mapData
  );
  const { ctxRef } = useCanvasInit(canvasRef, containerRef);
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx || !props.mapData) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    drawMap(ctx, props.mapData, coord.worldToCanvas, view.scale);
    // drawGrid(
    //   ctx,
    //   props.mapData,
    //   coord.worldToCanvas,
    //   view.scale,
    //   props.baseGridSize
    // );
    drawRobot(ctx, props.robot, coord.worldToCanvas, view.scale);
    drawWaypoints(ctx, props.waypoints, coord.worldToCanvas);
    drawArrow(ctx, editingNode, coord);
  }, [props, view, ctxRef, coord, editingNode]);

  return (
    <>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
        <canvas ref={canvasRef} />
      </div>
      <ContextMenu
        canvasRef={canvasRef}
        waypoints={props.waypoints}
        coord={coord}
        setEditingNode={setEditingNode}
        sendMessage={props.sendMessage}
        waypointEditState={waypointEditState}
        setIsEditingNode={setIsEditingNode}
      ></ContextMenu>
      {isEditingNode ? (
        <WaypointEditor
          editingNode={editingNode!}
          setEditingNode={setEditingNode}
          sendMessage={props.sendMessage}
          setIsEditingNode={setIsEditingNode}
        ></WaypointEditor>
      ) : null}

      <Bottom
        canvasRef={canvasRef}
        waypointEditState={waypointEditState}
        setWaypointEditState={setWaypointEditState}
      ></Bottom>
    </>
  );
};

export default CanvasMap;
