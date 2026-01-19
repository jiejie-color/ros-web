import type { OperatingState } from "../CanvasMap/types";
import type { Mode, } from "../../type";
import { useWebSocketContext } from "../../hooks/useWebSocket";
import { CONTROL_LAUNCH_SERVICE, MAP_SAVE_SERVICE, PLAN_TOPIC, PROJECTED_MAP_TOPIC, SCAN_TOPIC } from "../../hooks/topic";

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
  isRobotControls,
  setIsRobotControls,
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
  isRobotControls: boolean;
  setIsRobotControls: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { sendMessage, } = useWebSocketContext();
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
              if (!isPlan) {
                sendMessage(
                  (
                    {
                      op: "subscribe",
                      topic: PLAN_TOPIC,
                      throttle_rate: 100, // ms，10Hz
                    }
                  )
                );
              } else {
                sendMessage(
                  (
                    {
                      op: "unsubscribe",
                      topic: PLAN_TOPIC,
                    }
                  )
                );
              }
              setIsPlan((prev) => !prev);

            }}
          >
            {isPlan ? "取消路径规划" : "路径规划"}
          </button>

          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              if (!isLaser) {
                sendMessage(
                  (
                    {
                      op: "subscribe",
                      topic: SCAN_TOPIC,
                      throttle_rate: 100, // ms，10Hz
                    }
                  )
                );
              } else {
                sendMessage(
                  (
                    {
                      op: "unsubscribe",
                      topic: SCAN_TOPIC,
                    }
                  )
                );
              }
              setIsLaser((prev) => !prev);
            }}
          >
            {isLaser ? "取消激光扫描模式" : "激光扫描模式"}
          </button>
          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              setIsRobotControls((prev) => !prev);
            }}
          >
            {isRobotControls ? "取消遥控" : "遥控"}
          </button>

          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              // setIsRobotControls((prev) => !prev);
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
              if (operatingState !== "freeErase") {
                canvas!.style.cursor = "pointer"; // 副作用：DOM操作
                setOperatingState("freeErase"); // 状态更新
              } else {
                canvas!.style.cursor = ""; // 副作用：DOM操作
                setOperatingState(""); // 状态更新
              }
            }}
          >
            {operatingState === "freeErase" ? "取消添加障碍" : "添加障碍"}
          </button>

          <button
            style={{ padding: 12, marginLeft: 20 }}
            onClick={() => { }}
          >
            保存
          </button>
        </> : null}

      </div >
    </>
  );
};
