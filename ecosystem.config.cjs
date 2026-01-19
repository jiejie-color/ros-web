module.exports = {
  apps: [
    {
      name: "main-service", // 自定义名称（与第一个服务区分）
      script: "npm", 
      args: "run preview", // 执行主服务命令
      cwd: "./", // 与第一个服务共享工作目录（假设在同一项目）
      env: {
        NODE_ENV: "production",
        PORT: 3000 // 若主服务需要不同端口，在此设置
      },
      error_file: "./logs/main-err.log", // 独立错误日志
      out_file: "./logs/main-out.log",   // 独立输出日志
      merge_logs: true,
      autorestart: true,  // 保持与第一个服务相同的重启策略
      watch: false,
      ignore_watch: [     
        "node_modules",
        "logs",
        "*.log"
      ],
      max_memory_restart: "512M",
      instances: 1,
      exec_mode: "fork_mode"
    }
  ]
};