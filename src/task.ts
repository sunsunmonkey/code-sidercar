import OpenAI from "openai";
import { ApiConfiguration, ApiHandler, HistoryItem } from "./apiHandler";
import { AgentWebviewProvider } from "./AgentWebviewProvider";
import path from "path";
import { readFile } from "fs/promises";
import { XMLParser } from "fast-xml-parser";

type TextContent = {
  type: "text";
  content: string;
};

const toolName = ["attempt_completion"] as const;
type ToolName = (typeof toolName)[number];

const paramsName = ["result", "fileName"] as const;
type ParamName = (typeof paramsName)[number];

type ToolUse = {
  type: "tool_use";
  name: ToolName;
  params: Partial<Record<ParamName, string>>;
};

type AssistantMessageContent = ToolUse | TextContent;

export class Task {
  private systemPrompt: string = "";
  private history: HistoryItem[] = [];

  constructor(
    private provider: AgentWebviewProvider,
    private apiConfiguration: ApiConfiguration,
    private message: string
  ) {}

  async start() {
    this.history.push({ role: "user", content: this.message });
    await this.recursivelyMakeRequest(this.history);
  }

  async recursivelyMakeRequest(history: HistoryItem[]) {
    const apiHandler = new ApiHandler(this.apiConfiguration);
    const systemPrompt = await this.getSystemPrompt();

    const stream = apiHandler.createMassage(systemPrompt, history);

    let assistantMessage = "";
    for await (const chunk of stream) {
      assistantMessage += chunk;
      this.provider.postMessage(chunk);
    }
    console.log(assistantMessage);
    this.history.push({ role: "assistant", content: assistantMessage });
    const assistantContent = this.parseAssistantMessage(assistantMessage);
    const toolUsed = this.presentAssistantMessage(assistantContent);

    if (!toolUsed) {
      this.history.push({ role: "user", content: this.noToolsUsed() });
      await this.recursivelyMakeRequest(this.history);
    }
  }
  parseAssistantMessage(assistantMessage: string): AssistantMessageContent[] {
    try {
      const parser = new XMLParser();
      const content = parser.parse(assistantMessage);
      console.log(content);
      if ("attempt_completion" in content) {
        return [
          {
            type: "tool_use",
            name: "attempt_completion",
            params: content["attempt_completion"],
          },
        ];
      }
      return [];
    } catch {
      return [{ type: "text", content: assistantMessage }];
    }
  }

  presentAssistantMessage(assistantContent: AssistantMessageContent[]) {
    for (const item of assistantContent) {
      if (item.type === "tool_use") {
        return true;
      }
    }

    return false;
  }

  async getSystemPrompt() {
    if (this.systemPrompt) {
      return this.systemPrompt;
    }

    this.systemPrompt = await readFile(
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

  noToolsUsed() {
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
