export function quaternionToYaw(q: {
  w: number;
  x: number;
  y: number;
  z: number;
}) {
  return Math.atan2(
    2 * (q.w * q.z + q.x * q.y),
    1 - 2 * (q.y * q.y + q.z * q.z)
  );
}

export const getMouseCanvasPos = (e: MouseEvent, canvas: HTMLCanvasElement) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
};

// 添加触摸事件处理函数
export const getTouchCanvasPos = (e: TouchEvent, canvas: HTMLCanvasElement) => {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
};

// 从事件中获取客户端坐标（兼容鼠标和触摸事件）
export const getClientPos = (e: MouseEvent | TouchEvent) => {
  if (e instanceof TouchEvent) {
    const touch = e.touches[0];
    return { x: touch.clientX, y: touch.clientY };
  }
  return { x: e.clientX, y: e.clientY };
};