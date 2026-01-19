import { useEffect, useState } from "react";
import { useWebSocketContext } from "../../hooks/useWebSocket";
import { CONTROL_LAUNCH_SERVICE, CURRENT_MAP_INFO_TOPIC, GET_EDITED_MAPS_SERVICE, NAVIGATION_STATUS_TOPIC, PAUSE_NAVIGATION_SERVICE, PROJECTED_MAP_TOPIC } from "../../hooks/topic";
import type { Get_Edited_Map_Message, Navigation_Status_Message } from "../../type/topicRespon";
import styles from "./styles.module.css";
import type { Mode } from "../../type";


export const Top = () => {

  const [navigationStatus, setNavigationStatus] = useState<Navigation_Status_Message>();
  const { sendMessage, emitter, curMap, mode, setMode, mapList, setMapData } = useWebSocketContext();
  const [curEditMap, setCurEditMap] = useState<string>();

  useEffect(() => {
    const navigationStatusListener = (res: Navigation_Status_Message) => setNavigationStatus(res);
    emitter.on(NAVIGATION_STATUS_TOPIC, navigationStatusListener);
    // 发送订阅消息
    sendMessage({ op: "subscribe", topic: NAVIGATION_STATUS_TOPIC });

    sendMessage({
      op: "subscribe",
      id: CURRENT_MAP_INFO_TOPIC,
      topic: CURRENT_MAP_INFO_TOPIC,
    });
    // 清理回调
    return () => {
      sendMessage({
        op: "unsubscribe",
        id: CURRENT_MAP_INFO_TOPIC,
        topic: CURRENT_MAP_INFO_TOPIC,
      });
      sendMessage({
        op: "unsubscribe",
        id: NAVIGATION_STATUS_TOPIC,
        topic: NAVIGATION_STATUS_TOPIC,
      });
      emitter.off(NAVIGATION_STATUS_TOPIC, navigationStatusListener);
    };
  }, [emitter, sendMessage]);


  const toggleMode = (type: Mode) => {
    setMode(type);
    if (type === "mapping") {
      sendMessage(
        ({
          op: "call_service",
          service: CONTROL_LAUNCH_SERVICE,
          args: {
            launch_type: "mapping",
            action: "start",
            package_name: "car_vel"
          },
          id: CONTROL_LAUNCH_SERVICE
        })
      )
      setTimeout(() => {
        sendMessage(
          { op: "subscribe", topic: PROJECTED_MAP_TOPIC, id: PROJECTED_MAP_TOPIC }
        );
      }, 3000);

    } else if (type === "navigation") {
      sendMessage(
        {
          op: "call_service",
          service: CONTROL_LAUNCH_SERVICE,
          id: "map_save_service",
          args: {
            launch_type: "mapping",
            action: "stop",
            package_name: "car_vel"
          },
        }
      )
      sendMessage(
        { op: "unsubscribe", topic: PROJECTED_MAP_TOPIC, id: PROJECTED_MAP_TOPIC }
      );
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
    }
  };

  useEffect(() => {
    if (curEditMap) {
      sendMessage({
        op: "call_service",
        service: GET_EDITED_MAPS_SERVICE,
        args: {
          map_name: curEditMap
        }
      });
    }
    const handleGetEditedMaps = (res: Get_Edited_Map_Message) => {
      // setMapData({
      //   msg: {
      //     info: {
      //       width: res.values.width,
      //       height: res.values.height,
      //       resolution: res.values.resolution,
      //       origin: { position: { x: number; y: number } };
      //     },
      //     data: res.values.image_data
      //   }
      // })
      // console.log("获取到编辑地图数据", res);
    };
    emitter.on(GET_EDITED_MAPS_SERVICE, handleGetEditedMaps);
    return () => {
      emitter.off(GET_EDITED_MAPS_SERVICE, handleGetEditedMaps);
    };
  }
    , [curEditMap, emitter, sendMessage])
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
        {mode === "navigation" ?
          <span style={{ margin: '0 20px' }}>
            当前地图: {curMap}
          </span> : null
        }

        <div className={styles["mode-tabs"]}>
          <div
            className={`${styles["tab"]} ${mode === 'navigation' ? styles["active"] : styles["inactive"]}`}
            onClick={() => toggleMode('navigation')}
          >
            {'导航模式'}
          </div>
          <div
            className={`${styles["tab"]} ${mode === 'mapping' ? styles["active"] : styles["inactive"]}`}
            onClick={() => toggleMode('mapping')}
          >
            {'建图模式'}
          </div>
          <div
            className={`${styles["tab"]} ${mode === 'editing' ? styles["active"] : styles["inactive"]}`}
            onClick={() => toggleMode('editing')}
          >
            {'编辑地图模式'}
          </div>
        </div>
        {
          mode === "editing" ?
            <>
              选择地图:
              <select
                name="mapList"
                value={curEditMap || ''}
                onChange={(e) => {
                  // 当选择不同地图时，可以触发切换地图的操作
                  if (e.target.value !== curMap) {
                    setCurEditMap(e.target.value);
                  }
                }}
                className={styles["map-select"]}
              >
                {mapList.map((mapName) => (
                  <option key={mapName} value={mapName}>
                    {mapName}
                  </option>
                ))}
              </select>
            </> : null
        }


        {navigationStatus
          ? `导航状态: ${navigationStatus?.msg.status} 导航点位: ${navigationStatus?.msg.waypoint_name}`
          : null}
        {navigationStatus?.msg.status === "navigating" ? (
          <button
            style={{ marginLeft: 10 }}
            onClick={() => {
              sendMessage(
                ({
                  op: "call_service",
                  service: PAUSE_NAVIGATION_SERVICE,
                  id: PAUSE_NAVIGATION_SERVICE,
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
