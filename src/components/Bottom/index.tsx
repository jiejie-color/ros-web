import type { OperatingState } from "../CanvasMap/types";
import type { Mode } from "../../type";

export const Bottom = ({
  canvasRef,
  setOperatingState,
  operatingState,
  mode,
  setMode,
  setIsLaser,
  isLaser,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  setOperatingState: React.Dispatch<React.SetStateAction<OperatingState>>;
  operatingState: OperatingState;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  setIsLaser: React.Dispatch<React.SetStateAction<boolean>>;
  isLaser: boolean;
}) => {
  return (
    <>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          textAlign: "center",
          width: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: "12px ",
          borderRadius: "8px",
        }}
      >
        {mode === 'navigation' ? <>
          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              setOperatingState((pre => {
                const canvas = canvasRef.current;
                if (pre !== "rotate") {
                  canvas!.style.cursor = "pointer";
                  return "rotate";
                } else {
                  canvas!.style.cursor = "";
                  return "";
                }
              }));
            }}
          >
            {operatingState === "rotate" ? "取消" : "旋转"}
          </button>
          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              setOperatingState((pre => {
                const canvas = canvasRef.current;
                if (pre !== "drag") {
                  canvas!.style.cursor = "pointer";
                  return "drag";
                } else {
                  canvas!.style.cursor = "";
                  return "";
                }
              }));
            }}
          >
            {operatingState === "drag" ? "取消" : "拖动"}
          </button>
          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              setOperatingState("setInitialPose");
            }}
          >

            {operatingState === "setInitialPose" ? "取消" : "设置初始位置"}
          </button>
          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              setOperatingState((pre) => {
                const canvas = canvasRef.current;
                if (pre !== "addPoint") {
                  canvas!.style.cursor = "pointer";
                  return "addPoint";
                } else {
                  canvas!.style.cursor = "";
                  return "";
                }
              });
            }}
          >
            {operatingState === "addPoint" ? "取消" : "添加节点"}
          </button>
          <button
            style={{ padding: 12, marginRight: 20 }}
            onClick={() => {
              setMode("mapping");
            }}
          >
            {"建图模式"}
          </button>
          <button
            style={{ padding: 12 }}
            onClick={() => {
              setIsLaser((prev) => !prev);
            }}
          >
            {isLaser ? "取消激光扫描模式" : "激光扫描模式"}
          </button>
          {/* <button onClick={() => setMapRotation(prev => prev + Math.PI / 90)}>顺时针旋转1°</button>
          <button onClick={() => setMapRotation(prev => prev - Math.PI / 90)}>逆时针旋转1°</button>
          <button onClick={() => setMapRotation(0)}>重置旋转</button> */}
        </>
          :
          <>
            <button
              style={{ padding: 12 }}
              onClick={() => {
                setMode("navigation");
              }}
            >
              {"导航模式"}
            </button>
            <button
              style={{ padding: 12, marginLeft: 20 }}
              onClick={() => {
                alert("地图数据已保存到服务器！");
                setMode("navigation");
              }}
            >
              保存
            </button>
          </>}

      </div>
    </>
  );
};
