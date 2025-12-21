export interface ToolUse {
  type: "tool_use";
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Record<string, any>;
  partial?: boolean;
}

export interface ToolResult {
  type: "tool_result";
  tool_name: string;
  content: string;
  is_error: boolean;
}
