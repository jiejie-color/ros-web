import type { OperatingState } from "../CanvasMap/types";
import type { Mode, MySendMessage } from "../../type";

export const Bottom = ({
  canvasRef,
  setOperatingState,
  operatingState,
  mode,
  setMode,
  setIsLaser,
  isLaser,
  sendMessage,
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
  sendMessage: MySendMessage;
  isPlan: boolean;
  setIsPlan: React.Dispatch<React.SetStateAction<boolean>>;
  isRobotControls: boolean;
  setIsRobotControls: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
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
        {mode === 'navigation' ? <>
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
              sendMessage(
                ({
                  op: "call_service",
                  service: "/control_launch",
                  args: {
                    launch_type: "mapping",
                    action: "start",
                    package_name: "car_vel"
                  },
                  id: "control_launch"
                })
              )
              sendMessage(
                { op: "subscribe", topic: "/projected_map" }
              );
              setMode("mapping");
            }}
          >
            {"建图模式"}
          </button>
          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              if (!isPlan) {
                sendMessage(
                  (
                    {
                      op: "subscribe",
                      topic: "/plan",
                      throttle_rate: 100, // ms，10Hz
                    }
                  )
                );
              } else {
                sendMessage(
                  (
                    {
                      op: "unsubscribe",
                      topic: "/plan",
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
                      topic: "/scan",
                      throttle_rate: 100, // ms，10Hz
                    }
                  )
                );
              } else {
                sendMessage(
                  (
                    {
                      op: "unsubscribe",
                      topic: "/scan",
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
            {operatingState === "freeErase" ? "取消编辑地图" : "编辑地图"}
          </button>
        </>
          :
          <>
            <button
              style={{ padding: 12, marginRight: 20 }}
              onClick={() => {
                setMode("navigation");
                sendMessage(
                  ({
                    op: "call_service",
                    service: "/control_launch",
                    id: "map_save_service",
                    args: {
                      launch_type: "mapping",
                      action: "stop",
                      package_name: "car_vel"
                    },
                  })
                )
              }}
            >
              {"导航模式"}
            </button>
            <button
              style={{ padding: 12, marginLeft: 20 }}
              onClick={() => {
                sendMessage(
                  ({
                    op: "call_service",
                    service: "/map_save_service",
                    id: "map_save_service",
                    args: {},
                  })
                )
                sendMessage(
                  ({
                    op: "call_service",
                    service: "/control_launch",
                    args: {
                      launch_type: "mapping",
                      action: "stop",
                      package_name: "car_vel"
                    },
                  })
                )
                sendMessage(
                  ({
                    op: "call_service",
                    service: "/control_launch",
                    args: {
                      launch_type: "car_vel",
                      action: "start",
                      package_name: "car_vel"
                    },
                  })
                )
                sendMessage(
                  ({
                    op: "call_service",
                    service: "/control_launch",
                    args: {
                      launch_type: "car_vel",
                      action: "stop",
                      package_name: "car_vel"
                    },
                  })
                )
                setMode("navigation");
              }}
            >
              保存
            </button>
          </>}

      </div >
    </>
  );
};
