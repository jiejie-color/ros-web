import { useEffect, useMemo, useRef, useState } from "react";
import type { MapMessage, Waypoint } from "../../../type";
import type { Offset, WaypointEditState } from "../types";
import { getMouseCanvasPos } from "../utils";

export interface Coord {
  worldToCanvas: (wx: number, wy: number) => Offset;
  canvasToWorld: (cx: number, cy: number) => Offset;
}

export const usePanZoom = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  waypointEditState: WaypointEditState,
  setWaypointEditState: React.Dispatch<React.SetStateAction<WaypointEditState>>,
  setEditingNode: React.Dispatch<React.SetStateAction<Waypoint | null>>,
  setIsEditingNode: React.Dispatch<React.SetStateAction<boolean>>,
  mapData: MapMessage | null
) => {
  const [view, setView] = useState({
    scale: 1,
    offset: { x: 0, y: 0 },
  });

  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const coord = useMemo<Coord>(
    () => ({
      worldToCanvas: (wx: number, wy: number) => ({
        x: wx * view.scale + view.offset.x,
        y: -wy * view.scale + view.offset.y,
      }),
      canvasToWorld: (cx: number, cy: number) => ({
        x: (cx - view.offset.x) / view.scale,
        y: -(cy - view.offset.y) / view.scale,
      }),
    }),
    [view]
  );

  // Zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { x: mx, y: my } = getMouseCanvasPos(e, canvas);
      setView((view) => {
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = view.scale * factor;
        const newOffset = {
          x: mx - ((mx - view.offset.x) / view.scale) * newScale,
          y: my - ((my - view.offset.y) / view.scale) * newScale,
        };
        return { scale: newScale, offset: newOffset };
      });
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [canvasRef]);

  // 鼠标拖拽 添加点位旋转箭头
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const down = (e: MouseEvent) => {
      /** 设点位模式 */
      setWaypointEditState((prev) => {
        if (prev === "addPoint") {
          const { x, y } = getMouseCanvasPos(e, canvas);
          const { x: wx, y: wy } = coord.canvasToWorld(x, y);
          // 第一次点击：确定位置
          setEditingNode({
            x: wx, // 世界坐标（米）
            y: wy,
            theta: 0, // 弧度
            name: "",
          });
          return "rotating";
        } else if (prev === "rotating") {
          // 第二次点击：确认方向
          setIsEditingNode(true);
          return "drag";
        } else {
          /** 普通拖拽地图 */
          isDragging.current = true;
          lastMouse.current = { x: e.clientX, y: e.clientY };
          return "drag";
        }
      });
    };
    const move = (e: MouseEvent) => {
      const { x, y } = getMouseCanvasPos(e, canvas);
      /** 旋转箭头 */
      if (waypointEditState === "rotating") {
        setEditingNode((node) => {
          if (!node) return null;
          const { x: cx, y: cy } = coord.worldToCanvas(node.x, node.y);
          const dx = x - cx;
          const dy = cy - y;
          const theta = Math.atan2(dy, dx);
          return { ...node, theta };
        });
      } else {
        /** 拖地图 */
        if (!isDragging.current) return;
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        setView((v) => ({
          ...v,
          offset: { x: v.offset.x + dx, y: v.offset.y + dy },
        }));
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }
    };
    const up = () => {
      if (waypointEditState === "drag") {
        isDragging.current = false;
      }
    };

    canvas.addEventListener("mousedown", down);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);

    return () => {
      canvas.removeEventListener("mousedown", down);
      canvas.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [
    canvasRef,
    coord,
    setEditingNode,
    setIsEditingNode,
    setWaypointEditState,
    waypointEditState,
  ]);

  //地图 初始化 自适应 居中 放大
  useEffect(() => {
    if (!mapData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const { width, height, resolution, origin } = mapData.info;

    const canvasW = canvas.clientWidth;
    const canvasH = canvas.clientHeight;

    const worldW = width * resolution;
    const worldH = height * resolution;

    const s = Math.min(canvasW / worldW, canvasH / worldH) * 0.9;
    setView({
      scale: s,
      offset: {
        x: canvasW / 2 - (origin.position.x + worldW / 2) * s,
        y: canvasH / 2 - (origin.position.y + worldH / 2) * s,
      },
    });
  }, [mapData, canvasRef]);
  return {
    coord,
    view,
  };
};
