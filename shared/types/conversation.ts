import type { PermissionRequestWithId } from "./permissions";
import type { ToolResult, ToolUse } from "./tools";

export interface ConversationSummary {
  id: string;
  timestamp: Date | string;
  messageCount: number;
  preview: string;
  isCurrent: boolean;
}

export type MessageRole = "user" | "assistant" | "system" | "permission";

export interface DisplayMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  toolCalls?: ToolUse[];
  toolResults?: ToolResult[];
  isStreaming?: boolean;
  isError?: boolean;
  permissionRequest?: PermissionRequestWithId;
}
