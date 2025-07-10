#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import si from "systeminformation";

const formatBytes = (bytes) => (bytes / 1024 / 1024 / 1024).toFixed(2);
const formatPercent = (value) => `${value.toFixed(1)}%`;
const formatGHz = (speed) => `${speed}GHz`;

const createResponse = (title, data) => ({
  content: [
    {
      type: "text",
      text: `# ${title}\n\n\`\`\`json\n${JSON.stringify(
        data,
        null,
        2
      )}\n\`\`\``,
    },
  ],
});

const getHardwareInfo = async () => {
  try {
    const [cpu, mem, graphics, blockDevices, system, battery] =
      await Promise.all([
        si.cpu(),
        si.mem(),
        si.graphics(),
        si.blockDevices(),
        si.system(),
        si.battery(),
      ]);

    const hardwareInfo = {
      CPU: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        model: cpu.model,
        cores: cpu.cores,
        threads: cpu.physicalCores,
        baseFrequency: formatGHz(cpu.speed),
        maxFrequency: formatGHz(cpu.speedMax),
        cache: {
          l1Data: cpu.cache.l1d,
          l1Instruction: cpu.cache.l1i,
          l2: cpu.cache.l2,
          l3: cpu.cache.l3,
        },
      },
      memory: {
        totalCapacity: `${Math.round(mem.total / 1024 / 1024 / 1024)}GB`,
        availableCapacity: `${Math.round(
          mem.available / 1024 / 1024 / 1024
        )}GB`,
        usedCapacity: `${Math.round(mem.used / 1024 / 1024 / 1024)}GB`,
        usageRate: formatPercent((mem.used / mem.total) * 100),
      },
      graphics: graphics.controllers.map((gpu) => ({
        vendor: gpu.vendor,
        model: gpu.model,
        vram: gpu.vram ? `${gpu.vram}MB` : "Unknown",
        driverVersion: gpu.driverVersion,
      })),
      storageDevices: blockDevices.map((device) => ({
        deviceName: device.name,
        type: device.type,
        size: `${formatBytes(device.size)}GB`,
        vendor: device.vendor,
        model: device.model,
        serialNumber: device.serial,
        removable: device.removable,
      })),
      systemInfo: {
        manufacturer: system.manufacturer,
        model: system.model,
        version: system.version,
        serialNumber: system.serial,
        uuid: system.uuid,
      },
      battery: battery.hasBattery
        ? {
            isCharging: battery.isCharging,
            batteryLevel: `${battery.percent}%`,
            remainingTime: battery.timeRemaining
              ? `${Math.floor(battery.timeRemaining / 60)} minutes`
              : "Unknown",
            cycleCount: battery.cycleCount,
            healthStatus: `${battery.maxCapacity}%`,
          }
        : "No battery",
    };

    return createResponse("Hardware Information", hardwareInfo);
  } catch (error) {
    throw new Error(`Failed to get hardware information: ${error.message}`);
  }
};

const getSystemStatus = async () => {
  try {
    const [osInfo, time, mem, currentLoad, networkInterfaces] =
      await Promise.all([
        si.osInfo(),
        si.time(),
        si.mem(),
        si.currentLoad(),
        si.networkInterfaces(),
      ]);

    const systemStatus = {
      operatingSystem: {
        platform: osInfo.platform,
        distribution: osInfo.distro,
        release: osInfo.release,
        architecture: osInfo.arch,
        hostname: osInfo.hostname,
        kernel: osInfo.kernel,
        bootTime: new Date(Date.now() - time.uptime * 1000).toLocaleString(
          "en-US"
        ),
        uptime: `${Math.floor(time.uptime / 3600)} hours ${Math.floor(
          (time.uptime % 3600) / 60
        )} minutes`,
        currentTime: new Date().toLocaleString("en-US"),
        timezone: time.timezone,
      },
      cpuUsage: {
        totalUsage: formatPercent(currentLoad.currentLoad),
        userProcesses: formatPercent(currentLoad.currentLoadUser),
        systemProcesses: formatPercent(currentLoad.currentLoadSystem),
        idle: formatPercent(currentLoad.currentLoadIdle),
      },
      memoryUsage: {
        totalCapacity: `${formatBytes(mem.total)}GB`,
        usedCapacity: `${formatBytes(mem.used)}GB`,
        availableCapacity: `${formatBytes(mem.available)}GB`,
        usageRate: formatPercent((mem.used / mem.total) * 100),
        swapMemory: {
          totalCapacity: `${formatBytes(mem.swaptotal)}GB`,
          usedCapacity: `${formatBytes(mem.swapused)}GB`,
          usageRate:
            mem.swaptotal > 0
              ? formatPercent((mem.swapused / mem.swaptotal) * 100)
              : "0%",
        },
      },
      networkInterfaces: networkInterfaces
        .filter((iface) => !iface.internal)
        .map((iface) => ({
          interfaceName: iface.iface,
          macAddress: iface.mac,
          ipv4Address: iface.ip4,
          ipv6Address: iface.ip6,
          type: iface.type,
          speed: iface.speed ? `${iface.speed}Mbps` : "Unknown",
          status: iface.operstate,
        })),
    };

    return createResponse("System Status", systemStatus);
  } catch (error) {
    throw new Error(`Failed to get system status: ${error.message}`);
  }
};

const setupTools = (server) => {
  server.registerTool(
    "get_hardware_info",
    {
      title: "Get Hardware Information",
      description:
        "Get complete hardware information (CPU, memory, storage, graphics, battery, serial numbers)",
    },
    getHardwareInfo
  );

  server.registerTool(
    "get_system_status",
    {
      title: "Get System Status",
      description:
        "Get system status information (operating system, network interfaces, CPU and memory usage)",
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
  console.error("System Information MCP Server started...");
};

run().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
