export interface Robot {
  x: number; // 世界坐标米 (map frame)
  y: number;
  yaw: number; // 弧度
}
export interface MapMessage {
  info: {
    width: number;
    height: number;
    resolution: number;
    origin: { position: { x: number; y: number } };
  };
  data: number[];
}
export interface Waypoint {
  id?: string;
  x: number; // 世界坐标（米）
  y: number;
  theta: number;
  name: string;
}
export type Mode = "navigation" | "mapping";
export interface NavigationStatus {
  current_x: number;
  current_y: number;
  distance_to_goal: number;
  status: "navigating" | "arrived" | "completed";
  target_theta: number;
  target_x: number;
  target_y: number;
  waypoint_id: number;
  waypoint_name: string;
}
export interface LaserScan {
  header: { stamp: number };
  angle_min: number;
  angle_max: number;
  angle_increment: number;
  range_min: number;
  range_max: number;
  ranges: number[];
  intensities?: number[];
}
