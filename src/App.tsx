import { useState, } from "react"; // 添加React和useState导入
import CanvasMap from "./components/CanvasMap/index.tsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Settings from "./components/Settings/index.tsx";
import { WebSocketProvider, } from "./components/WebSocketContext/index.tsx";

function AppContent() {
  // 矩形固定在世界坐标系
  const [isSetting, setIsSetting] = useState(false);
  // const [launch_status, setLaunch_status] = useState<LaunchStatus | null>(null);

  // WebSocket地址配置

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div
              style={{ width: "100%", height: "100%", background: "#f0f0f0" }}
            >
              <button style={{
                position: "absolute",
                top: 20,
                color: "white",
                right: 20,
                zIndex: 99
              }}
                onClick={() => { setIsSetting(true) }}
              >
                设置
              </button>
              <>
                <CanvasMap />
              </>
              {
                isSetting ? (
                  <Settings
                    onClose={() => setIsSetting(false)}
                  />
                ) : null
              }
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <WebSocketProvider >
      <AppContent />
    </WebSocketProvider>
  );
}

export default App;