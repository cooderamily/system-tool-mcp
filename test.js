#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { spawn } from "child_process";

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

async function testMCPServer() {
  log('🧪 测试 MCP 服务器...', YELLOW);
  
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('node', ['index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let serverOutput = '';
    let errorOutput = '';
    
    serverProcess.stdout.on('data', (data) => {
      serverOutput += data.toString();
    });
    
    serverProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      if (errorOutput.includes('系统信息MCP服务器已启动')) {
        log('✅ MCP 服务器启动成功', GREEN);
        serverProcess.kill();
        resolve(true);
      }
    });
    
    serverProcess.on('error', (error) => {
      log(`❌ 服务器启动失败: ${error.message}`, RED);
      reject(error);
    });
    
    // 5秒超时
    setTimeout(() => {
      serverProcess.kill();
      if (!errorOutput.includes('系统信息MCP服务器已启动')) {
        log('❌ 服务器启动超时', RED);
        reject(new Error('Server startup timeout'));
      }
    }, 5000);
  });
}

function testSyntax() {
  log('🔍 测试语法检查...', YELLOW);
  
  return new Promise((resolve, reject) => {
    const syntaxCheck = spawn('node', ['--check', 'index.js'], {
      stdio: 'pipe'
    });
    
    syntaxCheck.on('close', (code) => {
      if (code === 0) {
        log('✅ 语法检查通过', GREEN);
        resolve(true);
      } else {
        log('❌ 语法检查失败', RED);
        reject(new Error('Syntax check failed'));
      }
    });
  });
}

async function runTests() {
  try {
    log('🚀 开始运行测试...', YELLOW);
    
    // 测试语法
    await testSyntax();
    
    // 测试服务器启动
    await testMCPServer();
    
    log('🎉 所有测试通过！', GREEN);
    process.exit(0);
  } catch (error) {
    log(`💥 测试失败: ${error.message}`, RED);
    process.exit(1);
  }
}

runTests();