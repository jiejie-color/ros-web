import type { Waypoint } from ".";

export interface Map_Message {
    msg: {
        info: {
            width: number;
            height: number;
            resolution: number;
            origin: { position: { x: number; y: number } };
        };
        data: number[];
    }
}
export interface Scan_Message {
    msg: {
        header: { stamp: number };
        angle_min: number;
        angle_max: number;
        angle_increment: number;
        range_min: number;
        range_max: number;
        ranges: number[];
        intensities?: number[];
    },
}
export interface Pose {
    pose: {
        position: {
            x: number;
            y: number;
            z: number;
        },
        orientation: {
            x: number;
            y: number;
            z: number;
            w: number;
        }
    }
}


export interface Robot_Bose_Message {
    msg: Pose
}
export interface List_Waypoints_Message {
    values: {
        waypoints: Waypoint[];
    }
}

export interface Plan_Message {
    msg: {
        poses: Pose[]; // 规划的路径点数组
    }
}

export interface Get_Map_List_Message {
    values: {
        map_names: string[];
    }
}
export interface Launch_Status_Message {
    msg: {
        mapping_running: boolean,
        navigation_running: boolean,
    }
}

export interface Navigation_Status_Message {
    msg: {
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
}
export interface Current_Map_Info_Message {
    msg: {
        map_name: string;
    }
}
export interface Control_Launch_Message {
    values: {
        success: boolean;
    }
}
export interface Odometry_Message {
    msg: { pose: Pose }
}
export interface Get_Edited_Map_Message {
    values: {
        width: number;
        height: number;
        has_changes: boolean;
        message: string;
        success: boolean;
        image_data: number[];
        origin: [number, number, number];
        resolution: number;
    }
}
export interface Save_Edited_Maps_Message {
    values: {
        success: boolean;
        message: string;
    }
}

export interface Global_Costmap_Message {
    msg: {
        data: number[];
        info: {
            width: number;
            height: number;
            resolution: number;
            origin: { position: { x: number; y: number } };
        };
        header: {
            stamp: {
                sec: number;
                nanosec: number;
            }
        }
    }
}