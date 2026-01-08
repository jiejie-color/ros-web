import { useCallback, useEffect, useRef, useState } from "react";
import useWebSocket from "react-use-websocket";
import styles from "./styles.module.css";

/* ================= 工具函数 ================= */

const clamp = (v: number, min: number, max: number) =>
    Math.min(Math.max(v, min), max);

/* ================= 主组件 ================= */

export const RobotControls = () => {
    /* ---------- UI 状态（低频） ---------- */
    const [status, setStatus] = useState("正在连接...");
    const [statusColor, setStatusColor] = useState("orange");
    const [maxSpeed, setMaxSpeed] = useState(200);

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

    const { sendMessage } = useWebSocket("ws://192.168.0.155:8765", {
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
        if (now - lastSendTimeRef.current < throttleDelay) return;

        sendMessage(JSON.stringify(controlRef.current));
        lastSendTimeRef.current = now;
    }, [sendMessage]);

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

    useJoystick(speedJoystickRef, "move");
    useJoystick(directionJoystickRef, "rotate");

    /* ================= UI ================= */

    return (
        <div className={styles["robot-controls"]}>
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    padding: "10px",
                    textAlign: "center",
                    color: statusColor,
                    background: "rgba(0,0,0,0.1)",
                }}
            >
                {status}
            </div>

            <div
                style={{
                    position: "fixed",
                    top: 50,
                    left: "50%",
                    transform: "translateX(-50%)",
                }}
            >
                <label>最大速度：</label>
                <input
                    type="range"
                    min={0}
                    max={500}
                    value={maxSpeed}
                    onChange={(e) => setMaxSpeed(Number(e.target.value))}
                />
                <span>{maxSpeed}</span>
            </div>

            <div className={styles["joysticks-wrapper"]}>
                <div
                    ref={speedJoystickRef}
                    className={styles["joystick-container"]}
                >
                    <div className={styles["joystick-handle"]} />
                </div>

                <div
                    ref={directionJoystickRef}
                    className={styles["joystick-container"]}
                >
                    <div className={styles["joystick-handle"]} />
                </div>
            </div>
        </div>
    );
};
