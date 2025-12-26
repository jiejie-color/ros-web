import type { SendMessage } from "react-use-websocket";
import type { NavigationStatus } from "../../type";

export const Top = ({
  navigationStatus,
  sendMessage,
}: {
  navigationStatus: NavigationStatus | null;
  sendMessage: SendMessage;
}) => {
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
        {navigationStatus
          ? `导航状态: ${navigationStatus?.status} 导航点位: ${navigationStatus?.waypoint_name}`
          : null}
        {navigationStatus?.status === "navigating" ? (
          <button
            style={{ marginLeft: 10 }}
            onClick={() => {
              sendMessage(
                JSON.stringify({
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
