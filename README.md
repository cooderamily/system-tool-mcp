# System Info Tool

**A system information tool based on the MCP (Model Context Protocol) specification**

## 🎯 Features

This project implements the latest [Model Context Protocol](https://modelcontextprotocol.io/introduction) specification, providing:

- **Hardware Information** - Complete hardware details (CPU, memory, storage, graphics, battery, serial numbers)
- **System Status** - System status information (OS, network interfaces, CPU and memory usage)

## 🚀 Installation & Usage

### Install Dependencies
```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### Run MCP Server
```bash
# Start server
npm start

# Or development mode (auto-restart)
npm run dev
```

### Global Installation (Optional)
```bash
npm link
# Then use directly
mcp-system-info
```

## 🔧 MCP Tools

The server provides 2 streamlined MCP tools:

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_hardware_info` | Get complete hardware information | None |
| `get_system_status` | Get system status and resource usage | None |

## 📝 Configuration

### Cursor Configuration
Add to your Cursor `settings.json`:
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

### Claude Desktop Configuration
Add to Claude Desktop config:
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

## 🧪 Testing

Run the included test script:
```bash
node test.js
```

## 📊 Output Format

All tools return structured JSON data:
```json
{
  "content": [
    {
      "type": "text", 
      "text": "# Information Title\n\n```json\n{data}\n```"
    }
  ]
}
```

## 🔒 Security

- **Read-only** system information access
- No system modification operations
- Structured JSON data format
- Follows MCP security best practices

## 📄 License

ISC

Welcome to submit Issues and Pull Requests to improve this tool!