import type { OperatingState } from "../CanvasMap/types";
import type { Mode, } from "../../type";
import { useWebSocketContext } from "../../hooks/useWebSocket";
import { CONTROL_LAUNCH_SERVICE, GLOBAL_COSTMAP_TOPIC, MAP_SAVE_SERVICE, PLAN_TOPIC, PROJECTED_MAP_TOPIC, SAVE_EDITED_MAPS_SERVICE, SCAN_TOPIC } from "../../hooks/topic";
import type { Save_Edited_Maps_Message } from "../../type/topicRespon";
import { useCallback, useEffect } from "react";

export const Bottom = ({
  canvasRef,
  setOperatingState,
  operatingState,
  mode,
  setMode,
  setIsLaser,
  isLaser,
  isPlan,
  setIsPlan,
  isCostMap,
  setIsCostMap,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  setOperatingState: React.Dispatch<React.SetStateAction<OperatingState>>;
  operatingState: OperatingState;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  setIsLaser: React.Dispatch<React.SetStateAction<boolean>>;
  isLaser: boolean;
  isPlan: boolean;
  setIsPlan: React.Dispatch<React.SetStateAction<boolean>>;
  isCostMap: boolean;
  setIsCostMap: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { sendMessage, curEditMap, emitter } = useWebSocketContext();


  const handleSaveEditedMaps = useCallback((res: Save_Edited_Maps_Message) => {
    if (res.values.success) {
      alert("地图保存成功");
    } else {
      alert("地图保存失败");
    }
  }, [])

  useEffect(() => {
    emitter.on(SAVE_EDITED_MAPS_SERVICE, handleSaveEditedMaps)
    return () => {
      emitter.off(SAVE_EDITED_MAPS_SERVICE, handleSaveEditedMaps)
    }
  }, [emitter, handleSaveEditedMaps])


  useEffect(() => {
    if (!isCostMap) return;

    sendMessage({
      op: "subscribe",
      topic: GLOBAL_COSTMAP_TOPIC,
      throttle_rate: 100,
    });

    return () => {
      sendMessage({
        op: "unsubscribe",
        topic: GLOBAL_COSTMAP_TOPIC,
      });
    };
  }, [isCostMap, sendMessage]);

  useEffect(() => {
    if (!isLaser) return;

    sendMessage({
      op: "subscribe",
      topic: SCAN_TOPIC,
      throttle_rate: 100, // ms，10Hz
    });

    return () => {
      sendMessage({
        op: "unsubscribe",
        topic: SCAN_TOPIC,
      });
    };
  }, [isLaser, sendMessage]);


  useEffect(() => {
    if (!isPlan) return;

    sendMessage({
      op: "subscribe",
      topic: PLAN_TOPIC,
      throttle_rate: 100, // ms，10Hz
    });

    return () => {
      sendMessage({
        op: "unsubscribe",
        topic: PLAN_TOPIC,
      });
    };
  }, [isPlan, sendMessage]);

  return (
    <>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          textAlign: "center",
          width: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: "12px ",
          borderRadius: "8px",
          zIndex: 1000,
        }}
      >
        <button
          style={{ padding: 12, marginRight: 20 }}
          onClick={() => {
            const canvas = canvasRef.current;
            if (operatingState !== "rotate") {
              canvas!.style.cursor = "pointer"; // 副作用：DOM操作
              setOperatingState("rotate"); // 状态更新
            } else {
              canvas!.style.cursor = ""; // 副作用：DOM操作
              setOperatingState(""); // 状态更新
            }
          }}
        >
          {operatingState === "rotate" ? "取消" : "旋转"}
        </button>
        <button
          style={{ padding: 12, marginRight: 20 }}
          onClick={() => {
            const canvas = canvasRef.current;
            if (operatingState !== "drag") {
              canvas!.style.cursor = "pointer"; // 副作用：DOM操作
              setOperatingState("drag"); // 状态更新
            } else {
              canvas!.style.cursor = ""; // 副作用：DOM操作
              setOperatingState(""); // 状态更新
            }
          }}
        >
          {operatingState === "drag" ? "取消" : "拖动"}
        </button>
        {mode === 'navigation' ? <>

          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              const canvas = canvasRef.current;
              if (operatingState !== "setInitialPose") {
                canvas!.style.cursor = "pointer"; // 副作用：DOM操作
                setOperatingState("setInitialPose"); // 状态更新
              } else {
                canvas!.style.cursor = ""; // 副作用：DOM操作
                setOperatingState(""); // 状态更新
              }
            }}
          >
            {operatingState === "setInitialPose" ? "取消" : "设置初始位置"}
          </button>
          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              const canvas = canvasRef.current;
              if (operatingState !== "addPoint") {
                canvas!.style.cursor = "pointer"; // 副作用：DOM操作
                setOperatingState("addPoint"); // 状态更新
              } else {
                canvas!.style.cursor = ""; // 副作用：DOM操作
                setOperatingState(""); // 状态更新
              }
            }}
          >
            {operatingState === "addPoint" ? "取消" : "添加节点"}
          </button>

          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              setIsPlan((prev) => !prev);
            }}
          >
            {isPlan ? "取消路径规划" : "路径规划"}
          </button>

          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {

              setIsLaser((prev) => !prev);
            }}
          >
            {isLaser ? "取消激光扫描模式" : "激光扫描模式"}
          </button>
          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              setIsCostMap((prev) => !prev);
            }}
          >
            {isCostMap ? "取消全局代价地图" : "全局代价地图"}
          </button>
          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              if (window.confirm(`确定要重启机器人吗？`)) {
                sendMessage(
                  ({
                    op: "call_service",
                    service: CONTROL_LAUNCH_SERVICE,
                    args: {
                      launch_type: "car_vel",
                      action: "restart",
                      package_name: "car_vel"
                    },
                    id: CONTROL_LAUNCH_SERVICE
                  })
                )
              }

            }}
          >
            {"重启"}
          </button>
        </>
          : null
        }
        {mode === "mapping" ? <>
          <button
            style={{ padding: 12, marginLeft: 20 }}
            onClick={() => {
              const mapName = prompt("请输入地图名称:", "地图_" + new Date().toISOString().slice(0, 10));
              if (mapName !== null) {
                sendMessage(
                  { op: "unsubscribe", topic: PROJECTED_MAP_TOPIC, id: PROJECTED_MAP_TOPIC }
                );
                sendMessage(
                  ({
                    op: "call_service",
                    service: MAP_SAVE_SERVICE,
                    id: MAP_SAVE_SERVICE,
                    args: {
                      map_name: mapName
                    },
                  })
                )
                sendMessage(
                  {
                    op: "call_service",
                    service: CONTROL_LAUNCH_SERVICE,
                    args: {
                      launch_type: "mapping",
                      action: "stop",
                      package_name: "car_vel"
                    },
                  }
                )
                sendMessage({
                  op: "call_service",
                  service: CONTROL_LAUNCH_SERVICE,
                  args: {
                    launch_type: "car_vel",
                    action: "start",
                    package_name: "car_vel"
                  },
                  id: CONTROL_LAUNCH_SERVICE
                });
                setMode("navigation");
              }
            }}
          >
            保存
          </button>
        </> : null}
        {mode === 'editing' ? <>
          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              const canvas = canvasRef.current;
              if (operatingState !== "freeErase") {
                canvas!.style.cursor = "pointer"; // 副作用：DOM操作
                setOperatingState("freeErase"); // 状态更新
              } else {
                canvas!.style.cursor = ""; // 副作用：DOM操作
                setOperatingState(""); // 状态更新
              }
            }}
          >
            {operatingState === "freeErase" ? "取消清除障碍" : "清除障碍"}
          </button>
          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              const canvas = canvasRef.current;
              if (operatingState !== "addObstacles") {
                canvas!.style.cursor = "pointer"; // 副作用：DOM操作
                setOperatingState("addObstacles"); // 状态更新
              } else {
                canvas!.style.cursor = ""; // 副作用：DOM操作
                setOperatingState(""); // 状态更新
              }
            }}
          >
            {operatingState === "addObstacles" ? "取消添加障碍" : "添加障碍"}
          </button>

          <button
            style={{ padding: 12, marginLeft: 20 }}
            onClick={() => {
              sendMessage({
                op: "call_service",
                service: SAVE_EDITED_MAPS_SERVICE,
                id: SAVE_EDITED_MAPS_SERVICE,
                args: {
                  map_name: curEditMap,
                }
              });
            }}
          >
            保存
          </button>
        </> : null}

      </div >
    </>
  );
};
