import { useEffect, useRef, useState } from "react";
import type { CanvasMapProps, OperatingState } from "./types";
import { useCanvasInit } from "./hooks/useCanvasInit";
import { usePanZoom } from "./hooks/usePanZoom";
import { drawMap } from "./render/drawMap";
import { drawRobot } from "./render/drawRobot";
// import { drawGrid } from "./render/drawGrid";
import { drawWaypoints } from "./render/drawWaypoints";
import { drawPath } from "./render/drawPath"; // 导入路径绘制函数
import { ContextMenu } from "./components/ContextMenu";
import type { Mode, Waypoint } from "../../type";
import { Bottom } from "../Bottom";
import { WaypointEditor } from "./components/WaypointEditor";
import { drawArrow } from "./render/drawArrow";
import { drawLaserScan } from "./render/drawLaserScan";
import { RobotControls } from "../RobotControls";
import { drawFreePoints } from "./render/drawFreePoints";

const CanvasMap = ({
  sendMessage,
  mapData,
  projected_map,
  robot,
  laserScan,
  waypoints,
  pathPlan, // 接收路径规划数据
}: CanvasMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [operatingState, setOperatingState] =
    useState<OperatingState>("");
  const [editingNode, setEditingNode] = useState<Waypoint | null>(null);
  const [isEditingNode, setIsEditingNode] = useState<boolean>(false);
  const [mode, setMode] = useState<Mode>("navigation");
  const [mapRotation, setMapRotation] = useState<number>(0);
  const [isLaser, setIsLaser] = useState<boolean>(false);
  const [isPlan, setIsPlan] = useState<boolean>(false);
  const [isRobotControls, setIsRobotControls] = useState<boolean>(false);
  const [freePoints, setFreePoints] = useState<{ x: number; y: number }[]>([]);


  const { view, coord } = usePanZoom(
    canvasRef,
    operatingState,
    setOperatingState,
    setEditingNode,
    setIsEditingNode,
    mapData,
    sendMessage,
    editingNode,
    setMapRotation,
    mapRotation,
    setFreePoints,
    freePoints,
  );
  const { ctxRef } = useCanvasInit(canvasRef, containerRef,);
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);

    ctx.save();
    ctx.translate(ctx.canvas.clientWidth / 2, ctx.canvas.clientHeight / 2);
    ctx.rotate(mapRotation);
    ctx.translate(-ctx.canvas.clientWidth / 2, -ctx.canvas.clientHeight / 2);

    drawMap(ctx, mode === "navigation" ? mapData : projected_map, coord.worldToCanvas, view.scale,);
    drawRobot(ctx, robot, coord.worldToCanvas, view.scale);
    if (laserScan && isLaser) {
      drawLaserScan(ctx, laserScan, coord.worldToCanvas, robot);
    }
    if (mode === "navigation") {
      drawWaypoints(ctx, waypoints, coord.worldToCanvas, mapRotation);
      drawPath(ctx, pathPlan, coord.worldToCanvas); // 绘制路径规划
      if (operatingState === "addPoint" || operatingState === "setInitialPose") {
        drawArrow(ctx, editingNode, coord);
      }
      if (operatingState === "freeErase") {
        drawFreePoints(ctx, freePoints);
      }
    }

    ctx.restore();
  }, [mapData, projected_map, robot, laserScan, waypoints, pathPlan, view, ctxRef, coord, editingNode, operatingState, mode, mapRotation, isLaser, freePoints]);

  return (
    <>
      <div ref={containerRef} style={{ width: "100vw", height: "100vh", backgroundColor: "#303030" }}>
        <canvas ref={canvasRef} />
      </div>
      <ContextMenu
        canvasRef={canvasRef}
        waypoints={waypoints}
        coord={coord}
        setEditingNode={setEditingNode}
        sendMessage={sendMessage}
        operatingState={operatingState}
        setIsEditingNode={setIsEditingNode}
      ></ContextMenu>
      {isEditingNode ? (
        <WaypointEditor
          editingNode={editingNode!}
          setEditingNode={setEditingNode}
          sendMessage={sendMessage}
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
        sendMessage={sendMessage}
        isPlan={isPlan}
        setIsPlan={setIsPlan}
        isRobotControls={isRobotControls}
        setIsRobotControls={setIsRobotControls}
      ></Bottom>
      {isRobotControls ? <RobotControls></RobotControls> : null}
      
    </>
  );
};

export default CanvasMap;