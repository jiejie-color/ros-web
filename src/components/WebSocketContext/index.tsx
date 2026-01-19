import React, { useCallback, useEffect, useState, } from 'react';
import useWebSocket from 'react-use-websocket';
import { WebSocketContext, SimpleEventEmitter } from '../../hooks/useWebSocket';
import type { Mode, SendMessageParams } from '../../type';
import type { Current_Map_Info_Message, Get_Map_List_Message, Launch_Status_Message, Map_Message } from '../../type/topicRespon';
import { CONTROL_LAUNCH_SERVICE, CURRENT_MAP_INFO_TOPIC, GET_MAP_LIST_SERVICE, LAUNCH_STATUS_TOPIC, MAP_TOPIC, PROJECTED_MAP_TOPIC } from '../../hooks/topic';

interface WebSocketProviderProps {
    children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const [emitter] = useState(new SimpleEventEmitter());
    const [curMap, setCurMap] = useState<string>("");
    const [mode, setMode] = useState<Mode>('navigation'); // 新增状态控制当前激活的模式
    const [mapList, setMapList] = useState<string[]>([]);
    const { sendMessage: wsSendMessage } = useWebSocket("ws://192.168.0.155:9090", {
        onMessage: (event) => {
            try {
                const res = JSON.parse(event.data);
                const topic = res.topic || res.service;
                if (topic) {
                    emitter.emit(topic, res);
                }
            } catch (e) {
                console.error('解析消息失败:', e);
            }
        },
        onError: (event) => {
            console.error('WebSocket error:', event);
        },
        onOpen: () => {
            console.log('WebSocket connected');
        },
    });

    const [mapData, setMapData] = useState<Map_Message | null>(null); // 添加状态存储地图数据
    const sendMessage = useCallback((msg: SendMessageParams) => {
        wsSendMessage(JSON.stringify(msg));
    }, [wsSendMessage]);
    useEffect(() => {
        const handleMapTopic = (res: Map_Message) => {
            if (mode === "navigation")
                setMapData(res)
            else {
                setMapData(null)
            }
        };
        sendMessage({ op: "subscribe", topic: MAP_TOPIC });
        emitter.on(MAP_TOPIC, handleMapTopic);

        const handleProjectedMapTopic = (res: Map_Message) => {
            if (mode === "mapping")
                setMapData(res)
            else {
                setMapData(null)
            }
        };
        emitter.on(PROJECTED_MAP_TOPIC, handleProjectedMapTopic);
        return () => {
            sendMessage({ op: "unsubscribe", topic: MAP_TOPIC });
            emitter.off(MAP_TOPIC, handleMapTopic);

            sendMessage({ op: "unsubscribe", topic: PROJECTED_MAP_TOPIC });
            emitter.off(PROJECTED_MAP_TOPIC, handleProjectedMapTopic);
        }
    }, [emitter, mode, sendMessage])

    useEffect(() => {
        const handleCurrentMapInfo = (res: Current_Map_Info_Message) => {
            setCurMap(res.msg.map_name)
            emitter.off(CURRENT_MAP_INFO_TOPIC, handleCurrentMapInfo);
            sendMessage({
                op: "unsubscribe",
                id: CURRENT_MAP_INFO_TOPIC,
                topic: CURRENT_MAP_INFO_TOPIC,
            });
        };
        sendMessage({
            op: "subscribe",
            id: CURRENT_MAP_INFO_TOPIC,
            topic: CURRENT_MAP_INFO_TOPIC,
        });
        emitter.on(CURRENT_MAP_INFO_TOPIC, handleCurrentMapInfo);
        return () => {
            emitter.off(CURRENT_MAP_INFO_TOPIC, handleCurrentMapInfo);
            sendMessage({
                op: "unsubscribe",
                id: CURRENT_MAP_INFO_TOPIC,
                topic: CURRENT_MAP_INFO_TOPIC,
            });
        }
    }, [emitter, sendMessage]);
    useEffect(() => {
        const launchStatusListener = (res: Launch_Status_Message) => {
            if (res.msg.mapping_running) {
                setMode('mapping');
                sendMessage(
                    { op: "subscribe", topic: PROJECTED_MAP_TOPIC, id: PROJECTED_MAP_TOPIC }
                );
            } else if (res.msg.navigation_running) {
                setMode('navigation');
            } else {
                setMode('navigation');
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
            emitter.off(LAUNCH_STATUS_TOPIC, launchStatusListener);
            sendMessage({
                op: "unsubscribe",
                id: LAUNCH_STATUS_TOPIC,
                topic: LAUNCH_STATUS_TOPIC,
            });
        };
        emitter.on(LAUNCH_STATUS_TOPIC, launchStatusListener);
        sendMessage({
            op: "subscribe",
            id: LAUNCH_STATUS_TOPIC,
            topic: LAUNCH_STATUS_TOPIC,
        });
        emitter.on(LAUNCH_STATUS_TOPIC, launchStatusListener);
        return () => {
            emitter.off(LAUNCH_STATUS_TOPIC, launchStatusListener);
            sendMessage({
                op: "unsubscribe",
                id: LAUNCH_STATUS_TOPIC,
                topic: LAUNCH_STATUS_TOPIC,
            });
        }
    }, [emitter, sendMessage]);

    useEffect(() => {
        sendMessage(
            {
                "op": "call_service",
                "service": GET_MAP_LIST_SERVICE,
                "id": GET_MAP_LIST_SERVICE,
            }
        )
        const handleMapList = (res: Get_Map_List_Message) => setMapList(res.values.map_names ?? []);
        emitter.on(GET_MAP_LIST_SERVICE, handleMapList);
        return () => {
            emitter.off(GET_MAP_LIST_SERVICE, handleMapList);
        }
    }, [emitter, sendMessage]);

    return (
        <WebSocketContext.Provider value={{
            sendMessage, emitter, curMap, mode, setMode, mapList, mapData,
            setMapData,
        }}>
            {children}
        </WebSocketContext.Provider>
    );
};