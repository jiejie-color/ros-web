import React, { useCallback, useEffect, useRef, useState, } from 'react';
import useWebSocket from 'react-use-websocket';
import { WebSocketContext, SimpleEventEmitter, type TopicTypeMap } from '../../hooks/useWebSocket';
import type { Mode, SendMessageParams } from '../../type';
import type { Control_Launch_Message, Current_Map_Info_Message, Get_Map_List_Message, Launch_Status_Message, Map_Message } from '../../type/topicRespon';
import { CONTROL_LAUNCH_SERVICE, CURRENT_MAP_INFO_TOPIC, GET_MAP_LIST_SERVICE, LAUNCH_STATUS_TOPIC, MAP_TOPIC, PROJECTED_MAP_TOPIC } from '../../hooks/topic';

interface WebSocketProviderProps {
    children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const [emitter] = useState(new SimpleEventEmitter());
    const [curMap, setCurMap] = useState<string>("");
    const [isLoad, setIsLoad] = useState<boolean>(true);
    const [mode, setMode] = useState<Mode>(''); // 新增状态控制当前激活的模式
    const [mapList, setMapList] = useState<string[]>([]);
    const [curEditMap, setCurEditMap] = useState<string>("");
    const fragmentCache = useRef(new Map<string, string[]>())
    const [robotControlMode, setRobotControlMode] = useState<string>('close');
    const { sendMessage: wsSendMessage } = useWebSocket("ws://192.168.0.155:9090", {
        onMessage: (event) => {
            try {
                const res = JSON.parse(event.data);
                // ====== 处理分片 ======
                if (res.op === "fragment") {
                    const { num, total, data, id } = res;
                    if (!fragmentCache.current.has(id)) {
                        fragmentCache.current.set(id, []);
                    }

                    const arr = fragmentCache.current.get(id)!;
                    arr[num] = data;
                    if (arr.filter(Boolean).length === total) {
                        const full = arr.join("");
                        fragmentCache.current.delete(id);

                        const merged = JSON.parse(full);
                        const topic = merged.topic || merged.service;

                        if (topic) {
                            emitter.emit(topic, merged);
                        }
                    }
                    return;
                }
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
        const handleCurrentMapInfo = (res: Current_Map_Info_Message) => {
            setCurMap(res.msg.map_name)
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
        const handleMapTopic = (res: Map_Message) => setMapData(res)
        const handleProjectedMapTopic = (res: Map_Message) => setMapData(res)

        let topicToSubscribe: keyof TopicTypeMap;
        let handler: (res: Map_Message) => void;
        let topicId: string;
        if (mode === 'mapping') {
            topicToSubscribe = PROJECTED_MAP_TOPIC;
            handler = handleProjectedMapTopic;
            topicId = PROJECTED_MAP_TOPIC;
        } else if (mode === 'navigation') {
            topicToSubscribe = MAP_TOPIC;
            handler = handleMapTopic;
            topicId = MAP_TOPIC;
        } else if (mode === 'none') {
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
            return
        } else return
        // 订阅
        sendMessage({
            op: "subscribe",
            topic: topicToSubscribe,
            id: topicId
        });
        emitter.on(topicToSubscribe, (res) => {
            handler(res)
            setIsLoad(false)
        });

        return () => {
            sendMessage({
                op: "unsubscribe",
                topic: topicToSubscribe,
                id: topicId
            });
            emitter.off(topicToSubscribe, handler);
        }
    }, [emitter, mode, sendMessage]);

    useEffect(() => {
        const controlLaunchListener = (res: Control_Launch_Message) => {
            console.log(res)
            // setMode(res.values.success ? 'navigation' : 'none');
        };
        emitter.on(CONTROL_LAUNCH_SERVICE, controlLaunchListener);
        return () => {
            emitter.off(CONTROL_LAUNCH_SERVICE, controlLaunchListener);
        }
    }, [emitter, sendMessage])

    useEffect(() => {
        sendMessage({
            op: "subscribe",
            id: LAUNCH_STATUS_TOPIC,
            topic: LAUNCH_STATUS_TOPIC,
        });
        const launchStatusListener = (res: Launch_Status_Message) => {
            sendMessage({
                op: "unsubscribe",
                id: LAUNCH_STATUS_TOPIC,
                topic: LAUNCH_STATUS_TOPIC,
            });
            if (res.msg.mapping_running) {
                setMode('mapping');
            } else if (res.msg.navigation_running) {
                setMode('navigation');
            } else {
                setMode('none');
            }
        };
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
            setMapData, curEditMap,
            setCurEditMap,
            robotControlMode,
            setRobotControlMode,
            isLoad,
        }}>
            {children}
        </WebSocketContext.Provider>
    );
};