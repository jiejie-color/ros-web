import type { SendMessage } from "react-use-websocket";
import type { MapMessage, Robot, Waypoint, LaserScan } from "../../type";

export interface CanvasMapProps {
  mapData: MapMessage | null;
  cartographer_map: MapMessage | null;
  robot: Robot;
  baseGridSize?: number;
  sendMessage: SendMessage;
  waypoints: Waypoint[];
  laserScan: LaserScan | null;
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
  | "setInitialPose"; // 拖动确定朝向
