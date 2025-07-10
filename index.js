#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import si from "systeminformation";

const formatBytes = (bytes) => (bytes / 1024 / 1024 / 1024).toFixed(2);
const formatPercent = (value) => `${value.toFixed(1)}%`;
const formatGHz = (speed) => `${speed}GHz`;

const createResponse = (title, data) => ({
  content: [{
    type: "text",
    text: `# ${title}\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
  }],
});

const getHardwareInfo = async () => {
  try {
    const [cpu, mem, graphics, blockDevices, system, battery] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.graphics(),
      si.blockDevices(),
      si.system(),
      si.battery()
    ]);

    const hardwareInfo = {
      CPU: {
        制造商: cpu.manufacturer,
        品牌: cpu.brand,
        型号: cpu.model,
        核心数: cpu.cores,
        线程数: cpu.physicalCores,
        基础频率: formatGHz(cpu.speed),
        最大频率: formatGHz(cpu.speedMax),
        缓存: {
          L1数据: cpu.cache.l1d,
          L1指令: cpu.cache.l1i,
          L2: cpu.cache.l2,
          L3: cpu.cache.l3,
        },
      },
      内存: {
        总容量: `${Math.round(mem.total / 1024 / 1024 / 1024)}GB`,
        可用容量: `${Math.round(mem.available / 1024 / 1024 / 1024)}GB`,
        已使用: `${Math.round(mem.used / 1024 / 1024 / 1024)}GB`,
        使用率: formatPercent((mem.used / mem.total) * 100),
      },
      显卡: graphics.controllers.map((gpu) => ({
        厂商: gpu.vendor,
        型号: gpu.model,
        显存: gpu.vram ? `${gpu.vram}MB` : "未知",
        驱动版本: gpu.driverVersion,
      })),
      存储设备: blockDevices.map((device) => ({
        设备名: device.name,
        类型: device.type,
        大小: `${formatBytes(device.size)}GB`,
        厂商: device.vendor,
        型号: device.model,
        序列号: device.serial,
        是否可移动: device.removable,
      })),
      系统序列号: {
        制造商: system.manufacturer,
        型号: system.model,
        版本: system.version,
        序列号: system.serial,
        UUID: system.uuid,
      },
      电池: battery.hasBattery ? {
        是否充电: battery.isCharging,
        电量百分比: `${battery.percent}%`,
        剩余时间: battery.timeRemaining ? `${Math.floor(battery.timeRemaining / 60)}分钟` : "未知",
        循环次数: battery.cycleCount,
        健康状态: `${battery.maxCapacity}%`,
      } : "无电池",
    };

    return createResponse("硬件信息", hardwareInfo);
  } catch (error) {
    throw new Error(`获取硬件信息失败: ${error.message}`);
  }
};

const getSystemStatus = async () => {
  try {
    const [osInfo, time, mem, currentLoad, networkInterfaces] = await Promise.all([
      si.osInfo(),
      si.time(),
      si.mem(),
      si.currentLoad(),
      si.networkInterfaces()
    ]);

    const systemStatus = {
      操作系统: {
        平台: osInfo.platform,
        发行版: osInfo.distro,
        版本: osInfo.release,
        架构: osInfo.arch,
        主机名: osInfo.hostname,
        内核: osInfo.kernel,
        启动时间: new Date(Date.now() - time.uptime * 1000).toLocaleString("zh-CN"),
        运行时间: `${Math.floor(time.uptime / 3600)}小时 ${Math.floor((time.uptime % 3600) / 60)}分钟`,
        当前时间: new Date().toLocaleString("zh-CN"),
        时区: time.timezone,
      },
      CPU使用情况: {
        总使用率: formatPercent(currentLoad.currentLoad),
        用户进程: formatPercent(currentLoad.currentLoadUser),
        系统进程: formatPercent(currentLoad.currentLoadSystem),
        空闲: formatPercent(currentLoad.currentLoadIdle),
      },
      内存使用情况: {
        总容量: `${formatBytes(mem.total)}GB`,
        已使用: `${formatBytes(mem.used)}GB`,
        可用: `${formatBytes(mem.available)}GB`,
        使用率: formatPercent((mem.used / mem.total) * 100),
        交换分区: {
          总容量: `${formatBytes(mem.swaptotal)}GB`,
          已使用: `${formatBytes(mem.swapused)}GB`,
          使用率: mem.swaptotal > 0 ? formatPercent((mem.swapused / mem.swaptotal) * 100) : "0%",
        },
      },
      网络接口: networkInterfaces
        .filter(iface => !iface.internal)
        .map((iface) => ({
          接口名: iface.iface,
          MAC地址: iface.mac,
          IPv4地址: iface.ip4,
          IPv6地址: iface.ip6,
          类型: iface.type,
          速度: iface.speed ? `${iface.speed}Mbps` : "未知",
          状态: iface.operstate,
        })),
    };

    return createResponse("系统状态", systemStatus);
  } catch (error) {
    throw new Error(`获取系统状态失败: ${error.message}`);
  }
};

const setupTools = (server) => {
  server.registerTool(
    "get_hardware_info",
    {
      title: "获取硬件信息",
      description: "获取完整的硬件信息（CPU、内存、存储、显卡、电池、序列号）",
    },
    getHardwareInfo
  );

  server.registerTool(
    "get_system_status",
    {
      title: "获取系统状态",
      description: "获取系统状态信息（操作系统、网络接口、CPU和内存使用情况）",
    },
    getSystemStatus
  );
};

const createServer = () => {
  const server = new McpServer({
    name: "system-info-tool",
    version: "2.0.0",
  });

  setupTools(server);
  return server;
};

const run = async () => {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("系统信息MCP服务器已启动...");
};

run().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
});
