# Design Document

## Overview

本设计文档描述了一个基于 ReAct（Reasoning and Acting）模式的 VSCode AI 编程助手插件的架构设计。该插件通过 LLM 与工具的循环交互，实现智能代码分析、重构建议、调试辅助等功能。

核心设计理念：
- **ReAct 循环架构**：LLM 推理 → 工具调用 → 执行工具 → 返回结果 → LLM 继续推理
- **上下文感知**：自动收集项目文件、编辑器状态、诊断信息等上下文
- **权限控制**：用户可配置 Agent 对文件系统的访问权限
- **流式交互**：实时显示 LLM 响应和工具执行过程
- **模式化提示词**：支持多种预置工作模式（Bug 修复、代码开发、学习解释、性能优化）

## Architecture

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      VSCode Extension                        │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Extension     │  │   Webview    │  │   Tool          │ │
│  │  Host          │◄─┤   Provider   │◄─┤   Executor      │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
│         │                    │                   │           │
└─────────┼────────────────────┼───────────────────┼───────────┘
          │                    │                   │
          ▼                    ▼                   ▼
    ┌──────────┐        ┌──────────┐       ┌──────────┐
    │ VSCode   │        │ Webview  │       │   File   │
    │   API    │        │    UI    │       │  System  │
    └──────────┘        └──────────┘       └──────────┘
                              │
                              ▼
                        ┌──────────┐
                        │   LLM    │
                        │  Service │
                        └──────────┘
```

### ReAct 循环流程

```
用户输入
   │
   ▼
┌─────────────────────────────────────────────┐
│  1. 收集上下文（文件、选中代码、诊断信息）  │
└─────────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────────────┐
│  2. 构建消息历史（系统提示词 + 用户消息）   │
└─────────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────────────┐
│  3. 调用 LLM（流式输出）                    │
└─────────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────────────┐
│  4. 解析响应（文本 or 工具调用）            │
└─────────────────────────────────────────────┘
   │
   ├─ 包含工具调用 ─────────────────────┐
   │                                     │
   │                                     ▼
   │                          ┌─────────────────────┐
   │                          │  5. 执行工具        │
   │                          │  （权限检查）       │
   │                          └─────────────────────┘
   │                                     │
   │                                     ▼
   │                          ┌─────────────────────┐
   │                          │  6. 获取工具结果    │
   │                          └─────────────────────┘
   │                                     │
   │                                     ▼
   │                          ┌─────────────────────┐
   │                          │  7. 添加到历史      │
   │                          └─────────────────────┘
   │                                     │
   │                                     ▼
   │                          ┌─────────────────────┐
   │                          │  8. 循环次数检查    │
   │                          └─────────────────────┘
   │                                     │
   │                                     ├─ 未超限 ──┐
   │                                     │           │
   │                                     │           ▼
   │                                     │    返回步骤 3
   │                                     │
   │                                     └─ 超限 ────┐
   │                                                 │
   └─ 无工具调用 ───────────────────────────────────┤
                                                     │
                                                     ▼
                                          ┌─────────────────┐
                                          │  9. 结束循环    │
                                          │  等待用户输入   │
                                          └─────────────────┘
```

## Components and Interfaces

### 1. Extension Host (extension.ts)

插件的入口点，负责注册命令和初始化组件。

```typescript
interface ExtensionContext {
  subscriptions: Disposable[];
  extensionPath: string;
  globalState: Memento;
  workspaceState: Memento;
}

class Extension {
  activate(context: ExtensionContext): void;
  deactivate(): void;
}
```

### 2. AgentWebviewProvider

管理 Webview 视图和消息通信。

```typescript
interface AgentWebviewProvider extends WebviewViewProvider {
  // Webview 实例
  private webview: Webview | undefined;
  
  // 当前任务
  private currentTask: Task | undefined;
  
  // API 配置
  private apiConfiguration: ApiConfiguration;
  
  // 权限管理器
  private permissionManager: PermissionManager;
  
  // 解析 Webview 视图
  resolveWebviewView(
    webviewView: WebviewView,
    context: WebviewViewResolveContext,
    token: CancellationToken
  ): void;
  
  // 向 Webview 发送消息
  postMessage(message: WebviewMessage): void;
  
  // 处理来自 Webview 的消息
  handleMessage(message: UserMessage): Promise<void>;
}
```

### 3. Task (ReAct 循环控制器)

管理单个任务的 ReAct 循环执行。

```typescript
interface Task {
  // 任务 ID
  readonly id: string;
  
  // 对话历史
  private history: HistoryItem[];
  
  // 系统提示词
  private systemPrompt: string;
  
  // 工具执行器
  private toolExecutor: ToolExecutor;
  
  // 循环计数器
  private loopCount: number;
  
  // 最大循环次数
  private readonly MAX_LOOPS: number;
  
  // 启动任务
  start(): Promise<void>;
  
  // 递归执行 ReAct 循环
  private recursivelyMakeRequest(history: HistoryItem[]): Promise<void>;
  
  // 解析 LLM 响应
  private parseAssistantMessage(message: string): AssistantMessageContent[];
  
  // 处理工具调用
  private handleToolCalls(toolCalls: ToolUse[]): Promise<ToolResult[]>;
  
  // 检查是否应该继续循环
  private shouldContinueLoop(): boolean;
}
```

### 4. ApiHandler

处理与 LLM 服务的通信。

```typescript
interface ApiConfiguration {
  model: string;
  apiKey: string;
  baseUrl: string;
  temperature?: number;
  maxTokens?: number;
}

interface HistoryItem {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

class ApiHandler {
  constructor(config: ApiConfiguration);
  
  // 创建流式响应
  createMessage(
    systemPrompt: string,
    messages: HistoryItem[]
  ): AsyncGenerator<string, void, unknown>;
  
  // 验证 API 配置
  validateConfiguration(): Promise<boolean>;
}
```

### 5. ToolExecutor

执行工具调用并返回结果。

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: ParameterDefinition[];
}

interface ParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description: string;
}

interface ToolUse {
  type: 'tool_use';
  name: string;
  params: Record<string, any>;
}

interface ToolResult {
  type: 'tool_result';
  tool_name: string;
  content: string;
  is_error: boolean;
}

class ToolExecutor {
  // 工具注册表
  private tools: Map<string, Tool>;
  
  // 权限管理器
  private permissionManager: PermissionManager;
  
  // 注册工具
  registerTool(tool: Tool): void;
  
  // 执行工具
  async executeTool(toolUse: ToolUse): Promise<ToolResult>;
  
  // 获取所有工具定义（用于系统提示词）
  getToolDefinitions(): ToolDefinition[];
}
```

### 6. Tool Interface

所有工具的基础接口。

```typescript
interface Tool {
  // 工具名称
  readonly name: string;
  
  // 工具描述
  readonly description: string;
  
  // 参数定义
  readonly parameters: ParameterDefinition[];
  
  // 是否需要权限确认
  readonly requiresPermission: boolean;
  
  // 执行工具
  execute(params: Record<string, any>): Promise<string>;
}
```

### 7. PermissionManager

管理用户对工具操作的权限控制。

```typescript
interface PermissionSettings {
  // 默认允许读取文件
  allowReadByDefault: boolean;
  
  // 默认允许写入文件
  allowWriteByDefault: boolean;
  
  // 默认允许执行命令
  allowExecuteByDefault: boolean;
  
  // 始终确认的操作
  alwaysConfirm: string[];
}

interface PermissionRequest {
  toolName: string;
  operation: string;
  target: string;
  details: string;
}

class PermissionManager {
  // 权限设置
  private settings: PermissionSettings;
  
  // 检查权限
  async checkPermission(request: PermissionRequest): Promise<boolean>;
  
  // 请求用户确认
  private async requestUserConfirmation(request: PermissionRequest): Promise<boolean>;
  
  // 更新设置
  updateSettings(settings: Partial<PermissionSettings>): void;
}
```

### 8. ContextCollector

收集项目上下文信息。

```typescript
interface ProjectContext {
  // 当前打开的文件
  activeFile?: {
    path: string;
    content: string;
    language: string;
  };
  
  // 选中的代码
  selection?: {
    text: string;
    startLine: number;
    endLine: number;
  };
  
  // 光标位置
  cursorPosition?: {
    line: number;
    character: number;
  };
  
  // 诊断信息（错误、警告）
  diagnostics?: Diagnostic[];
  
  // 项目文件树
  fileTree?: FileNode[];
}

interface Diagnostic {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  code?: string;
}

class ContextCollector {
  // 收集当前上下文
  async collectContext(): Promise<ProjectContext>;
  
  // 收集特定文件的上下文
  async collectFileContext(filePath: string): Promise<string>;
  
  // 收集诊断信息
  async collectDiagnostics(): Promise<Diagnostic[]>;
}
```

### 9. ModeManager

管理不同的工作模式和对应的系统提示词。

```typescript
type WorkMode = 'bug-fix' | 'code-dev' | 'learn' | 'optimize';

interface ModeDefinition {
  id: WorkMode;
  name: string;
  description: string;
  systemPromptTemplate: string;
  icon: string;
}

class ModeManager {
  // 当前模式
  private currentMode: WorkMode;
  
  // 模式定义
  private modes: Map<WorkMode, ModeDefinition>;
  
  // 切换模式
  switchMode(mode: WorkMode): void;
  
  // 获取当前系统提示词
  getSystemPrompt(): string;
  
  // 注册自定义模式
  registerMode(mode: ModeDefinition): void;
}
```

### 10. Webview UI Components

React 组件结构。

```typescript
// 主应用组件
interface AppProps {}
const App: React.FC<AppProps>;

// 聊天消息列表
interface MessageListProps {
  messages: Message[];
}
const MessageList: React.FC<MessageListProps>;

// 单条消息
interface MessageProps {
  message: Message;
}
const Message: React.FC<MessageProps>;

// 工具调用显示
interface ToolCallProps {
  toolCall: ToolUse;
  result?: ToolResult;
}
const ToolCall: React.FC<ToolCallProps>;

// 输入框
interface InputBoxProps {
  onSend: (message: string) => void;
  disabled: boolean;
}
const InputBox: React.FC<InputBoxProps>;

// 模式选择器
interface ModeSelectorProps {
  currentMode: WorkMode;
  onModeChange: (mode: WorkMode) => void;
}
const ModeSelector: React.FC<ModeSelectorProps>;
```

## Data Models

### Message Types

```typescript
// 用户消息
interface UserMessage {
  type: 'user_message';
  content: string;
  context?: ProjectContext;
}

// 助手消息内容
type AssistantMessageContent = TextContent | ToolUse;

interface TextContent {
  type: 'text';
  content: string;
}

// Webview 消息
type WebviewMessage = 
  | { type: 'stream_chunk'; content: string }
  | { type: 'tool_call'; toolCall: ToolUse }
  | { type: 'tool_result'; result: ToolResult }
  | { type: 'error'; message: string }
  | { type: 'task_complete' }
  | { type: 'mode_changed'; mode: WorkMode };
```

### Tool Models

```typescript
// 文件读取工具
interface ReadFileParams {
  path: string;
}

// 文件写入工具
interface WriteFileParams {
  path: string;
  content: string;
}

// 文件搜索工具
interface SearchFilesParams {
  pattern: string;
  filePattern?: string;
  caseSensitive?: boolean;
}

// 目录列表工具
interface ListDirectoryParams {
  path: string;
  recursive?: boolean;
}

// 命令执行工具
interface ExecuteCommandParams {
  command: string;
  cwd?: string;
}

// 诊断信息工具
interface GetDiagnosticsParams {
  filePath?: string;
}
```

### Configuration Models

```typescript
interface PluginConfiguration {
  // API 配置
  api: ApiConfiguration;
  
  // 权限设置
  permissions: PermissionSettings;
  
  // 默认工作模式
  defaultMode: WorkMode;
  
  // 最大循环次数
  maxLoopCount: number;
  
  // 上下文窗口大小
  contextWindowSize: number;
}
```

## Error Handling

### Error Types

1. **API Errors**
   - 网络连接失败
   - API 认证失败
   - 速率限制超出
   - 响应超时

2. **Tool Execution Errors**
   - 文件不存在
   - 权限不足
   - 命令执行失败
   - 无效参数

3. **Parsing Errors**
   - XML 解析失败
   - 工具调用格式错误
   - 参数类型不匹配

4. **System Errors**
   - 内存不足
   - 磁盘空间不足
   - VSCode API 调用失败

### Error Handling Strategy

```typescript
interface ErrorHandler {
  // 处理错误
  handleError(error: Error, context: ErrorContext): ErrorResponse;
  
  // 错误恢复
  attemptRecovery(error: Error): Promise<boolean>;
  
  // 错误日志
  logError(error: Error, context: ErrorContext): void;
}

interface ErrorContext {
  operation: string;
  timestamp: Date;
  userMessage?: string;
  stackTrace?: string;
}

interface ErrorResponse {
  userMessage: string;
  shouldRetry: boolean;
  recoveryAction?: string;
}
```

### Error Recovery Mechanisms

1. **自动重试**：对于网络错误，自动重试最多 3 次
2. **降级处理**：当某个工具不可用时，提示用户手动操作
3. **状态回滚**：工具执行失败时，回滚到之前的状态
4. **用户通知**：所有错误都应该以友好的方式通知用户

## Testing Strategy

### Unit Testing

使用 Mocha 和 Chai 进行单元测试，覆盖以下组件：

1. **ApiHandler 测试**
   - 测试流式响应解析
   - 测试错误处理
   - 测试配置验证

2. **ToolExecutor 测试**
   - 测试每个工具的执行逻辑
   - 测试权限检查
   - 测试参数验证

3. **Task 测试**
   - 测试 ReAct 循环逻辑
   - 测试消息解析
   - 测试循环次数限制

4. **PermissionManager 测试**
   - 测试权限检查逻辑
   - 测试用户确认流程
   - 测试设置更新

### Integration Testing

测试组件之间的集成：

1. **Webview 通信测试**
   - 测试消息发送和接收
   - 测试流式输出显示
   - 测试工具调用显示

2. **LLM 集成测试**
   - 测试完整的 ReAct 循环
   - 测试多轮对话
   - 测试上下文管理

3. **VSCode API 集成测试**
   - 测试文件操作
   - 测试编辑器交互
   - 测试诊断信息获取

### End-to-End Testing

使用 VSCode Extension Test Runner 进行端到端测试：

1. **用户场景测试**
   - 代码分析场景
   - Bug 修复场景
   - 代码重构场景

2. **性能测试**
   - 响应时间测试
   - 内存使用测试
   - 大文件处理测试

## Implementation Considerations

### Performance Optimization

1. **上下文缓存**
   - 缓存已读取的文件内容
   - 缓存项目结构信息
   - 智能失效策略

2. **流式处理**
   - 使用 AsyncGenerator 处理 LLM 响应
   - 增量更新 UI
   - 避免阻塞主线程

3. **并发控制**
   - 限制同时进行的工具调用数量
   - 使用队列管理工具执行
   - 防止资源竞争

### Security Considerations

1. **API 密钥保护**
   - 使用 VSCode SecretStorage 存储 API 密钥
   - 不在日志中记录敏感信息
   - 加密传输

2. **文件系统安全**
   - 验证文件路径，防止路径遍历攻击
   - 限制可访问的目录范围
   - 记录所有文件操作

3. **命令执行安全**
   - 白名单机制限制可执行的命令
   - 参数验证和转义
   - 用户确认危险操作

### Extensibility

1. **插件系统**
   - 允许注册自定义工具
   - 允许注册自定义工作模式
   - 提供工具开发 API

2. **配置系统**
   - 支持工作区级别配置
   - 支持用户级别配置
   - 配置热重载

3. **事件系统**
   - 工具执行前后事件
   - 模式切换事件
   - 错误发生事件

