import { useCallback, useState } from "react"; // 添加React和useState导入
import useWebSocket, { } from "react-use-websocket";
import CanvasMap from "./components/CanvasMap/index.tsx";
import type { NavigationStatus, Waypoint, LaserScan, MySendMessage, PathPlan } from "./type";
import { Top } from "./components/Top/index.tsx";
import { quaternionToYaw } from "./components/CanvasMap/utils/index.ts";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { Cartographer_map } from "./pages/projected_map/index.tsx";


function App() {
  // 矩形固定在世界坐标系
  const [mapData, setMapData] = useState(null); // 添加状态存储地图数据
  const [projected_map, setProjected_map] = useState(null); // 添加状态存储地图数据
  const [robot, setRobot] = useState({ x: 0, y: 0, yaw: 0 });
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [navigationStatus, setNavigationStatus] =
    useState<NavigationStatus | null>(null); // 新增导航状态存储
  const [laserScan, setLaserScan] = useState<LaserScan | null>(null);
  const [pathPlan, setPathPlan] = useState<PathPlan | null>(null); // 新增路径规划状态存储

  // const { sendMessage } = useWebSocket("ws://192.168.0.152:9090", {
  const { sendMessage } = useWebSocket("ws://192.168.0.155:9090", {
    onMessage: (event) => {
      try {
        const res = JSON.parse(event.data); // 解析消息
        if (res.topic === "/map") {
          // 处理/map主题的返回
          setMapData(res.msg); // 更新地图数据状态
        }
        // else if (res.topic === "/amcl_pose") {
        //   const p = res.msg.pose.pose.position;
        //   const q = res.msg.pose.pose.orientation;

        //   setRobot({
        //     x: p.x,
        //     y: p.y,
        //     yaw: quaternionToYaw(q),
        //   });
        // } 
        else if (res.service === "/list_waypoints") {
          setWaypoints(res.values.waypoints ?? []);
        } else if (res.topic === "/navigation_status") {
          // 处理导航状态主题
          setNavigationStatus(res.msg);
        } else if (res.topic === "/projected_map") {
          // 处理导航状态主题
          setProjected_map(res.msg);
        } else if (res.topic === "/robot_pose") {
          const pos = res.msg.pose.position;
          const ori = res.msg.pose.orientation;
          const yaw = quaternionToYaw(ori);
          // 处理导航状态主题
          setRobot({
            x: pos.x,
            y: pos.y,
            yaw,
          });
        } else if (res.topic === "/scan") {
          setLaserScan(res.msg);
        } else if (res.topic === "/plan") {
          // 处理路径规划结果
          setPathPlan(res.msg);
        }
      } catch (e) {
        console.error("解析消息失败:", e);
      }
    },
    onError: (event) => {
      console.error("WebSocket error:", event);
    },
    onOpen: () => {
      mySendMessage({ op: "subscribe", topic: "/map" });
      // mySendMessage(({ op: "subscribe", topic: "/amcl_pose" }));
      mySendMessage({ op: "subscribe", topic: "/navigation_status" })
      mySendMessage({
        op: "call_service",
        id: "call_list_waypoints_1",
        service: "/list_waypoints",
      }
      );
      // mySendMessage(
      //   { op: "subscribe", topic: "/projected_map" }
      // );
      mySendMessage(
        {
          op: "subscribe",
          topic: "/robot_pose",
          throttle_rate: 200, // ms，20Hz
        }
      );
    },
  });
  const mySendMessage = useCallback<MySendMessage>(
    (msg) => {
      console.log("发送消息:", msg);
      sendMessage((JSON.stringify(msg)));
    },
    [sendMessage]
  );
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div
              style={{ width: "100%", height: "100%", background: "#f0f0f0" }}
            >
              {mapData ? <>
                <Top
                  navigationStatus={navigationStatus}
                  sendMessage={mySendMessage}
                ></Top>
                <button style={{
                  position: "absolute",
                  top: 20,
                  color: "white",
                  right: 20,
                }}>
                  设置
                </button>
                {/* 传递地图数据给组件 */}
                <CanvasMap
                  robot={robot}
                  mapData={mapData}
                  waypoints={waypoints}
                  sendMessage={mySendMessage}
                  projected_map={projected_map}
                  laserScan={laserScan}
                  pathPlan={pathPlan} // 传递路径规划数据
                /></> : <div style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  fontSize: "18px",
                  color: "#666",
                  fontWeight: "normal"
                }}>暂无地图数据</div>}

            </div>
          }
        />
        {/* <Route
          path="/projected_map"
          element={
            <CanvasMap
              robot={robot}
              mapData={projected_map}
              waypoints={waypoints}
              sendMessage={sendMessage}
            />
          }
        /> */}
      </Routes>
    </Router>
  );
}

export default App;