export interface Robot {
  x: number; // 世界坐标米 (map frame)
  y: number;
  yaw: number; // 弧度
}

export interface Waypoint {
  id?: string;
  x: number; // 世界坐标（米）
  y: number;
  theta: number;
  name: string;
}
export type Mode = "" | "navigation" | "mapping" | "editing" | 'none';



// 添加路径规划相关类型定义


export type MySendMessage = (msg: SendMessageParams) => void;

export interface SendMessageParams {
  op: "subscribe" | "call_service" | "unsubscribe" | "publish";
  service?: string;
  topic?: string;
  id?: string;
  args?: Record<string, unknown>;
  throttle_rate?: number;
}
