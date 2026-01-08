import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapMessage, MySendMessage, Waypoint } from "../../../type";
import type { Offset, OperatingState } from "../types";
import { getMouseCanvasPos, getTouchCanvasPos, getClientPos } from "../utils";

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
  sendMessage: MySendMessage,
  editingNode: Waypoint | null,
  setMapRotation: React.Dispatch<React.SetStateAction<number>>,
  mapRotation: number,
  setFreePoints: React.Dispatch<React.SetStateAction<{ x: number; y: number }[]>>,
  freePoints: { x: number; y: number }[]
) => {
  const [view, setView] = useState<View>({
    scale: 1,
    offset: { x: 0, y: 0 },
  });
  // const setFreePoints = useRef<{ x: number; y: number }[]>([]);
  const isFreeDrawing = useRef(false);

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
    (e: MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (e instanceof TouchEvent) {
        e.preventDefault();
      }

      if (operatingState === "drag") {
        isDragging.current = true;
        const { x, y } = getClientPos(e);
        lastMouse.current = { x, y };
      } else if (
        operatingState === "addPoint" ||
        operatingState === "setInitialPose"
      ) {
        let pos;
        if (e instanceof TouchEvent) {
          pos = getTouchCanvasPos(e, canvas!);
        } else {
          pos = getMouseCanvasPos(e, canvas!);
        }
        const { x, y } = pos;
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
        let pos;
        if (e instanceof TouchEvent) {
          pos = getTouchCanvasPos(e, canvas);
        } else {
          pos = getMouseCanvasPos(e, canvas);
        }
        const { x: mx, y: my } = pos;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const dx = mx - centerX;
        const dy = centerY - my;
        lastMouse.current = { x: Math.atan2(dy, dx), y: 0 }; // 记录初始角度
      } else if (operatingState === "freeErase") {
        let pos;
        if (e instanceof TouchEvent) {
          pos = getTouchCanvasPos(e, canvas!);
        } else {
          pos = getMouseCanvasPos(e, canvas!);
        }
        setFreePoints([pos]);
        isFreeDrawing.current = true;
      }
    },
    [canvasRef, coord, setFreePoints, operatingState, setEditingNode]
  );
  const move = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (e instanceof TouchEvent) {
        e.preventDefault();
      }

      let pos;
      if (e instanceof TouchEvent) {
        pos = getTouchCanvasPos(e, canvas!);
      } else {
        pos = getMouseCanvasPos(e, canvas!);
      }
      const { x, y } = pos;

      if (operatingState === "drag") {
        /** 拖地图 */
        if (!isDragging.current) return;
        const { x: currentX, y: currentY } = getClientPos(e);
        const dx = currentX - lastMouse.current.x;
        const dy = currentY - lastMouse.current.y;
        // 根据 mapRotation 旋转拖拽向量
        const cos = Math.cos(-mapRotation);
        const sin = Math.sin(-mapRotation);
        const dx_rot = dx * cos - dy * sin;
        const dy_rot = dx * sin + dy * cos;
        setView((v) => ({
          ...v,
          offset: { x: v.offset.x + dx_rot, y: v.offset.y + dy_rot },
        }));
        lastMouse.current = { x: currentX, y: currentY };
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

        const { x: mx, y: my } = pos;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const dx = mx - centerX;
        const dy = centerY - my;
        const currentTheta = Math.atan2(dy, dx);
        const deltaTheta = currentTheta - lastMouse.current.x;
        setMapRotation((prev) => prev - deltaTheta);
        lastMouse.current.x = currentTheta;
      } else if (operatingState === "freeErase") {
        if (!isFreeDrawing.current) return;

        setFreePoints((prev) => [...prev, { x, y }]);
      }
    },
    [canvasRef, operatingState, mapRotation, setEditingNode, coord, setMapRotation, setFreePoints]
  );
  const worldToMapIndex = useCallback((wx: number, wy: number) => {
    const { resolution, origin, width, height } = mapData!.info;

    const mx = Math.floor((wx - origin.position.x) / resolution);
    const my = Math.floor((wy - origin.position.y) / resolution);

    if (mx < 0 || my < 0 || mx >= width || my >= height) return -1;

    return my * width + mx;
  }, [mapData]);
  const finalizeFreeErase = useCallback((canvas: HTMLCanvasElement) => {
    const polygon = freePoints;
    if (polygon.length < 3) return;

    // 1️⃣ 创建 mask canvas
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const mctx = maskCanvas.getContext("2d")!;

    mctx.fillStyle = "white";
    mctx.beginPath();
    mctx.moveTo(polygon[0].x, polygon[0].y);
    polygon.forEach(p => mctx.lineTo(p.x, p.y));
    mctx.closePath();
    mctx.fill();

    // 2️⃣ 获取像素
    const img = mctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    const indices: number[] = [];

    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const i = (y * img.width + x) * 4;
        if (img.data[i] === 255) {
          // 3️⃣ canvas → world
          const { x: wx, y: wy } = coord.canvasToWorld(x, y);

          // 4️⃣ world → map index
          const idx = worldToMapIndex(wx, wy);
          if (idx! >= 0) indices.push(idx!);
        }
      }
    }
    const sendEraseToROS = (indices: number[]) => {
      sendMessage({
        op: "call_service",
        topic: "/web_map_erase",
        args: { data: indices }
      });
    };
    if (window.confirm(`你确定要擦除 ${indices.length} 个栅格吗？`)) {
      sendEraseToROS(indices);
    } else {
      setFreePoints([]);
      console.log(indices)
    }

    // sendEraseToROS(indices);
  }, [coord, freePoints, sendMessage, setFreePoints, worldToMapIndex]);
  const up = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (e instanceof TouchEvent) {
        e.preventDefault();
      }

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
        sendMessage({
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
        });
        setEditingNode(null);
      } else if (operatingState === "freeErase") {
        isFreeDrawing.current = false;
        finalizeFreeErase(canvasRef.current!);
      }

    },
    [operatingState, setOperatingState, setIsEditingNode, sendMessage, editingNode, setEditingNode, canvasRef, finalizeFreeErase]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 添加鼠标事件监听器
    canvas.addEventListener("mousedown", down);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", up);
    canvas.addEventListener("mouseleave", up);

    // 添加触摸事件监听器
    canvas.addEventListener("touchstart", down, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", up, { passive: false });
    canvas.addEventListener("touchcancel", up, { passive: false });

    return () => {
      // 移除鼠标事件监听器
      canvas.removeEventListener("mousedown", down);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", up);
      canvas.removeEventListener("mouseleave", up);

      // 移除触摸事件监听器
      canvas.removeEventListener("touchstart", down);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", up);
      canvas.removeEventListener("touchcancel", up);
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
