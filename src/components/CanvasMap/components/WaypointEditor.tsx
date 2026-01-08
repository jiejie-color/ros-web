import type { MySendMessage, Waypoint } from "../../../type";

interface Props {
  editingNode: Waypoint;
  setEditingNode: React.Dispatch<React.SetStateAction<Waypoint | null>>;
  sendMessage: MySendMessage;
  setIsEditingNode: React.Dispatch<React.SetStateAction<boolean>>;
}
export const WaypointEditor = ({
  editingNode,
  setEditingNode,
  sendMessage,
  setIsEditingNode,
}: Props) => {
  const isValid =
    editingNode &&
    editingNode!.name.trim().length > 0 &&
    Number.isFinite(editingNode!.x) &&
    Number.isFinite(editingNode!.y);

  const submit = () => {
    sendMessage(
      ({
        op: "call_service",
        id: `create_waypoint_${Date.now()}`,
        service: "/create_waypoint",
        args: {
          waypoint: {
            x: editingNode.x,
            y: editingNode.y,
            theta: editingNode.theta,
            name: editingNode.name,
          },
        },
      })
    );
    sendMessage(
      ({
        op: "call_service",
        id: `create_waypoint_${Date.now() + 1}`,
        service: "/list_waypoints",
        args: {},
      })
    );
    setIsEditingNode(false);
    setEditingNode(null);
  };
  return (
    <>
      {
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1f1f1f",
              color: "#fff",
              borderRadius: 8,
              padding: "16px 20px",
              minWidth: 260,
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ marginBottom: 10, fontSize: 14 }}>x坐标</div>
            <input
              value={editingNode.x}
              onChange={(e) =>
                setEditingNode({ ...editingNode, x: Number(e.target.value) })
              }
              style={{
                width: "100%",
                padding: "4px 6px",
                borderRadius: 4,
                border: "1px solid #444",
                background: "#2a2a2a",
                color: "#fff",
                outline: "none",
                marginBottom: 10,
              }}
            />
            <div style={{ marginBottom: 10, fontSize: 14 }}>y坐标</div>
            <input
              value={editingNode.y}
              onChange={(e) =>
                setEditingNode({ ...editingNode, y: Number(e.target.value) })
              }
              style={{
                width: "100%",
                padding: "4px 6px",
                borderRadius: 4,
                border: "1px solid #444",
                background: "#2a2a2a",
                color: "#fff",
                outline: "none",
                marginBottom: 10,
              }}
            />
            <div style={{ marginBottom: 10, fontSize: 14 }}>方向（弧度）</div>
            <input
              value={editingNode.theta}
              onChange={(e) => {
                const raw = e.target.value;
                const value = Number(raw);

                if (Number.isNaN(value)) return;

                const clampedTheta = Math.max(
                  -Math.PI,
                  Math.min(Math.PI, value)
                );
                setEditingNode({
                  ...editingNode,
                  theta: clampedTheta,
                });
              }}
              style={{
                width: "100%",
                padding: "4px 6px",
                borderRadius: 4,
                border: "1px solid #444",
                background: "#2a2a2a",
                color: "#fff",
                outline: "none",
                marginBottom: 8,
              }}
            />
            <input
              type="range"
              min={-Math.PI}
              max={Math.PI}
              step="0.01"
              value={editingNode.theta}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setEditingNode({
                  ...editingNode,
                  theta: Math.max(-Math.PI, Math.min(Math.PI, value)),
                });
              }}
              style={{
                width: "100%",
                marginBottom: 10,
                cursor: "pointer",
              }}
            />
            <div style={{ marginBottom: 10, fontSize: 14 }}>节点名称</div>

            <input
              autoFocus
              value={editingNode.name}
              onChange={(e) =>
                setEditingNode({ ...editingNode, name: e.target.value })
              }
              style={{
                width: "100%",
                padding: "4px 6px",
                borderRadius: 4,
                border: "1px solid #444",
                background: "#2a2a2a",
                color: "#fff",
                outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && editingNode.name.trim()) {
                  submit();
                }
                if (e.key === "Escape") {
                  setIsEditingNode(false);
                }
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 14,
              }}
            >
              <button
                onClick={() => {
                  setIsEditingNode(false);
                  setEditingNode(null);
                }}
              >
                取消
              </button>
              <button
                disabled={!(editingNode && isValid)}
                onClick={() => {
                  submit();
                }}
                style={{
                  background: "#1677ff",
                  opacity: editingNode.name.trim() ? 1 : 0.5,
                }}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      }
    </>
  );
};
