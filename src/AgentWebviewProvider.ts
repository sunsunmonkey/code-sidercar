import * as vscode from "vscode";
import { Task, ToolUse, ToolResult } from "./task";
import { ApiConfiguration } from "./apiHandler";
import { ToolExecutor, EchoTool, AttemptCompletionTool, ReadFileTool, WriteFileTool, ListFilesTool } from "./tools";
import { ModeManager, WorkMode } from "./ModeManager";
import { PromptBuilder } from "./PromptBuilder";
import { PermissionManager } from "./PermissionManager";

/**
 * Message types sent to webview
 */
export type WebviewMessage =
  | { type: "stream_chunk"; content: string }
  | { type: "tool_call"; toolCall: ToolUse }
  | { type: "tool_result"; result: ToolResult }
  | { type: "error"; message: string }
  | { type: "task_complete" }
  | { type: "mode_changed"; mode: WorkMode };

/**
 * Message types received from webview
 */
export type UserMessage = 
  | { type: "user_message"; content: string }
  | { type: "mode_change"; mode: WorkMode };

/**
 * Agent Webview Provider manages the sidebar panel and task execution
 */
export class AgentWebviewProvider implements vscode.WebviewViewProvider {
  private webview: vscode.Webview | undefined;
  private currentTask: Task | undefined = undefined;
  private toolExecutor: ToolExecutor;
  private modeManager: ModeManager;
  private promptBuilder: PromptBuilder;
  private permissionManager: PermissionManager;
  private apiConfiguration: ApiConfiguration = {
    model: "deepseek-ai/DeepSeek-V3",
    apiKey: "sk-lhnpwtcdxoisnmrpvcdgzuaqdrqtpjlrebdbzikldxgqtvbl",
    baseUrl: "https://api.siliconflow.cn/v1/",
  };

  constructor(readonly context: vscode.ExtensionContext) {
    // Initialize permission manager (Requirements: 5.1, 5.2, 5.3, 5.4, 5.5)
    this.permissionManager = new PermissionManager();
    
    // Initialize tool executor and register default tools
    this.toolExecutor = new ToolExecutor();
    this.toolExecutor.setPermissionManager(this.permissionManager);
    this.registerDefaultTools();
    
    // Initialize mode manager and prompt builder
    // Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
    this.modeManager = new ModeManager();
    this.promptBuilder = new PromptBuilder(this.modeManager, this.toolExecutor, this.context);
  }

  /**
   * Register default tools
   * Requirements: 13.1, 13.2, 13.4, 6.6
   */
  private registerDefaultTools(): void {
    // Register echo tool for testing
    this.toolExecutor.registerTool(new EchoTool());
    
    // Register attempt_completion tool (Requirement 6.6)
    this.toolExecutor.registerTool(new AttemptCompletionTool());
    
    // Register file operation tools (Requirements 13.1, 13.2, 13.4)
    this.toolExecutor.registerTool(new ReadFileTool());
    this.toolExecutor.registerTool(new WriteFileTool());
    this.toolExecutor.registerTool(new ListFilesTool());
    
    console.log(`Registered ${this.toolExecutor.getToolCount()} tools`);
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): Thenable<void> | void {
    this.webview = webviewView.webview;

    const scriptUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "webview-ui",
        "dist",
        "assets",
        "index.js"
      )
    );

    const styleUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "webview-ui",
        "dist",
        "assets",
        "index.css"
      )
    );

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>webview-ui</title>
    <script type="module" crossorigin src=${scriptUri}></script>
    <link rel="stylesheet" crossorigin href=${styleUri}>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

    webviewView.webview.onDidReceiveMessage(async (message: any) => {
      await this.handleMessage(message);
    });
  }

  /**
   * Handle messages from webview
   * Requirements: 7.5, 7.6
   */
  private async handleMessage(message: any): Promise<void> {
    // Handle mode change messages
    if (message.type === "mode_change") {
      this.handleModeChange(message.mode);
      return;
    }
    
    // Handle user messages
    if (typeof message === "string") {
      vscode.window.showInformationMessage(message);
      this.currentTask = new Task(
        this, 
        this.apiConfiguration, 
        message, 
        this.toolExecutor,
        this.promptBuilder
      );
      await this.currentTask.start();
    } else if (message.type === "user_message") {
      this.currentTask = new Task(
        this, 
        this.apiConfiguration, 
        message.content, 
        this.toolExecutor,
        this.promptBuilder
      );
      await this.currentTask.start();
    }
  }

  /**
   * Handle mode change request
   * Requirements: 7.5, 7.6
   */
  private handleModeChange(mode: WorkMode): void {
    try {
      this.modeManager.switchMode(mode);
      const modeDefinition = this.modeManager.getCurrentModeDefinition();
      
      // Notify webview of mode change
      this.postMessageToWebview({
        type: "mode_changed",
        mode: mode,
      });
      
      // Show notification to user
      vscode.window.showInformationMessage(
        `Switched to ${modeDefinition.icon} ${modeDefinition.name} mode`
      );
      
      console.log(`[AgentWebviewProvider] Mode changed to: ${mode}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to switch mode: ${errorMessage}`);
      this.postMessageToWebview({
        type: "error",
        message: `Failed to switch mode: ${errorMessage}`,
      });
    }
  }

  /**
   * Send message to webview
   * @deprecated Use postMessageToWebview instead
   */
  postMessage(message: string) {
    this.webview?.postMessage(message);
  }

  /**
   * Send structured message to webview
   */
  postMessageToWebview(message: WebviewMessage) {
    this.webview?.postMessage(message);
  }

  /**
   * Get current task
   */
  getCurrentTask(): Task | undefined {
    return this.currentTask;
  }

  /**
   * Update API configuration
   */
  updateApiConfiguration(config: Partial<ApiConfiguration>) {
    this.apiConfiguration = { ...this.apiConfiguration, ...config };
  }

  /**
   * Get tool executor
   */
  getToolExecutor(): ToolExecutor {
    return this.toolExecutor;
  }

  /**
   * Get mode manager
   * Requirements: 7.5, 7.6
   */
  getModeManager(): ModeManager {
    return this.modeManager;
  }

  /**
   * Get prompt builder
   * Requirements: 6.1, 7.1
   */
  getPromptBuilder(): PromptBuilder {
    return this.promptBuilder;
  }

  /**
   * Get permission manager
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  getPermissionManager(): PermissionManager {
    return this.permissionManager;
  }
}
