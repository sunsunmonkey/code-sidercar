import React, { useState, useEffect } from "react";
import type { OperationRecord } from "../types/messages";

interface OperationHistoryProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vscode: any;
}

/**
 * OperationHistory component displays the history of file operations
 * Requirements: 11.2, 11.3, 11.4, 11.5
 */
export const OperationHistory: React.FC<OperationHistoryProps> = ({
  vscode,
}) => {
  const [operations, setOperations] = useState<OperationRecord[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOperation, setSelectedOperation] =
    useState<OperationRecord | null>(null);

  useEffect(() => {
    // Request operation history when component mounts
    vscode.postMessage({ type: "get_operation_history" });

    // Listen for operation history updates
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === "operation_history") {
        setOperations(message.operations);
      } else if (message.type === "operation_recorded") {
        // Add new operation to the list
        setOperations((prev) => [...prev, message.operation]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [vscode]);

  const handleClearHistory = () => {
    vscode.postMessage({ type: "clear_operation_history" });
    setSelectedOperation(null);
  };

  const handleOperationClick = (operation: OperationRecord) => {
    setSelectedOperation(
      selectedOperation?.id === operation.id ? null : operation
    );
  };

  const getOperationIcon = (type: string): string => {
    switch (type) {
      case "file_write":
        return "📝";
      case "file_edit":
        return "✏️";
      case "file_insert":
        return "➕";
      case "file_delete":
        return "🗑️";
      case "command_execute":
        return "⚙️";
      default:
        return "📄";
    }
  };

  const formatTimestamp = (timestamp: string | Date): string => {
    const date =
      typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    return date.toLocaleString();
  };

  const getOperationTypeLabel = (type: string): string => {
    switch (type) {
      case "file_write":
        return "Write";
      case "file_edit":
        return "Edit";
      case "file_insert":
        return "Insert";
      case "file_delete":
        return "Delete";
      case "command_execute":
        return "Execute";
      default:
        return type;
    }
  };

  if (!isExpanded) {
    return (
      <div className="p-2 border-b border-[var(--vscode-panel-border)]">
        <button
          className="bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] border-none px-3 py-1.5 rounded cursor-pointer text-[13px] transition-colors hover:bg-[var(--vscode-button-secondaryHoverBackground)]"
          onClick={() => setIsExpanded(true)}
          title="Show operation history"
        >
          📋 History ({operations.length})
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[var(--vscode-sideBar-background)] border-b border-[var(--vscode-panel-border)] max-h-[400px] flex flex-col">
      <div className="flex justify-between items-center p-3 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBarSectionHeader-background)]">
        <h3 className="m-0 text-sm font-semibold text-[var(--vscode-sideBarTitle-foreground)]">
          Operation History
        </h3>
        <div className="flex gap-2">
          <button
            className="bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] border-none px-2.5 py-1 rounded cursor-pointer text-xs transition-colors hover:bg-[var(--vscode-button-secondaryHoverBackground)] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleClearHistory}
            disabled={operations.length === 0}
            title="Clear history"
          >
            Clear
          </button>
          <button
            className="bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] border-none px-3 py-1.5 rounded cursor-pointer text-[13px] transition-colors hover:bg-[var(--vscode-button-secondaryHoverBackground)]"
            onClick={() => setIsExpanded(false)}
            title="Hide operation history"
          >
            ✕
          </button>
        </div>
      </div>

      {operations.length === 0 ? (
        <div className="p-6 text-center text-[var(--vscode-descriptionForeground)]">
          <p className="my-2 text-[13px]">No operations recorded yet.</p>
          <p className="my-2 text-xs opacity-80">
            File operations performed by the AI will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 p-2">
          {operations
            .slice()
            .reverse()
            .map((operation) => (
              <div
                key={operation.id}
                className={`bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)] rounded p-2.5 mb-2 cursor-pointer transition-all hover:bg-[var(--vscode-list-hoverBackground)] hover:border-[var(--vscode-focusBorder)] ${
                  selectedOperation?.id === operation.id
                    ? "bg-[var(--vscode-list-activeSelectionBackground)] border-[var(--vscode-focusBorder)]"
                    : ""
                }`}
                onClick={() => handleOperationClick(operation)}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base flex-shrink-0">
                    {getOperationIcon(operation.type)}
                  </span>
                  <span className="font-semibold text-xs text-[var(--vscode-textLink-foreground)] uppercase flex-shrink-0">
                    {getOperationTypeLabel(operation.type)}
                  </span>
                  <span className="text-[13px] text-[var(--vscode-editor-foreground)] overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                    {operation.target}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-[var(--vscode-descriptionForeground)] gap-3">
                  <span className="flex-shrink-0">
                    {formatTimestamp(operation.timestamp)}
                  </span>
                  <span className="bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)] px-1.5 py-0.5 rounded text-[10px]">
                    {operation.toolName}
                  </span>
                </div>

                {selectedOperation?.id === operation.id && (
                  <div className="mt-3 pt-3 border-t border-[var(--vscode-panel-border)]">
                    <p className="m-0 mb-3 text-[13px] text-[var(--vscode-editor-foreground)]">
                      {operation.description}
                    </p>

                    {operation.details && (
                      <div className="bg-[var(--vscode-textCodeBlock-background)] rounded p-2.5 mb-3">
                        {operation.details.linesAdded !== undefined && (
                          <div className="mb-2 text-xs last:mb-0">
                            <strong className="text-[var(--vscode-textPreformat-foreground)] mr-1.5">
                              Lines added:
                            </strong>{" "}
                            {operation.details.linesAdded}
                          </div>
                        )}
                        {operation.details.linesRemoved !== undefined && (
                          <div className="mb-2 text-xs last:mb-0">
                            <strong className="text-[var(--vscode-textPreformat-foreground)] mr-1.5">
                              Lines removed:
                            </strong>{" "}
                            {operation.details.linesRemoved}
                          </div>
                        )}
                        {operation.details.contentPreview && (
                          <div className="mb-2 text-xs last:mb-0">
                            <strong className="text-[var(--vscode-textPreformat-foreground)] mr-1.5">
                              Preview:
                            </strong>
                            <pre className="mt-1.5 mx-0 mb-0 p-2 bg-[var(--vscode-editor-background)] rounded text-[11px] overflow-x-auto whitespace-pre-wrap break-all">
                              {operation.details.contentPreview}
                            </pre>
                          </div>
                        )}
                        {operation.details.command && (
                          <div className="mb-2 text-xs last:mb-0">
                            <strong className="text-[var(--vscode-textPreformat-foreground)] mr-1.5">
                              Command:
                            </strong>
                            <code className="bg-[var(--vscode-editor-background)] px-1.5 py-0.5 rounded text-[11px]">
                              {operation.details.command}
                            </code>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-[var(--vscode-inputValidation-infoBackground)] border-l-[3px] border-l-[var(--vscode-inputValidation-infoBorder)] px-2.5 py-2 rounded text-xs text-[var(--vscode-editor-foreground)] flex items-center gap-1.5">
                      💡 Use{" "}
                      <kbd className="bg-[var(--vscode-keybindingLabel-background)] border border-[var(--vscode-keybindingLabel-border)] text-[var(--vscode-keybindingLabel-foreground)] px-1.5 py-0.5 rounded text-[11px] font-semibold">
                        Ctrl+Z
                      </kbd>{" "}
                      (or{" "}
                      <kbd className="bg-[var(--vscode-keybindingLabel-background)] border border-[var(--vscode-keybindingLabel-border)] text-[var(--vscode-keybindingLabel-foreground)] px-1.5 py-0.5 rounded text-[11px] font-semibold">
                        Cmd+Z
                      </kbd>{" "}
                      on Mac) in the editor to undo changes
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
