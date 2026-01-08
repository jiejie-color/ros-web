import type { MapMessage, Robot, Waypoint, LaserScan, MySendMessage, PathPlan } from "../../type";

export interface CanvasMapProps {
  mapData: MapMessage | null;
  projected_map: MapMessage | null;
  robot: Robot;
  baseGridSize?: number;
  sendMessage: MySendMessage;
  waypoints: Waypoint[];
  laserScan: LaserScan | null;
  pathPlan: PathPlan | null; // 新增路径规划属性
}
export interface Offset {
  x: number;
  y: number;
}

export type ContextTarget =
  | { type: "empty" }
  | { type: "waypoint"; waypoint: Waypoint };

export type OperatingState =
  | ""
  | "drag"
  | "rotate"
  | "addPoint"
  | "setInitialPose" // 拖动确定朝向
  | "freeErase"; 