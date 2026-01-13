import { useEffect, useRef, } from "react";
import type { LaunchStatus, MySendMessage, NavigationStatus } from "../../type";

export const Top = ({
  navigationStatus,
  sendMessage,
  launch_status,
  curMap
}: {
  navigationStatus: NavigationStatus | null;
  sendMessage: MySendMessage;
  launch_status: LaunchStatus | null;
  curMap: string;
}) => {
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!launch_status) {
      return;
    }
    const running = launch_status.navigation_running;

    if (!running && !hasStartedRef.current) {
      sendMessage({
        op: "call_service",
        service: "/control_launch",
        args: {
          launch_type: "car_vel",
          action: "start",
          package_name: "car_vel"
        },
        id: "control_launch"
      });

      hasStartedRef.current = true;
    }
  }, [launch_status, sendMessage]);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 10,
          textAlign: "center",
          width: "100%",
          color: "white",
        }}
      >
        <span style={{ margin: '0 20px' }}>
          当前地图: {curMap}
        </span>
        <span>
          {launch_status?.mapping_running
            ? `建图模式:开启`
            : null}
        </span>
        <span style={{ margin: '0 20px' }}>
          {launch_status?.navigation_running
            ? `导航模式:开启`
            : null}
        </span>


        {navigationStatus
          ? `导航状态: ${navigationStatus?.status} 导航点位: ${navigationStatus?.waypoint_name}`
          : null}
        {navigationStatus?.status === "navigating" ? (
          <button
            style={{ marginLeft: 10 }}
            onClick={() => {
              sendMessage(
                ({
                  op: "call_service",
                  service: "/pause_navigation",
                  id: "pause_navigation",
                })
              );
            }}
          >
            取消导航
          </button>
        ) : null}
      </div>
    </>
  );
};
