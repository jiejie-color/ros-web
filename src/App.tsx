import { useCallback, useState, useRef, useEffect, } from "react"; // 添加React和useState导入
import useWebSocket from "react-use-websocket";
import CanvasMap from "./components/CanvasMap/index.tsx";
import type { NavigationStatus, Waypoint, LaserScan, MySendMessage, PathPlan, SendMessageParams, LaunchStatus } from "./type";
import { Top } from "./components/Top/index.tsx";
import { quaternionToYaw } from "./components/CanvasMap/utils/index.ts";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Settings from "./components/Settings/index.tsx";
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
  const [isSetting, setIsSetting] = useState(false);
  const [mapList, setMapList] = useState<string[]>([]);
  const [launch_status, setLaunch_status] = useState<LaunchStatus | null>(null);
  const mapping_running = useRef<boolean>(false);

  // WebSocket地址配置
  const [mapWsUrl, setMapWsUrl] = useState<string>("ws://192.168.0.155:9090");
  const [robotWsUrl, setRobotWsUrl] = useState<string>("ws://192.168.0.155:8765");
  const [curMap, setCurMap] = useState<string>('')

  // 使用ref存储最新的sendMessage函数，以便在设置中可以触发重新连接
  const sendMessageRef = useRef<MySendMessage | null>(null);

  // 地图WebSocket连接
  const { sendMessage: sendMapMessage } = useWebSocket(mapWsUrl, {
    onMessage: (event) => {
      try {
        const res = JSON.parse(event.data); // 解析消息
        if (res.topic === "/map") {
          // 处理/map主题的返回
          setMapData(res.msg); // 更新地图数据状态
        }
        if (res.service === "/get_map_list") {
          setMapList(res.values.map_names ?? []); // 更新地图数据状态
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
        } else if (res.topic === '/launch_status') {
          setLaunch_status(res.msg);
        } else if (res.topic === '/current_map_info') {
          const map_name = res.msg.map_name ?? "";
          console.log(map_name);
          setCurMap(map_name);
        }
      } catch (e) {
        console.error("解析消息失败:", e);
      }
    },
    onError: (event) => {
      console.error("WebSocket error:", event);
    },
    onOpen: () => {
      const mySendMessage = (msg: SendMessageParams) => {
        sendMapMessage(JSON.stringify(msg));
      };

      sendMessageRef.current = mySendMessage;

      mySendMessage({ op: "subscribe", topic: "/map" });
      // mySendMessage(({ op: "subscribe", topic: "/amcl_pose" }));
      mySendMessage({ op: "subscribe", topic: "/navigation_status" })
      mySendMessage({
        op: "call_service",
        id: "call_list_waypoints_1",
        service: "/list_waypoints",
      });
      mySendMessage({
        op: "subscribe",
        id: "launch_status",
        topic: "/launch_status",
      }
      );
      mySendMessage({
        op: "subscribe",
        id: "current_map_info",
        topic: "/current_map_info",
      }
      );
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
      sendMapMessage((JSON.stringify(msg)));
    },
    [sendMapMessage]
  );

  useEffect(() => {
    // 在组件卸载时取消订阅
    if (launch_status?.mapping_running && !mapping_running.current) {
      mySendMessage(
        { op: "subscribe", topic: "/projected_map", id: "projected_map" }
      );
      mapping_running.current = true;
    }
  }, [launch_status, mySendMessage])
  // 处理重新连接
  const handleReconnect = useCallback((newMapWsUrl: string, newRobotWsUrl: string) => {
    setMapWsUrl(newMapWsUrl);
    setRobotWsUrl(newRobotWsUrl);
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div
              style={{ width: "100%", height: "100%", background: "#f0f0f0" }}
            >

              <button style={{
                position: "absolute",
                top: 20,
                color: "white",
                right: 20,
              }}
                onClick={() => { setIsSetting(true) }}
              >
                设置
              </button>
              {/* {mapData ? */}
              <>
                <Top
                  navigationStatus={navigationStatus}
                  sendMessage={mySendMessage}
                  launch_status={launch_status}
                  curMap={curMap}
                ></Top>
                {/* 传递地图数据给组件 */}
                <CanvasMap
                  robot={robot}
                  mapData={mapData}
                  waypoints={waypoints}
                  sendMessage={mySendMessage}
                  projected_map={projected_map}
                  laserScan={laserScan}
                  pathPlan={pathPlan} // 传递路径规划数据
                />
              </>
              {/* : */}
              {/* <div style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  fontSize: "18px",
                  color: "#666",
                  fontWeight: "normal"
                }}>暂无地图数据</div> */}
              {/* } */}
              {
                isSetting ? (
                  <Settings
                    onClose={() => setIsSetting(false)}
                    currentMapWsUrl={mapWsUrl}
                    currentRobotWsUrl={robotWsUrl}
                    onReconnect={handleReconnect}
                    mySendMessage={mySendMessage}
                    mapList={mapList}
                    curMap={curMap}
                  />
                ) : null
              }
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