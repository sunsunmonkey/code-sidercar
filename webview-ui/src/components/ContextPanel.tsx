import React from "react";
import type { ContextSnapshot } from "../types/messages";

interface ContextPanelProps {
  snapshot: ContextSnapshot | null;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ snapshot }) => {
  const totalTokens = snapshot?.totalTokens ?? 0;
  const availableTokens = snapshot?.availableTokens ?? 0;
  const hasBudget = availableTokens > 0;

  return (
    <div className="bg-(--vscode-sideBar-background) rounded-md p-3 shadow-sm text-sm space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-(--vscode-foreground) font-semibold">
          Context Usage
        </span>
        <span className="text-(--vscode-foreground) font-mono text-base">
          {hasBudget ? `${totalTokens} / ${availableTokens}` : totalTokens}
        </span>
      </div>
    </div>
  );
};
