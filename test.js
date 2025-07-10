#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { spawn } from "child_process";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

async function testMCPServer() {
  log("🧪 Testing MCP Server...", YELLOW);

  return new Promise((resolve, reject) => {
    const serverProcess = spawn("node", ["index.js"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let serverOutput = "";
    let errorOutput = "";

    serverProcess.stdout.on("data", (data) => {
      serverOutput += data.toString();
    });

    serverProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
      if (errorOutput.includes("System Information MCP Server started")) {
        log("✅ MCP Server started successfully", GREEN);
        serverProcess.kill();
        resolve(true);
      }
    });

    serverProcess.on("error", (error) => {
      log(`❌ Server startup failed: ${error.message}`, RED);
      reject(error);
    });

    // 5 second timeout
    setTimeout(() => {
      serverProcess.kill();
      if (!errorOutput.includes("System Information MCP Server started")) {
        log("❌ Server startup timeout", RED);
        reject(new Error("Server startup timeout"));
      }
    }, 5000);
  });
}

function testSyntax() {
  log("🔍 Testing syntax check...", YELLOW);

  return new Promise((resolve, reject) => {
    const syntaxCheck = spawn("node", ["--check", "index.js"], {
      stdio: "pipe",
    });

    syntaxCheck.on("close", (code) => {
      if (code === 0) {
        log("✅ Syntax check passed", GREEN);
        resolve(true);
      } else {
        log("❌ Syntax check failed", RED);
        reject(new Error("Syntax check failed"));
      }
    });
  });
}

async function runTests() {
  try {
    log("🚀 Starting tests...", YELLOW);

    // Test syntax
    await testSyntax();

    // Test server startup
    await testMCPServer();

    log("🎉 All tests passed!", GREEN);
    process.exit(0);
  } catch (error) {
    log(`💥 Test failed: ${error.message}`, RED);
    process.exit(1);
  }
}

runTests();
