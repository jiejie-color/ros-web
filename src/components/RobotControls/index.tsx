import { useCallback, useEffect, useRef, useState } from "react";
import useWebSocket from "react-use-websocket";
import styles from "./styles.module.css";

interface RobotControlsProps {
    robotWsUrl?: string; // 允许传入WebSocket URL
}

/* ================= 主组件 ================= */

export const RobotControls = ({ robotWsUrl = "ws://192.168.0.155:8765" }: RobotControlsProps) => {
    /* ---------- UI 状态（低频） ---------- */
    const [status, setStatus] = useState("正在连接...");
    const [statusColor, setStatusColor] = useState("orange");
    const [maxSpeed, setMaxSpeed] = useState(100);

    /* ---------- DOM Ref ---------- */
    const speedJoystickRef = useRef<HTMLDivElement>(null);
    const directionJoystickRef = useRef<HTMLDivElement>(null);

    /* ---------- 控制数据（高频，不触发渲染） ---------- */
    const controlRef = useRef({
        vx: 0,
        vy: 0,
        vtheta: 0,
    });

    const lastSendTimeRef = useRef(0);
    const throttleDelay = 250;
    const maxRadius = 80;

    /* ================= WebSocket ================= */

    const { sendMessage } = useWebSocket(robotWsUrl, {
        onOpen: () => {
            setStatus("WebSocket 连接成功");
            setStatusColor("green");
            sendMessage(JSON.stringify({ op: "subscribe", topic: "/map" }));
        },
        onError: () => {
            setStatus("WebSocket 连接错误");
            setStatusColor("red");
        },
        onClose: () => {
            setStatus("WebSocket 已关闭");
            setStatusColor("orange");
        },
    });

    /* ================= 指令发送（节流） ================= */

    const sendControlCommand = useCallback(() => {
        const now = Date.now();
        if (now - lastSendTimeRef.current >= throttleDelay) {
            sendMessage(
                JSON.stringify(controlRef.current)
            );
            lastSendTimeRef.current = now;
        }
    }, [sendMessage]);

    // 限制数值范围
    function clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(value, min), max);
    }

    /* ================= 键盘控制 ================= */
    const keyState = useRef({
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
    });
    const sendImmediateCommand = useCallback(() => {
        sendMessage(
            JSON.stringify(controlRef.current)
        );
    }, [sendMessage]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                keyState.current[e.key as keyof typeof keyState.current] = true;

                // 更新控制值
                updateControlValues(keyState.current);
                sendControlCommand();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                keyState.current[e.key as keyof typeof keyState.current] = false;
                // 更新控制值
                updateControlValues(keyState.current);
                sendImmediateCommand();
            }
        };

        const updateControlValues = (keys: typeof keyState.current) => {
            let vx = 0;
            let vy = 0;
            const vtheta = 0;

            if (keys.ArrowUp) vx = maxSpeed;
            if (keys.ArrowDown) vx = -maxSpeed;
            if (keys.ArrowLeft) vy = -maxSpeed;
            if (keys.ArrowRight) vy = maxSpeed;

            // 更新控制引用
            controlRef.current.vx = vx;
            controlRef.current.vy = vy;
            controlRef.current.vtheta = vtheta;
        };

        // 添加键盘事件监听器
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // 组件卸载时清理事件监听器
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [maxSpeed, sendControlCommand, sendImmediateCommand]);

    /* ================= 游戏手柄 ================= */

    const rafRef = useRef<number | null>(null);

    const pollGamepad = useCallback(() => {
        const pad = navigator.getGamepads()[0];
        if (pad) {
            controlRef.current.vx = Math.round(-pad.axes[1] * maxSpeed);
            controlRef.current.vy = Math.round(-pad.axes[0] * maxSpeed);
            controlRef.current.vtheta = Math.round(-pad.axes[2]);

            sendControlCommand();
        }
        rafRef.current = requestAnimationFrame(pollGamepad);
    }, [maxSpeed, sendControlCommand]);

    useEffect(() => {
        const start = () => {
            if (!rafRef.current) pollGamepad();
        };
        const stop = () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };

        window.addEventListener("gamepadconnected", start);
        window.addEventListener("gamepaddisconnected", stop);

        return stop;
    }, [maxSpeed, pollGamepad]);

    /* ================= 虚拟摇杆 Hook ================= */

    const useJoystick = (
        ref: React.RefObject<HTMLDivElement | null>,
        type: "move" | "rotate"
    ) => {
        useEffect(() => {
            const el = ref.current;
            if (!el) return;

            const handle = el.querySelector(
                "." + styles["joystick-handle"]
            ) as HTMLDivElement;
            if (!handle) return;

            const onStart = (e: MouseEvent | TouchEvent) => {
                e.preventDefault();
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;

                const onMove = (e: MouseEvent | TouchEvent) => {
                    const p = e instanceof TouchEvent ? e.touches[0] : e;
                    const dx = clamp(p.clientX - cx, -maxRadius, maxRadius);
                    const dy = clamp(p.clientY - cy, -maxRadius, maxRadius);

                    handle.style.transform = `translate(${dx}px, ${dy}px)`;

                    if (type === "move") {
                        controlRef.current.vx = Math.round((-dy / maxRadius) * maxSpeed);
                        controlRef.current.vy = Math.round((-dx / maxRadius) * maxSpeed);
                    } else {
                        controlRef.current.vtheta = Math.round(-dx / maxRadius);
                    }

                    sendControlCommand();
                };

                const onEnd = () => {
                    handle.style.transform = `translate(0,0)`;

                    if (type === "move") {
                        controlRef.current.vx = 0;
                        controlRef.current.vy = 0;
                    } else {
                        controlRef.current.vtheta = 0;
                    }

                    sendControlCommand();

                    document.removeEventListener("mousemove", onMove);
                    document.removeEventListener("mouseup", onEnd);
                    document.removeEventListener("touchmove", onMove);
                    document.removeEventListener("touchend", onEnd);
                };

                document.addEventListener("mousemove", onMove);
                document.addEventListener("mouseup", onEnd);
                document.addEventListener("touchmove", onMove);
                document.addEventListener("touchend", onEnd);
            };

            el.addEventListener("mousedown", onStart);
            el.addEventListener("touchstart", onStart);

            return () => {
                el.removeEventListener("mousedown", onStart);
                el.removeEventListener("touchstart", onStart);
            };
        }, [ref, type]);
    };

    // 初始化两个摇杆
    useJoystick(speedJoystickRef, "move");
    useJoystick(directionJoystickRef, "rotate");

    return (
        <div
            style={{
                position: "fixed",
                bottom: 100,
                left: 20,
                background: "#2a2a2a",
                padding: "16px",
                borderRadius: 8,
                color: "white",
                zIndex: 1000,
                minWidth: 300,
            }}
        >
            <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8, fontSize: 14 }}>
                    遥控状态: <span style={{ color: statusColor }}>{status}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ marginRight: 8 }}>最大速度:</span>
                    <input
                        type="range"
                        min="50"
                        max="500"
                        value={maxSpeed}
                        onChange={(e) => setMaxSpeed(parseInt(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <span style={{ marginLeft: 8, minWidth: 40 }}>{maxSpeed}</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#aaa' }}>
                    使用键盘方向键控制机器人移动
                </div>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
                {/* 速度摇杆 */}
                <div
                    ref={speedJoystickRef}
                    className={styles.joystick}
                    style={{
                        width: 160,
                        height: 160,
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "50%",
                        position: "relative",
                        touchAction: "none",
                    }}
                >
                    <div
                        className={styles["joystick-handle"]}
                        style={{
                            width: 40,
                            height: 40,
                            background: "#007bff",
                            borderRadius: "50%",
                            position: "absolute",
                            top: "calc(50% - 20px)",
                            left: "calc(50% - 20px)",
                            transition: "transform 0.1s",
                            cursor: "grab",
                        }}
                    />
                    <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: 12,
                        color: "#aaa"
                    }}>
                        移动
                    </div>
                </div>

                {/* 方向往摇杆 */}
                <div
                    ref={directionJoystickRef}
                    className={styles.joystick}
                    style={{
                        width: 160,
                        height: 160,
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "50%",
                        position: "relative",
                        touchAction: "none",
                    }}
                >
                    <div
                        className={styles["joystick-handle"]}
                        style={{
                            width: 40,
                            height: 40,
                            background: "#28a745",
                            borderRadius: "50%",
                            position: "absolute",
                            top: "calc(50% - 20px)",
                            left: "calc(50% - 20px)",
                            transition: "transform 0.1s",
                            cursor: "grab",
                        }}
                    />
                    <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: 12,
                        color: "#aaa"
                    }}>
                        旋转
                    </div>
                </div>
            </div>
        </div>
    );
};