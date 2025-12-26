import { useEffect, useState } from "react";
import type { ContextTarget, WaypointEditState } from "../types";
import { hitTestWaypoint } from "../utils/hitTest";
import type { Waypoint } from "../../../type";
import type { SendMessage } from "react-use-websocket";
import type { Coord } from "../hooks/usePanZoom";
import { getMouseCanvasPos } from "../utils";
interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  waypoints: Waypoint[];
  coord: Coord;
  setEditingNode: (node: Waypoint | null) => void;
  sendMessage: SendMessage;
  // isSetWaypoint: boolean;
  waypointEditState: WaypointEditState;
  setIsEditingNode: (isEditing: boolean) => void;
}
export const ContextMenu = ({
  canvasRef,
  waypoints,
  coord,
  sendMessage,
  waypointEditState,
  // setEditingNode,
  // setIsEditingNode,
}: Props) => {
  const [contextTarget, setContextTarget] = useState<ContextTarget>({
    type: "empty",
  });
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    wx: 0,
    wy: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const { x: cx, y: cy } = getMouseCanvasPos(e, canvas);
      const { x: wx, y: wy } = coord.canvasToWorld(cx, cy);

      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        wx,
        wy,
      });
    };

    const onClick = () => {
      setContextMenu((m) => ({ ...m, visible: false }));
    };

    canvas.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("click", onClick);

    return () => {
      canvas.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("click", onClick);
    };
  }, [canvasRef, coord]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const move = (e: MouseEvent) => {
      const { x: cx, y: cy } = getMouseCanvasPos(e, canvas);
      const hit = hitTestWaypoint(cx, cy, waypoints, coord.worldToCanvas);
      if (waypointEditState === "drag") {
        if (hit) {
          canvas.style.cursor = "pointer";
        } else {
          canvas.style.cursor = "";
        }
      }
      if (!hit) {
        setContextMenu((m) => ({ ...m, visible: false }));
      }
      setContextTarget(
        hit ? { type: "waypoint", waypoint: hit } : { type: "empty" }
      );
    };

    canvas.addEventListener("mousemove", move);
    return () => canvas.removeEventListener("mousemove", move);
  }, [waypoints, canvasRef, coord, waypointEditState]);

  return (
    <>
      {contextMenu.visible && (
        <div
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "#1f1f1f",
            color: "#fff",
            borderRadius: 4,
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            zIndex: 1000,
            fontSize: 14,
          }}
        >
          {/* {contextTarget.type === "empty" ? (
            <div
              style={{ padding: "8px 14px", cursor: "pointer" }}
              onClick={async () => {
                setEditingNode({
                  x: contextMenu.wx,
                  y: contextMenu.wy,
                  theta: 0,
                  name: "",
                });
                setIsEditingNode(true);
                setContextMenu((m) => ({ ...m, visible: false }));
              }}
            >
              ➕ 添加节点
            </div>
          ) : null} */}
          {contextTarget.type === "waypoint" ? (
            <>
              <div
                style={{ padding: "8px 14px", cursor: "pointer" }}
                onClick={async () => {
                  sendMessage(
                    JSON.stringify({
                      op: "call_service",
                      id: `call_multi_navigate_${Date.now()}`,
                      service: "/multi_navigate",
                      args: {
                        waypoint_ids: [contextTarget.waypoint.id],
                      },
                    })
                  );
                }}
              >
                🧭 导航到此
              </div>
              <div
                style={{ padding: "8px 14px", cursor: "pointer" }}
                onClick={async () => {
                  sendMessage(
                    JSON.stringify({
                      op: "call_service",
                      id: `call_delete_waypoint_${Date.now()}`,
                      service: "/delete_waypoint",
                      args: {
                        id: contextTarget.waypoint.id,
                      },
                    })
                  );
                  sendMessage(
                    JSON.stringify({
                      op: "call_service",
                      id: `create_waypoint_${Date.now() + 1}`,
                      service: "/list_waypoints",
                      args: {},
                    })
                  );
                }}
              >
                🧭 删除点位
              </div>
            </>
          ) : null}
        </div>
      )}
    </>
  );
};
