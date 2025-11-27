import { ApiConfiguration, ApiHandler, HistoryItem } from "./apiHandler";
import { AgentWebviewProvider } from "./AgentWebviewProvider";
import { ToolExecutor } from "./tools";
import { PromptBuilder } from "./PromptBuilder";
import { XMLParser } from "fast-xml-parser";

/**
 * Text content in assistant message
 */
export type TextContent = {
  type: "text";
  content: string;
};

/**
 * Tool use request from assistant
 */
export type ToolUse = {
  type: "tool_use";
  name: string;
  params: Record<string, any>;
};

/**
 * Tool execution result
 */
export type ToolResult = {
  type: "tool_result";
  tool_name: string;
  content: string;
  is_error: boolean;
};

/**
 * Content types in assistant message
 */
export type AssistantMessageContent = ToolUse | TextContent;

/**
 * Task class manages the ReAct (Reasoning and Acting) loop
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */
export class Task {
  private systemPrompt: string = "";
  private history: HistoryItem[] = [];
  private loopCount: number = 0;
  private readonly MAX_LOOPS: number = 5;
  private readonly id: string;
  private toolExecutor: ToolExecutor;
  private promptBuilder?: PromptBuilder;

  constructor(
    private provider: AgentWebviewProvider,
    private apiConfiguration: ApiConfiguration,
    private message: string,
    toolExecutor?: ToolExecutor,
    promptBuilder?: PromptBuilder
  ) {
    this.id = `task-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 11)}`;
    this.toolExecutor = toolExecutor || new ToolExecutor();
    this.promptBuilder = promptBuilder;
  }

  /**
   * Start the task and initiate the ReAct loop
   */
  async start() {
    this.history.push({ role: "user", content: this.message });
    await this.recursivelyMakeRequest(this.history);
  }

  /**
   * Recursively execute the ReAct loop
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
   */
  private async recursivelyMakeRequest(history: HistoryItem[]) {
    // Check loop count limit (Requirement 6.7)
    if (!this.shouldContinueLoop()) {
      this.provider.postMessageToWebview({
        type: "error",
        message: `已达到最大循环次数限制 (${this.MAX_LOOPS})。任务可能过于复杂，请简化任务或分解为多个步骤。`,
      });
      this.provider.postMessageToWebview({ type: "task_complete" });
      return;
    }

    this.loopCount++;

    const apiHandler = new ApiHandler(this.apiConfiguration);
    const systemPrompt = await this.getSystemPrompt();

    // Stream LLM response (Requirement 6.1)
    const stream = apiHandler.createMessage(systemPrompt, history);

    let assistantMessage = "";
    for await (const chunk of stream) {
      assistantMessage += chunk;
      this.provider.postMessageToWebview({
        type: "stream_chunk",
        content: chunk,
      });
      console.log
    }

    console.log(
      `[Task ${this.id}] Loop ${this.loopCount}: Assistant response received`
    );

    // Add assistant message to history
    this.history.push({ role: "assistant", content: assistantMessage });

    // Parse assistant message for tool calls (Requirement 6.1, 6.2)
    const assistantContent = this.parseAssistantMessage(assistantMessage);
    const toolCalls = assistantContent.filter(
      (content): content is ToolUse => content.type === "tool_use"
    );

    // If no tool calls found, prompt LLM to use tools (Requirement 6.6)
    if (toolCalls.length === 0) {
      console.log(
        `[Task ${this.id}] No tool calls found, prompting to use tools`
      );

      // Check if this is a completion scenario or if we need to prompt for tool use
      const hasTextContent = assistantContent.some((c) => c.type === "text");

      if (hasTextContent) {
        // LLM provided reasoning but no tool - prompt to use a tool
        this.history.push({ role: "user", content: this.noToolsUsed() });
        await this.recursivelyMakeRequest(this.history);
      } else {
        // Empty response - end the loop
        console.log(`[Task ${this.id}] Empty response, ending ReAct loop`);
        this.provider.postMessageToWebview({ type: "task_complete" });
      }
      return;
    }

    // Check if attempt_completion was called (Requirement 6.6)
    const hasCompletion = this.hasAttemptCompletion(toolCalls);

    // Execute tool calls and get results (Requirement 6.2, 6.3)
    const toolResults = await this.handleToolCalls(toolCalls);

    // Add tool results to history as user messages (Requirement 6.3, 6.4)
    for (const result of toolResults) {
      const resultMessage = this.formatToolResult(result);
      this.history.push({ role: "user", content: resultMessage });

      this.provider.postMessageToWebview({
        type: "tool_result",
        result: result,
      });
    }

    // If attempt_completion was called, end the ReAct loop (Requirement 6.6)
    if (hasCompletion) {
      console.log(
        `[Task ${this.id}] Task completion requested, ending ReAct loop`
      );
      this.provider.postMessageToWebview({ type: "task_complete" });
      return;
    }

    // Continue the ReAct loop (Requirement 6.4, 6.5)
    await this.recursivelyMakeRequest(this.history);
  }

  /**
   * Parse assistant message to extract text and tool calls
   * Supports multiple tool calls in a single message
   * Requirements: 6.1, 6.2
   */
  private parseAssistantMessage(
    assistantMessage: string
  ): AssistantMessageContent[] {
    const contents: AssistantMessageContent[] = [];

    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        parseTagValue: false,
        trimValues: false,
      });

      // Try to parse XML tool calls
      const parsed = parser.parse(assistantMessage);

      // Extract all tool calls from parsed content
      for (const key in parsed) {
        if (typeof parsed[key] === "object" && parsed[key] !== null) {
          // This is a potential tool call
          contents.push({
            type: "tool_use",
            name: key,
            params: parsed[key],
          });
        }
      }

      // If we found tool calls, also extract any text content
      if (contents.length > 0) {
        // Extract text that's not part of XML tags
        const textContent = assistantMessage
          .replace(/<[^>]+>.*?<\/[^>]+>/gs, "")
          .trim();
        if (textContent) {
          contents.unshift({
            type: "text",
            content: textContent,
          });
        }
      }
    } catch (error) {
      // If parsing fails, treat entire message as text
      console.log(
        `[Task ${this.id}] XML parsing failed, treating as text:`,
        error
      );
    }

    // If no tool calls were found, return the entire message as text
    if (contents.length === 0) {
      contents.push({
        type: "text",
        content: assistantMessage,
      });
    }

    return contents;
  }

  /**
   * Handle multiple tool calls
   * Requirements: 6.2, 6.3, 6.6, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7
   */
  private async handleToolCalls(toolCalls: ToolUse[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      console.log(`[Task ${this.id}] Executing tool: ${toolCall.name}`);

      this.provider.postMessageToWebview({
        type: "tool_call",
        toolCall: toolCall,
      });

      // Execute tool using ToolExecutor (Requirements 13.1-13.7)
      const result = await this.toolExecutor.executeTool(toolCall);

      results.push(result);
    }

    return results;
  }

  /**
   * Check if any tool call is attempt_completion
   * Requirement 6.6
   */
  private hasAttemptCompletion(toolCalls: ToolUse[]): boolean {
    return toolCalls.some((toolCall) => toolCall.name === "attempt_completion");
  }

  /**
   * Format tool result for adding to conversation history
   * Requirement 6.3
   */
  private formatToolResult(result: ToolResult): string {
    if (result.is_error) {
      return `[TOOL ERROR: ${result.tool_name}]\n${result.content}`;
    }
    return `[TOOL RESULT: ${result.tool_name}]\n${result.content}`;
  }

  /**
   * Check if the loop should continue
   * Requirement 6.7
   */
  private shouldContinueLoop(): boolean {
    return this.loopCount < this.MAX_LOOPS;
  }

  /**
   * Get system prompt - uses PromptBuilder if available, otherwise falls back to file
   * Requirements: 6.1, 7.1, 13.1, 13.2
   */
  private async getSystemPrompt(): Promise<string> {
    if (this.systemPrompt) {
      return this.systemPrompt;
    }

    // Use PromptBuilder if available (dynamic prompt generation)
    if (this.promptBuilder) {
      this.systemPrompt = this.promptBuilder.buildSystemPrompt();
      return this.systemPrompt;
    }

    // Fallback: use static prompt file (for backward compatibility)
    // This will be removed once PromptBuilder is fully integrated
    const fs = await import("fs/promises");
    const path = await import("path");
    this.systemPrompt = await fs.readFile(
      path.join(
        this.provider.context.extensionPath,
        "assets",
        "systemPrompt.md"
      ),
      {
        encoding: "utf-8",
      }
    );
    return this.systemPrompt;
  }

  /**
   * Get task ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get current loop count
   */
  public getLoopCount(): number {
    return this.loopCount;
  }

  /**
   * Get tool executor
   */
  public getToolExecutor(): ToolExecutor {
    return this.toolExecutor;
  }

  /**
   * Generate error message when LLM doesn't use tools
   * This prompts the LLM to use the proper tool format
   */
  private noToolsUsed(): string {
    return `[ERROR] You did not use a tool in your previous response! Please retry with a tool use.

# Reminder: Instructions for Tool Use

Tool uses are formatted using XML-style tags. The tool name itself becomes the XML tag name. Each parameter is enclosed within its own set of tags. Here's the structure:

<actual_tool_name>
<parameter1_name>value1</parameter1_name>
<parameter2_name>value2</parameter2_name>
...
</actual_tool_name>

For example, to use the attempt_completion tool:

<attempt_completion>
<result>
I have completed the task...
</result>
</attempt_completion>

Always use the actual tool name as the XML tag name for proper parsing and execution.
`;
  }
}
