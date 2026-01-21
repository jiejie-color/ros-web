import { useEffect, useRef, useState } from "react";
import type { OperatingState } from "./types";
import { useCanvasInit } from "./hooks/useCanvasInit";
import { usePanZoom } from "./hooks/usePanZoom";
import { drawMap } from "./render/drawMap";
import { drawRobot } from "./render/drawRobot";
// import { drawGrid } from "./render/drawGrid";
import { drawWaypoints } from "./render/drawWaypoints";
import { drawPath } from "./render/drawPath"; // 导入路径绘制函数
import { ContextMenu } from "./components/ContextMenu";
import type { Waypoint } from "../../type";
import { Bottom } from "../Bottom";
import { WaypointEditor } from "./components/WaypointEditor";
import { drawArrow } from "./render/drawArrow";
import { drawLaserScan } from "./render/drawLaserScan";
import { RobotControls } from "../RobotControls";
import { drawFreePoints } from "./render/drawFreePoints";
import { useWebSocketContext } from "../../hooks/useWebSocket";
import { useGetData } from "./useGetData";
import { Top } from "../Top";
import { drawCostMap } from "./render/drawCostMap";

const CanvasMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [operatingState, setOperatingState] =
    useState<OperatingState>("");
  const [editingNode, setEditingNode] = useState<Waypoint | null>(null);
  const [isEditingNode, setIsEditingNode] = useState<boolean>(false);
  // const [mode, setMode] = useState<Mode>("navigation");
  const [mapRotation, setMapRotation] = useState<number>(0);
  const [isLaser, setIsLaser] = useState<boolean>(false);
  const [isPlan, setIsPlan] = useState<boolean>(true);
  const [isCostMap, setIsCostMap] = useState<boolean>(false);
  const [freePoints, setFreePoints] = useState<{ x: number; y: number }[]>([]);
  const { sendMessage, mode, setMode, mapData, robotControlMode, isLoad } = useWebSocketContext();
  const { robot, waypoints, laserScan, plan, global_costmap } = useGetData();
  const mapCacheRef = useRef<HTMLCanvasElement | null>(null);

  const { view, coord } = usePanZoom(
    canvasRef,
    operatingState,
    setOperatingState,
    setEditingNode,
    setIsEditingNode,
    mapData,
    editingNode,
    setMapRotation,
    mapRotation,
    setFreePoints,
    freePoints,
  );
  const { ctxRef } = useCanvasInit(canvasRef, containerRef,);

  useEffect(() => {

    if (!mapData || !ctxRef.current) return;

    const base = document.createElement("canvas");
    base.width = ctxRef.current.canvas.width;
    base.height = ctxRef.current.canvas.height;
    const baseCtx = base.getContext("2d")!;
    baseCtx.clearRect(0, 0, base.width, base.height);

    drawMap(baseCtx, mapData, coord.worldToCanvas, view.scale);

    mapCacheRef.current = base;
  }, [mapData, coord, view.scale, ctxRef]);

  useEffect(() => {
    let rafId: number;

    const render = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // map layer
      if (mapCacheRef.current) {
        ctx.drawImage(mapCacheRef.current, 0, 0);
      }

      // robot
      if ((mode === "navigation" || mode === "mapping") && robot) {
        drawRobot(ctx, robot, coord.worldToCanvas, view.scale);
      }

      // laser
      if (laserScan && isLaser && robot) {
        drawLaserScan(ctx, laserScan, coord.worldToCanvas, robot);
      }

      // navigation
      if (mode === "navigation") {
        if (waypoints) {
          drawWaypoints(ctx, waypoints, coord.worldToCanvas);
        }
        if (plan && isPlan) {
          drawPath(ctx, plan, coord.worldToCanvas);
        }
        if ((operatingState === "addPoint" || operatingState === "setInitialPose") && editingNode) {
          console.log(editingNode);
          drawArrow(ctx, editingNode, coord);
        }
        if (global_costmap && isCostMap) {
          drawCostMap(ctx, global_costmap, coord.worldToCanvas);
        }
      }

      // editing
      if (mode === "editing") {
        drawFreePoints(ctx, freePoints);
      }
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [coord, ctxRef, editingNode, freePoints, global_costmap, isCostMap, isLaser, isPlan, laserScan, mode, operatingState, plan, robot, view.scale, waypoints]);

  return (
    <>
      {isLoad ?
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10
        }}>
          <div style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            地图加载中...
          </div>
        </div> : null}

      <Top></Top>
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
        isPlan={isPlan}
        setIsPlan={setIsPlan}
        isCostMap={isCostMap}
        setIsCostMap={setIsCostMap}
      ></Bottom>
      {robotControlMode === "open" ? <RobotControls></RobotControls> : null}
    </>
  );
};

export default CanvasMap;