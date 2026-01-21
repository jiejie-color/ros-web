import { useCallback, useEffect, useState } from "react";
import { useWebSocketContext } from "../../hooks/useWebSocket";
import { CONTROL_LAUNCH_SERVICE, GET_EDITED_MAPS_SERVICE, MAP_TOPIC, NAVIGATION_STATUS_TOPIC, PAUSE_NAVIGATION_SERVICE, PROJECTED_MAP_TOPIC } from "../../hooks/topic";
import type { Get_Edited_Map_Message, Navigation_Status_Message } from "../../type/topicRespon";
import styles from "./styles.module.css";
import type { Mode } from "../../type";


export const Top = () => {

  const [navigationStatus, setNavigationStatus] = useState<Navigation_Status_Message>();
  const { sendMessage, emitter, curMap, mode, setMode, mapList, setMapData, curEditMap, setCurEditMap } = useWebSocketContext();

  useEffect(() => {
    const navigationStatusListener = (res: Navigation_Status_Message) => {
      setNavigationStatus(res)
    };
    emitter.on(NAVIGATION_STATUS_TOPIC, navigationStatusListener);
    // 发送订阅消息
    sendMessage({ op: "subscribe", topic: NAVIGATION_STATUS_TOPIC });

    // 清理回调
    return () => {
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
    setMapData({
      msg: {
        data: [],
        info: {
          width: 0,
          height: 0,
          resolution: 0,
          origin: {
            position: {
              x: 0,
              y: 0
            }
          }
        }
      }
    })

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
            package_name: "mapping"
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
      setTimeout(() => {
        sendMessage({
          op: "subscribe",
          topic: MAP_TOPIC,
          id: MAP_TOPIC
        });
      }, 3000);



    } else {
      setCurEditMap("")
    }
  };

  const handleGetEditedMaps = useCallback((res: Get_Edited_Map_Message) => {
    setMapData({
      msg: {
        info: {
          width: res.values.width,
          height: res.values.height,
          resolution: Number(res.values.resolution.toFixed(2)),
          origin: { position: { x: Number(res.values.origin[0].toFixed(2)), y: Number(res.values.origin[1].toFixed(2)) } },
        },
        data: res.values.image_data
      }
    })
  }, [setMapData]);
  useEffect(() => {
    emitter.on(GET_EDITED_MAPS_SERVICE, handleGetEditedMaps);
    return () => {
      emitter.off(GET_EDITED_MAPS_SERVICE, handleGetEditedMaps);
    }
  }, [emitter, handleGetEditedMaps]);
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
          <span className={styles["curMap"]}>
            📍 当前地图: <strong>{curMap || '未加载'}</strong>
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
                value={curEditMap}
                onChange={(e) => {
                  // 当选择不同地图时，可以触发切换地图的操作
                  if (e.target.value !== curEditMap) {
                    setCurEditMap(e.target.value);
                    sendMessage({
                      op: "call_service",
                      service: GET_EDITED_MAPS_SERVICE,
                      args: {
                        map_name: e.target.value
                      }
                    });
                  }
                }}
                className={styles["map-select"]}
              >
                <option value="">请选择地图</option>
                {mapList.map((mapName) => (
                  <option key={mapName} value={mapName}>
                    {mapName}
                  </option>
                ))}
              </select>
            </> : null
        }



        {navigationStatus
          ? <div className={styles["navigationStatus"]}>
            <span style={{ marginRight: '15px' }}>
              📍 状态: <strong>{navigationStatus?.msg.status}</strong>
            </span>
            <span>
              📍 目标: <strong>{navigationStatus?.msg.waypoint_name || '无'}</strong>
            </span>
          </div>
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
