import { createContext, useContext } from 'react';
import type { Mode, SendMessageParams, } from '../type';
import {
    CONTROL_LAUNCH_SERVICE, CURRENT_MAP_INFO_TOPIC,
    GET_EDITED_MAPS_SERVICE,
    GET_MAP_LIST_SERVICE, GLOBAL_COSTMAP_TOPIC, LAUNCH_STATUS_TOPIC, LIST_WAYPOINTS_SERVICE, MAP_TOPIC,
    NAVIGATION_STATUS_TOPIC, ODOMETRY_TOPIC, PLAN_TOPIC, PROJECTED_MAP_TOPIC, ROBOT_POSE_TOPIC, SAVE_EDITED_MAPS_SERVICE, SCAN_TOPIC
} from './topic';
import type {
    Control_Launch_Message, Current_Map_Info_Message,
    Get_Edited_Map_Message,
    Get_Map_List_Message, Global_Costmap_Message, Launch_Status_Message, List_Waypoints_Message, Map_Message,
    Navigation_Status_Message, Odometry_Message, Plan_Message, Robot_Bose_Message, Save_Edited_Maps_Message, Scan_Message
} from '../type/topicRespon';

// 定义每个主题对应的类型映射
export interface TopicTypeMap {
    [MAP_TOPIC]: Map_Message;
    [PROJECTED_MAP_TOPIC]: Map_Message;
    [ROBOT_POSE_TOPIC]: Robot_Bose_Message;
    [LIST_WAYPOINTS_SERVICE]: List_Waypoints_Message;
    [SCAN_TOPIC]: Scan_Message; // 根据需要定义具体类型
    [PLAN_TOPIC]: Plan_Message; // 根据需要定义具体类型
    [GET_MAP_LIST_SERVICE]: Get_Map_List_Message;
    [CURRENT_MAP_INFO_TOPIC]: Current_Map_Info_Message;
    [LAUNCH_STATUS_TOPIC]: Launch_Status_Message; // 根据需要定义具体类型
    [NAVIGATION_STATUS_TOPIC]: Navigation_Status_Message; // 根据需要定义具体类型
    [CONTROL_LAUNCH_SERVICE]: Control_Launch_Message; // 根据需要定义具体类型
    [ODOMETRY_TOPIC]: Odometry_Message; // 根据需要定义具体类型
    [GET_EDITED_MAPS_SERVICE]: Get_Edited_Map_Message;
    [SAVE_EDITED_MAPS_SERVICE]: Save_Edited_Maps_Message;
    [GLOBAL_COSTMAP_TOPIC]: Global_Costmap_Message; // 根据需要定义具体类型
}

type ListenerMap = {
    [K in keyof TopicTypeMap]: Array<(data: TopicTypeMap[K]) => void>;
};

// 泛型事件发射器，支持特定主题类型的监听
export class SimpleEventEmitter {
    private events: ListenerMap = {
        [MAP_TOPIC]: [],
        [PROJECTED_MAP_TOPIC]: [],
        [ROBOT_POSE_TOPIC]: [],
        [LIST_WAYPOINTS_SERVICE]: [],
        [SCAN_TOPIC]: [],
        [PLAN_TOPIC]: [],
        [GET_MAP_LIST_SERVICE]: [],
        [CURRENT_MAP_INFO_TOPIC]: [],
        [LAUNCH_STATUS_TOPIC]: [],
        [NAVIGATION_STATUS_TOPIC]: [],
        [CONTROL_LAUNCH_SERVICE]: [],
        [ODOMETRY_TOPIC]: [],
        [GET_EDITED_MAPS_SERVICE]: [],
        [SAVE_EDITED_MAPS_SERVICE]: [],
        [GLOBAL_COSTMAP_TOPIC]: [],

    };

    // 为特定主题注册监听器
    on<K extends keyof TopicTypeMap>(event: K, listener: (data: TopicTypeMap[K]) => void) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    // 移除特定主题的监听器
    off<K extends keyof TopicTypeMap>(event: K, listener: (data: TopicTypeMap[K]) => void) {
        const index = this.events[event].indexOf(listener);
        if (index !== -1) this.events[event].splice(index, 1);

        // if (this.events[event]) {
        //     this.events[event] = this.events[event].filter(l => l !== listener)
        // }
    }

    // 发射特定主题的事件
    emit<K extends keyof TopicTypeMap>(event: K, data: TopicTypeMap[K]) {
        if (this.events[event]) {
            this.events[event].forEach((listener: (data: TopicTypeMap[K]) => void) => listener(data));
        }
    }
}

interface WebSocketContextType {
    sendMessage: (msg: SendMessageParams) => void;
    emitter: SimpleEventEmitter;
    curMap: string;
    mode: Mode;
    setMode: React.Dispatch<React.SetStateAction<Mode>>;
    mapList: string[];
    mapData: Map_Message | null;
    setMapData: React.Dispatch<React.SetStateAction<Map_Message | null>>;
    curEditMap: string;
    setCurEditMap: React.Dispatch<React.SetStateAction<string>>;
    robotControlMode: string;
    setRobotControlMode: React.Dispatch<React.SetStateAction<string>>;
    isLoad: boolean;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocketContext = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketContext must be used within WebSocketProvider');
    }
    return context;
};