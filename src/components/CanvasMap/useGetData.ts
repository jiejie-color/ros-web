import { useEffect, useState } from "react";
import { useWebSocketContext } from "../../hooks/useWebSocket";
import type { Robot, Waypoint } from "../../type";
import { LIST_WAYPOINTS_SERVICE, ODOMETRY_TOPIC, PLAN_TOPIC, ROBOT_POSE_TOPIC, SCAN_TOPIC } from "../../hooks/topic";
import { quaternionToYaw } from "./utils";
import type { List_Waypoints_Message, Odometry_Message, Plan_Message, Robot_Bose_Message, Scan_Message } from "../../type/topicRespon";


export const useGetData = () => {
    const { sendMessage, emitter, mode } = useWebSocketContext();

    const [robot, setRobot] = useState<Robot>({ x: 0, y: 0, yaw: 0 });
    const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
    const [laserScan, setLaserScan] = useState<Scan_Message>();
    const [plan, setPlan] = useState<Plan_Message>(); // 新增路径规划状态存储

    useEffect(() => {
        const handleListWaypointsTopic = (res: List_Waypoints_Message) => setWaypoints(res.values.waypoints ?? []);
        sendMessage({
            op: "call_service", service: LIST_WAYPOINTS_SERVICE, id: LIST_WAYPOINTS_SERVICE
        });
        emitter.on(LIST_WAYPOINTS_SERVICE, handleListWaypointsTopic);

        const handleScanTopic = (res: Scan_Message) => setLaserScan(res);
        emitter.on(SCAN_TOPIC, handleScanTopic);

        const handlePlanTopic = (res: Plan_Message) => setPlan(res);
        emitter.on(PLAN_TOPIC, handlePlanTopic);
        return () => {
            emitter.off(LIST_WAYPOINTS_SERVICE, handleListWaypointsTopic);
            emitter.off(SCAN_TOPIC, handleScanTopic);
            emitter.off(PLAN_TOPIC, handlePlanTopic);
        };
    }, [emitter, sendMessage]);

    useEffect(() => {
        const handleOdometryTopic = (res: Odometry_Message) => {
            setRobot({
                x: res.msg.pose.pose.position.x,
                y: res.msg.pose.pose.position.y,
                yaw: quaternionToYaw(res.msg.pose.pose.orientation),
            })
        };
        const handleRobotPoseTopic = (res: Robot_Bose_Message) => {
            setRobot({
                x: res.msg.pose.position.x,
                y: res.msg.pose.position.y,
                yaw: quaternionToYaw(res.msg.pose.orientation),
            })
        };
        if (mode === 'mapping') {
            sendMessage({
                op: "subscribe", topic: ODOMETRY_TOPIC, throttle_rate: 200,
            });
        } else if (mode === 'navigation') {
            sendMessage({
                op: "subscribe", topic: ROBOT_POSE_TOPIC, throttle_rate: 200,
            });
        } else {
            sendMessage({
                op: "unsubscribe", topic: ROBOT_POSE_TOPIC,
            });
            sendMessage({
                op: "unsubscribe", topic: ODOMETRY_TOPIC,
            });
        }

        emitter.on(ROBOT_POSE_TOPIC, handleRobotPoseTopic);
        emitter.on(ODOMETRY_TOPIC, handleOdometryTopic);
        return () => {
            emitter.off(ODOMETRY_TOPIC, handleOdometryTopic);
            sendMessage({ op: "unsubscribe", topic: ROBOT_POSE_TOPIC });
            emitter.off(ROBOT_POSE_TOPIC, handleRobotPoseTopic);
            sendMessage({
                op: "unsubscribe", topic: ODOMETRY_TOPIC, throttle_rate: 200,
            });
        }
    }, [emitter, mode, sendMessage])
    return { robot, waypoints, laserScan, plan, };
}