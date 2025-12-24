import React, { useCallback, useState } from "react"; // 添加React和useState导入
import useWebSocket from "react-use-websocket";
import CanvasMap from "./components/CanvasMap/index.tsx";
import { Children } from "./components/Children.tsx";
import type { NavigationStatus, Waypoint } from "./type";
import { Top } from "./components/Top/index.tsx";
import { quaternionToYaw } from "./components/CanvasMap/utils/index.ts";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  // 矩形固定在世界坐标系
  const [mapData, setMapData] = useState(null); // 添加状态存储地图数据
  const [robot, setRobot] = useState({ x: 0, y: 0, yaw: 0 });
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [navigationStatus, setNavigationStatus] =
    useState<NavigationStatus | null>(null); // 新增导航状态存储

  const { sendMessage } = useWebSocket("ws://192.168.0.152:9090", {
    onMessage: (event) => {
      try {
        const res = JSON.parse(event.data); // 解析消息
        if (res.topic === "/map") {
          // 处理/map主题的返回
          setMapData(res.msg); // 更新地图数据状态
        } else if (res.topic === "/amcl_pose") {
          const p = res.msg.pose.pose.position;
          const q = res.msg.pose.pose.orientation;

          setRobot({
            x: p.x,
            y: p.y,
            yaw: quaternionToYaw(q),
          });
        } else if (res.service === "/list_waypoints") {
          setWaypoints(res.values.waypoints);
        } else if (res.topic === "/navigation_status") {
          // 处理导航状态主题
          setNavigationStatus(res.msg);
        }
      } catch (e) {
        console.error("解析消息失败:", e);
      }
    },
    onError: (event) => {
      console.error("WebSocket error:", event);
    },
    onOpen: () => {
      sendMessage(JSON.stringify({ op: "subscribe", topic: "/map" }));
      sendMessage(JSON.stringify({ op: "subscribe", topic: "/amcl_pose" }));
      sendMessage(
        JSON.stringify({ op: "subscribe", topic: "/navigation_status" })
      );
      sendMessage(
        JSON.stringify({
          op: "call_service",
          id: "call_list_waypoints_1",
          service: "/list_waypoints",
        })
      );
    },
  });
  const [count, setCount] = useState(0);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div
              style={{ width: "100%", height: "100%", background: "#f0f0f0" }}
            >
              <Top
                navigationStatus={navigationStatus}
                sendMessage={sendMessage}
              ></Top>
              {/* 传递地图数据给组件 */}
              <CanvasMap
                robot={robot}
                mapData={mapData}
                waypoints={waypoints}
                sendMessage={sendMessage}
              />
            </div>
          }
        />
        <Route
          path="/aaaa"
          element={
            <div>
              {count}
              <Children mySetCount={setCount}></Children>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
