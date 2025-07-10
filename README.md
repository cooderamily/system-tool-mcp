## 系统工具

**基于MCP（Model Context Protocol）规范实现的系统信息获取工具**

### 🎯 主要功能

本项目基于 [Model Context Protocol](https://modelcontextprotocol.io/introduction) 的最新规范实现，提供以下系统信息获取功能：

- **硬件信息** - 获取完整的硬件信息（CPU、内存、存储、显卡、电池、序列号）
- **系统状态** - 获取系统状态信息（操作系统、网络接口、CPU和内存使用情况）

### 🚀 安装和运行

#### 1. 安装依赖
```bash
# 使用pnpm（推荐）
pnpm install

# 或使用npm
npm install
```

#### 2. 运行MCP服务器
```bash
# 启动服务器
npm start

# 或开发模式（自动重启）
npm run dev
```

#### 3. 全局安装（可选）
```bash
npm link
# 然后可以直接使用
mcp-system-info
```

### 🔧 MCP工具列表

服务器提供以下2个精简的MCP工具：

| 工具名称 | 描述 | 参数 |
|---------|------|------|
| `get_hardware_info` | 获取完整的硬件信息（CPU、内存、存储、显卡、电池、序列号） | 无 |
| `get_system_status` | 获取系统状态信息（操作系统、网络接口、CPU和内存使用情况） | 无 |

### 📝 使用示例

#### 在Cursor中配置

1. **打开Cursor Settings**
   - 按 `Cmd/Ctrl + ,` 打开设置
   - 或者点击左下角齿轮图标 → Settings

2. **配置MCP设置**
   - 在设置搜索框中输入 "mcp"
   - 找到 "Mcp: Servers" 设置项
   - 点击 "Edit in settings.json"

3. **添加配置**
   在 `settings.json` 中添加以下配置：
   ```json
   {
     "mcp.servers": {
       "system-info": {
         "command": "node",
         "args": ["/path/to/mcp-node-tool/index.js"],
         "cwd": "/path/to/mcp-node-tool"
       }
     }
   }
   ```

   或者如果已全局安装：
   ```json
   {
     "mcp.servers": {
       "system-info": {
         "command": "mcp-system-info"
       }
     }
   }
   ```

4. **重启Cursor**
   配置完成后重启Cursor以应用更改

5. **使用MCP工具**
   - 在Cursor中打开AI聊天面板
   - 现在可以使用自然语言请求系统信息，例如：
     - "获取当前系统的完整硬件信息"
     - "显示系统状态和资源使用情况" 
     - "查看CPU和内存使用率"
     - "显示网络接口配置"

#### 在Claude Desktop中使用
在Claude Desktop的配置文件中添加：
```json
{
  "mcpServers": {
    "system-info": {
      "command": "node",
      "args": ["/path/to/mcp-node-tool/index.js"]
    }
  }
}
```

#### 作为MCP客户端使用
```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['index.js']
});

const client = new Client({
  name: 'system-client',
  version: '1.0.0'
});

await client.connect(transport);

// 获取硬件信息
const hardwareInfo = await client.callTool({
  name: 'get_hardware_info',
  arguments: {}
});

// 获取系统状态
const systemStatus = await client.callTool({
  name: 'get_system_status',
  arguments: {}
});
```

### 🧪 测试

运行包含的测试脚本来验证功能：
```bash
node test.js
```

测试脚本会：
1. 连接到MCP服务器
2. 列出所有可用工具（2个精简工具）
3. 测试硬件信息和系统状态功能
4. 验证返回数据的格式

### 📊 输出格式

所有工具返回结构化的JSON数据，格式如下：

```json
{
  "content": [
    {
      "type": "text",
      "text": "# 信息标题\n\n```json\n{数据内容}\n```"
    }
  ]
}
```

### 🔒 安全考虑

- 服务器仅提供**只读**系统信息访问
- 不执行任何系统修改操作
- 所有数据通过结构化JSON格式返回
- 遵循MCP安全最佳实践

### 📚 技术栈

- **MCP SDK**: [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- **系统信息**: [systeminformation](https://www.npmjs.com/package/systeminformation)
- **Schema验证**: [zod](https://www.npmjs.com/package/zod)
- **运行时**: Node.js 18+

### 🔗 相关链接

- [Model Context Protocol 官方文档](https://modelcontextprotocol.io/introduction)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP 规范](https://modelcontextprotocol.io/specification/2025-06-18)
- [Cursor编辑器](https://cursor.sh/)

### 📄 许可证

ISC

### 🤝 贡献

欢迎提交Issue和Pull Request来改进这个工具！