import React from "react";
import type { TokenUsageSnapshot } from "../types/messages";

interface ContextPanelProps {
  usage: TokenUsageSnapshot | null;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ usage }) => {
  const totalTokens = usage?.totalTokens ?? 0;
  const availableTokens = usage?.availableTokens ?? 0;

  return (
    <div className="bg-(--vscode-sideBar-background) rounded-md p-3 shadow-sm text-sm space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-(--vscode-foreground) font-semibold">
          Token Usage
        </span>
        <span className="text-(--vscode-foreground) font-mono text-base">
          {totalTokens} / {availableTokens}
        </span>
      </div>
    </div>
  );
};
