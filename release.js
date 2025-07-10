#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function getCurrentVersion() {
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
  return packageJson.version;
}

function runCommand(command, description) {
  log(`${YELLOW}🔄 ${description}...${RESET}`);
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`${GREEN}✅ ${description} 完成${RESET}`);
    return result;
  } catch (error) {
    log(`${RED}❌ ${description} 失败: ${error.message}${RESET}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
${GREEN}发版管理工具${RESET}

用法:
  node release.js <command> [options]

命令:
  patch       发布补丁版本 (x.x.X)
  minor       发布次要版本 (x.X.x)  
  major       发布主要版本 (X.x.x)
  dry         模拟发布（不实际发布）
  help        显示帮助信息

示例:
  node release.js patch   # 发布补丁版本
  node release.js minor   # 发布次要版本
  node release.js dry     # 模拟发布
`);
}

function checkPrerequisites() {
  log('🔍 检查发布前提条件...');
  
  // 检查是否在主分支
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  if (branch !== 'main') {
    log(`${RED}错误: 请在 main 分支进行发布，当前分支: ${branch}${RESET}`);
    process.exit(1);
  }
  
  // 检查工作区是否干净
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    log(`${RED}错误: 工作区有未提交的更改，请先提交所有更改${RESET}`);
    process.exit(1);
  }
  
  // 检查是否与远程同步
  try {
    execSync('git fetch');
    const localCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const remoteCommit = execSync('git rev-parse origin/main', { encoding: 'utf8' }).trim();
    
    if (localCommit !== remoteCommit) {
      log(`${RED}错误: 本地分支与远程分支不同步，请先 pull 或 push${RESET}`);
      process.exit(1);
    }
  } catch (error) {
    log(`${YELLOW}警告: 无法检查远程分支状态${RESET}`);
  }
  
  log(`${GREEN}✅ 前提条件检查通过${RESET}`);
}

function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    showHelp();
    return;
  }
  
  const currentVersion = getCurrentVersion();
  log(`${GREEN}当前版本: ${currentVersion}${RESET}`);
  
  if (command === 'dry') {
    log('🧪 执行模拟发布...');
    runCommand('npm run publish:dry', '模拟发布到 npm');
    log(`${GREEN}✅ 模拟发布成功，所有检查通过${RESET}`);
    return;
  }
  
  if (!['patch', 'minor', 'major'].includes(command)) {
    log(`${RED}错误: 无效的命令 "${command}"${RESET}`);
    showHelp();
    process.exit(1);
  }
  
  checkPrerequisites();
  
  log(`${YELLOW}🚀 开始发布 ${command} 版本...${RESET}`);
  
  // 运行测试
  runCommand('npm test', '运行测试');
  
  // 更新版本号并创建标签
  const newVersion = runCommand(`npm version ${command}`, `更新版本号 (${command})`).trim();
  
  log(`${GREEN}新版本: ${newVersion}${RESET}`);
  
  // 推送到远程仓库
  runCommand('git push --follow-tags', '推送代码和标签到远程仓库');
  
  log(`${GREEN}🎉 发布完成！${RESET}`);
  log(`${YELLOW}📝 GitHub Actions 将自动处理 npm 发布和 GitHub Release${RESET}`);
  log(`${YELLOW}🔗 查看发布状态: https://github.com/ryan/mcp-node-tool/actions${RESET}`);
}

main();