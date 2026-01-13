// 已有的类型定义保持不变

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

// 添加路径规划相关类型定义

// 路径上的单个点
export interface pose {
  pose: {
    position: {
      x: number;
      y: number;
      z: number;
    }
  }
}

// 路径规划结果
export interface PathPlan {
  poses: pose[]; // 规划的路径点数组

}

// 路径规划请求
export interface PathPlanRequest {
  start: pose; // 起点
  goal: pose; // 终点
  allow_replan?: boolean; // 是否允许重新规划
  planner_id?: string; // 规划器ID
}

export type MySendMessage = (msg: SendMessageParams) => void;

export interface SendMessageParams {
  op: "subscribe" | "call_service" | "unsubscribe" | "publish";
  service?: string;
  topic?: string;
  id?: string;
  args?: Record<string, unknown>;
  throttle_rate?: number;
}
export interface LaunchStatus {
  "mapping_running": boolean,
  "navigation_running": boolean,
}