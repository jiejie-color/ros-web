import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapMessage, Waypoint } from "../../../type";
import type { Offset, OperatingState } from "../types";
import { getMouseCanvasPos } from "../utils";
import type { SendMessage } from "react-use-websocket";

export interface Coord {
  worldToCanvas: (wx: number, wy: number) => Offset;
  canvasToWorld: (cx: number, cy: number) => Offset;
}
export interface View {
  scale: number;
  offset: { x: number; y: number };
}

export const usePanZoom = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  operatingState: OperatingState,
  setOperatingState: React.Dispatch<React.SetStateAction<OperatingState>>,
  setEditingNode: React.Dispatch<React.SetStateAction<Waypoint | null>>,
  setIsEditingNode: React.Dispatch<React.SetStateAction<boolean>>,
  mapData: MapMessage | null,
  sendMessage: SendMessage,
  editingNode: Waypoint | null,
  setMapRotation: React.Dispatch<React.SetStateAction<number>>,
  mapRotation: number
) => {
  const [view, setView] = useState<View>({
    scale: 1,
    offset: { x: 0, y: 0 },
  });

  const isDragging = useRef(false);
  const isRotating = useRef(false);
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

  const down = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (operatingState === "drag") {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
      } else if (
        operatingState === "addPoint" ||
        operatingState === "setInitialPose"
      ) {
        const { x, y } = getMouseCanvasPos(e, canvas!);
        const { x: wx, y: wy } = coord.canvasToWorld(x, y);
        // 第一次点击：确定位置
        setEditingNode({
          x: wx, // 世界坐标（米）
          y: wy,
          theta: 0, // 弧度
          name: "",
        });
      } else if (operatingState === "rotate") {
        isRotating.current = true;
        const { x: mx, y: my } = getMouseCanvasPos(e, canvas);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const dx = mx - centerX;
        const dy = centerY - my;
        lastMouse.current = { x: Math.atan2(dy, dx), y: 0 }; // 记录初始角度
      }
    },
    [canvasRef, coord, operatingState, setEditingNode]
  );
  const move = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = getMouseCanvasPos(e, canvas!);
      if (operatingState === "drag") {
        /** 拖地图 */
        if (!isDragging.current) return;
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        // 根据 mapRotation 旋转拖拽向量
        const cos = Math.cos(-mapRotation);
        const sin = Math.sin(-mapRotation);
        const dx_rot = dx * cos - dy * sin;
        const dy_rot = dx * sin + dy * cos;
        setView((v) => ({
          ...v,
          offset: { x: v.offset.x + dx_rot, y: v.offset.y + dy_rot },
        }));
        lastMouse.current = { x: e.clientX, y: e.clientY };
      } else if (
        operatingState === "addPoint" ||
        operatingState === "setInitialPose"
      ) {
        isDragging.current = false;
        /** 旋转箭头 */
        setEditingNode((node) => {
          if (!node) return null;
          const { x: cx, y: cy } = coord.worldToCanvas(node.x, node.y);
          const dx = x - cx;
          const dy = cy - y;
          const theta = Math.atan2(dy, dx);
          return { ...node, theta };
        });
      } else if (operatingState === "rotate") {
        /** 旋转地图 */
        if (!isRotating.current) return;
        const { x: mx, y: my } = getMouseCanvasPos(e, canvas);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const dx = mx - centerX;
        const dy = centerY - my;
        const currentTheta = Math.atan2(dy, dx);
        const deltaTheta = currentTheta - lastMouse.current.x;
        setMapRotation((prev) => prev - deltaTheta);
        lastMouse.current.x = currentTheta;
      }
    },
    [canvasRef, coord, operatingState, setEditingNode, setMapRotation, mapRotation]
  );
  const up = useCallback(() => {
    if (operatingState === "drag") {
      isDragging.current = false;
    } else if (operatingState === "rotate") {
      isRotating.current = false;
    } else if (operatingState === "addPoint") {
      // 第二次点击：确定方向，完成添加
      setOperatingState("");
      setIsEditingNode(true);
    } else if (operatingState === "setInitialPose") {
      // 第二次点击：确定方向，完成设置初始位置
      setOperatingState("");
      sendMessage(
        JSON.stringify({
          op: "call_service",
          service: "/initial_pose_service",
          args: {
            x: editingNode!.x,
            y: editingNode!.y,
            z: 0,
            roll: 0,
            pitch: 0,
            yaw: editingNode!.theta,
          },
        })
      );
      setEditingNode(null);
    }
  }, [
    setOperatingState,
    operatingState,
    setIsEditingNode,
    sendMessage,
    editingNode,
    setEditingNode,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("mousedown", down);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", up);
    return () => {
      canvas.removeEventListener("mousedown", down);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", up);
    };
  }, [canvasRef, down, move, up]);

  const canvasInit = useCallback(() => {
    if (!mapData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const { width, height, resolution, origin } = mapData.info;

    const canvasW = canvas.clientWidth;
    const canvasH = canvas.clientHeight;

    const worldW = width * resolution;
    const worldH = height * resolution;
    const s = Math.min(canvasW / worldW, canvasH / worldH) * 0.9;
    setView(() => {
      return {
        scale: s,
        offset: {
          x: canvasW / 2 - (origin.position.x + worldW / 2) * s,
          y: canvasH / 2 + (origin.position.y + worldH / 2) * s,
        },
      };
    });
  }, [mapData, canvasRef]);

  //地图 初始化 自适应 居中 放大
  useEffect(() => {
    canvasInit();
  }, [canvasInit]);
  useEffect(() => {
    window.addEventListener("resize", canvasInit);
    return () => window.removeEventListener("resize", canvasInit);
  }, [canvasInit]);
  return {
    coord,
    view,
    setView,
  };
};
