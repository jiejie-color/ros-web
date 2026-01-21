import React, { useState } from 'react';
import { DELETE_MAP_SERVICE, GET_MAP_LIST_SERVICE, LIST_WAYPOINTS_SERVICE, SWITCH_MAP_SERVICE } from '../../hooks/topic';
import { useWebSocketContext } from '../../hooks/useWebSocket';

interface SettingsProps {
    onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({
    onClose,
}) => {
    const { sendMessage, curMap: curMapInContext, mapList, robotControlMode,
        setRobotControlMode } = useWebSocketContext();
    const [activeTab, setActiveTab] = useState('mapList');
    const [curMap, setCurMap] = useState<string>(curMapInContext);
    const [localLoading, setLocalLoading] = useState(false); // 本地加载状态
    const handleSave = async () => {
        if (activeTab === "mapList") {
            // 设置全局和本地加载状态
            setLocalLoading(true);
            try {
                sendMessage(
                    {
                        "op": "call_service",
                        "service": SWITCH_MAP_SERVICE,
                        "id": SWITCH_MAP_SERVICE,
                        "args": {
                            "map_name": curMap
                        },
                    }
                );

            } finally {
                // 延迟一小段时间以确保用户可以看到加载状态
                setTimeout(() => {
                    setLocalLoading(false);
                    onClose();
                    sendMessage({
                        op: "call_service",
                        id: LIST_WAYPOINTS_SERVICE,
                        service: LIST_WAYPOINTS_SERVICE,
                    });
                }, 10000);
            }
        }
    };


    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.35)',
                zIndex: 3000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {/* 加载覆盖层 */}
            {(localLoading) && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3001,
                        borderRadius: 8,
                    }}
                >
                    <div style={{
                        background: '#333',
                        padding: '20px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid #f3f3f3',
                            borderTop: '2px solid #007bff',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }}></div>
                        <span style={{ color: '#fff' }}>切换地图中...</span>
                    </div>
                </div>
            )}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#2a2a2a',
                    color: '#fff',
                    borderRadius: 8,
                    padding: '0',
                    minWidth: 400,
                    maxWidth: 600,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                    overflow: 'hidden',
                    position: 'relative', // 添加相对定位以便加载覆盖层正确显示
                }}
            >
                {/* 添加旋转动画样式 */}
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>

                {/* Tab 标题栏 */}
                <div style={{
                    borderBottom: '1px solid #444',
                    display: 'flex',
                    background: '#222',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                }}>
                    <button
                        onClick={() => setActiveTab('mapList')}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            border: 'none',
                            background: activeTab === 'mapList' ? '#3a3a3a' : 'transparent',
                            color: activeTab === 'mapList' ? '#fff' : '#aaa',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: activeTab === 'mapList' ? 'bold' : 'normal',
                            borderTopRightRadius: 8,
                            borderRadius: 0,
                        }}
                    >
                        地图设置
                    </button>
                    <button
                        onClick={() => setActiveTab('robotControls')}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            border: 'none',
                            background: activeTab === 'robotControls' ? '#3a3a3a' : 'transparent',
                            color: activeTab === 'robotControls' ? '#fff' : '#aaa',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: activeTab === 'robotControls' ? 'bold' : 'normal',
                            borderTopRightRadius: 8,
                            borderRadius: 0,
                        }}
                    >
                        遥控
                    </button>
                </div>

                {/* Tab 内容区域 */}
                <div style={{ padding: '20px' }}>
                    {activeTab === 'mapList' && (
                        <>
                            <h3 style={{ margin: '0 0 20px 0', color: '#fff', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                                地图设置
                            </h3>

                            <div style={{ marginBottom: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5, color: '#ccc' }}>
                                    当前地图: {curMap}
                                </label>
                            </div>
                            <div style={{ marginTop: 20 }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>地图列表</h4>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #444', borderRadius: 4, padding: '10px' }}>
                                    {mapList.map((item, index) => (
                                        <div key={item} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px',
                                            backgroundColor: index % 2 === 0 ? '#333' : '#2a2a2a',
                                            borderRadius: 4,
                                            marginBottom: '5px'
                                        }}>
                                            <span style={{ color: '#ccc' }}>{item}</span>
                                            <div>
                                                <button
                                                    onClick={() => {
                                                        setCurMap(item)
                                                    }}
                                                    style={{
                                                        backgroundColor: '#007bff',
                                                        color: '#fff',
                                                        marginRight: 5,
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    选择
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (window.confirm(`确定要删除地图 "${item}" 吗？此操作不可撤销。`)) {
                                                            sendMessage({
                                                                op: 'call_service',
                                                                service: DELETE_MAP_SERVICE,
                                                                args: {
                                                                    map_name: item,
                                                                },
                                                                id: DELETE_MAP_SERVICE,
                                                            });
                                                            sendMessage(
                                                                {
                                                                    "op": "call_service",
                                                                    "service": GET_MAP_LIST_SERVICE,
                                                                    "id": GET_MAP_LIST_SERVICE
                                                                }
                                                            )
                                                        }
                                                    }}
                                                    style={{
                                                        backgroundColor: '#dc3545',
                                                        color: '#fff',
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    删除
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                    {activeTab === 'robotControls' && (
                        <>
                            <h3 style={{ margin: '0 0 20px 0', color: '#fff', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                                遥控设置
                            </h3>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', marginBottom: 5, color: '#ccc' }}>
                                    遥控开关
                                </label>
                                <select
                                    value={robotControlMode}
                                    onChange={(e) => setRobotControlMode(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #555',
                                        borderRadius: 4,
                                        backgroundColor: '#333',
                                        color: '#fff',
                                        fontSize: 14,
                                    }}
                                >
                                    <option value="open">开启</option>
                                    <option value="close">关闭</option>
                                </select>
                            </div>
                        </>
                    )}
                </div>

                {/* 按钮区域 */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 10,
                    padding: '15px 20px',
                    borderTop: '1px solid #444',
                    background: '#252525',
                }}>
                    <button
                        onClick={onClose}
                    >
                        关闭
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={localLoading} // 在加载时禁用按钮
                        style={{
                            backgroundColor: localLoading ? '#6c757d' : '#007bff',
                            cursor: localLoading ? 'not-allowed' : 'pointer',
                            opacity: localLoading ? 0.7 : 1,
                        }}
                    >
                        {localLoading ? '切换中...' : ('保存设置')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;