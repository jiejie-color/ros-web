import { useCallback, useEffect, useState } from "react";
import { useWebSocketContext } from "../../hooks/useWebSocket";
import type { Robot, Waypoint } from "../../type";
import { GLOBAL_COSTMAP_TOPIC, LIST_WAYPOINTS_SERVICE, ODOMETRY_TOPIC, PLAN_TOPIC, ROBOT_POSE_TOPIC, SCAN_TOPIC } from "../../hooks/topic";
import { quaternionToYaw } from "./utils";
import type { Global_Costmap_Message, List_Waypoints_Message, Odometry_Message, Plan_Message, Robot_Bose_Message, Scan_Message } from "../../type/topicRespon";


export const useGetData = () => {
    const { sendMessage, emitter, mode } = useWebSocketContext();

    const [robot, setRobot] = useState<Robot>({ x: 0, y: 0, yaw: 0 });
    const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
    const [laserScan, setLaserScan] = useState<Scan_Message>();
    const [plan, setPlan] = useState<Plan_Message>(); // 新增路径规划状态存储
    const [global_costmap, setGlobal_costmap] = useState<Global_Costmap_Message>(); // 新增全局costmap状态存储

    const handleListWaypointsTopic = useCallback((res: List_Waypoints_Message) => {
        setWaypoints(res.values.waypoints ?? []);
    }, []);

    const handleScanTopic = useCallback((res: Scan_Message) => {
        setLaserScan(res);
    }, []);

    const handlePlanTopic = useCallback((res: Plan_Message) => {
        setPlan(res);
    }, []);

    const handleGlobal_costmap = useCallback((res: Global_Costmap_Message) => {
        setGlobal_costmap(res);
    }, []);
    useEffect(() => {
        sendMessage({
            op: "call_service", service: LIST_WAYPOINTS_SERVICE, id: LIST_WAYPOINTS_SERVICE
        });
        emitter.on(GLOBAL_COSTMAP_TOPIC, handleGlobal_costmap);
        emitter.on(LIST_WAYPOINTS_SERVICE, handleListWaypointsTopic);
        emitter.on(SCAN_TOPIC, handleScanTopic);
        emitter.on(PLAN_TOPIC, handlePlanTopic);
        return () => {
            emitter.off(LIST_WAYPOINTS_SERVICE, handleListWaypointsTopic);
            emitter.off(SCAN_TOPIC, handleScanTopic);
            emitter.off(PLAN_TOPIC, handlePlanTopic);
        };
    }, [emitter, handleGlobal_costmap, handleListWaypointsTopic, handlePlanTopic, handleScanTopic, sendMessage]);

    const handleOdometryTopic = useCallback((res: Odometry_Message) => {
        setRobot({
            x: res.msg.pose.pose.position.x,
            y: res.msg.pose.pose.position.y,
            yaw: quaternionToYaw(res.msg.pose.pose.orientation),
        });
    }, []);

    const handleRobotPoseTopic = useCallback((res: Robot_Bose_Message) => {
        setRobot({
            x: res.msg.pose.position.x,
            y: res.msg.pose.position.y,
            yaw: quaternionToYaw(res.msg.pose.orientation),
        });
    }, []);

    useEffect(() => {
        if (mode === "mapping") {
            sendMessage({ op: "subscribe", topic: ODOMETRY_TOPIC, throttle_rate: 400 });
            emitter.on(ODOMETRY_TOPIC, handleOdometryTopic);
        }

        if (mode === "navigation") {
            sendMessage({ op: "subscribe", topic: ROBOT_POSE_TOPIC, throttle_rate: 400 });
            emitter.on(ROBOT_POSE_TOPIC, handleRobotPoseTopic);
        }

        return () => {
            if (mode === "mapping") {
                emitter.off(ODOMETRY_TOPIC, handleOdometryTopic);
                sendMessage({ op: "unsubscribe", topic: ODOMETRY_TOPIC });
            }

            if (mode === "navigation") {
                emitter.off(ROBOT_POSE_TOPIC, handleRobotPoseTopic);
                sendMessage({ op: "unsubscribe", topic: ROBOT_POSE_TOPIC });
            }
        };
    }, [mode, emitter, sendMessage, handleOdometryTopic, handleRobotPoseTopic]);
    return { robot, waypoints, laserScan, plan, global_costmap };
}