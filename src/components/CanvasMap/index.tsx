import { useEffect, useRef, useState } from "react";
import type { CanvasMapProps, OperatingState } from "./types";
import { useCanvasInit } from "./hooks/useCanvasInit";
import { usePanZoom } from "./hooks/usePanZoom";
import { drawMap } from "./render/drawMap";
import { drawRobot } from "./render/drawRobot";
// import { drawGrid } from "./render/drawGrid";
import { drawWaypoints } from "./render/drawWaypoints";
import { ContextMenu } from "./components/ContextMenu";
import type { Mode, Waypoint } from "../../type";
import { Bottom } from "../Bottom";
import { WaypointEditor } from "./components/WaypointEditor";
import { drawArrow } from "./render/drawArrow";
import { drawLaserScan } from "./render/drawLaserScan";

const CanvasMap = (props: CanvasMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [operatingState, setOperatingState] =
    useState<OperatingState>("");
  const [editingNode, setEditingNode] = useState<Waypoint | null>(null);
  const [isEditingNode, setIsEditingNode] = useState<boolean>(false);
  const [mode, setMode] = useState<Mode>("navigation");
  const [mapRotation, setMapRotation] = useState<number>(0);
  const [isLaser, setIsLaser] = useState<boolean>(false);
  const { view, coord } = usePanZoom(
    canvasRef,
    operatingState,
    setOperatingState,
    setEditingNode,
    setIsEditingNode,
    props.mapData,
    props.sendMessage,
    editingNode,
    setMapRotation,
    mapRotation
  );
  const { ctxRef } = useCanvasInit(canvasRef, containerRef,);
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx || !props.mapData) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.rotate(mapRotation);
    ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);

    drawMap(ctx, props.mapData, coord.worldToCanvas, view.scale,);
    drawRobot(ctx, props.robot, coord.worldToCanvas, view.scale);
    if (props.laserScan && isLaser) {
      drawLaserScan(ctx, props.laserScan, coord.worldToCanvas, props.robot);
    }
    if (mode === "navigation") {
      drawWaypoints(ctx, props.waypoints, coord.worldToCanvas, mapRotation);
      if (operatingState === "addPoint" || operatingState === "setInitialPose") {
        drawArrow(ctx, editingNode, coord);
      }
    }

    ctx.restore();
  }, [props, view, ctxRef, coord, editingNode, operatingState, mode, mapRotation, isLaser]);

  return (
    <>
      <div ref={containerRef} style={{ width: "100vw", height: "100vh", backgroundColor: "#303030" }}>
        <canvas ref={canvasRef} />
      </div>
      <ContextMenu
        canvasRef={canvasRef}
        waypoints={props.waypoints}
        coord={coord}
        setEditingNode={setEditingNode}
        sendMessage={props.sendMessage}
        operatingState={operatingState}
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
        operatingState={operatingState}
        setOperatingState={setOperatingState}
        mode={mode}
        setMode={setMode}
        setIsLaser={setIsLaser}
        isLaser={isLaser}
      ></Bottom>
    </>
  );
};

export default CanvasMap;
