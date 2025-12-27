import React from "react";
import { X } from "lucide-react";
import type { DiffLine, FileDiff, TaskDiff } from "code-sidecar-shared/types/diff";

interface DiffDetailsPanelProps {
  diff: TaskDiff;
  selectedFilePath: string | null;
  onSelectFile: (filePath: string) => void;
  onClose: () => void;
}

const formatDelta = (file: FileDiff): string => {
  const parts: string[] = [];
  if (file.added > 0) {
    parts.push(`+${file.added}`);
  }
  if (file.removed > 0) {
    parts.push(`-${file.removed}`);
  }
  return parts.length > 0 ? parts.join(" ") : "0";
};

const DiffLineRow: React.FC<{ line: DiffLine }> = ({ line }) => {
  const lineStyle =
    line.type === "add"
      ? "bg-[var(--vscode-diffEditor-insertedTextBackground)]"
      : line.type === "remove"
        ? "bg-[var(--vscode-diffEditor-removedTextBackground)]"
        : "";

  const lineTextStyle =
    line.type === "add"
      ? "text-[var(--vscode-diffEditor-insertedTextForeground)]"
      : line.type === "remove"
        ? "text-[var(--vscode-diffEditor-removedTextForeground)]"
        : "text-[var(--vscode-foreground)]";

  return (
    <div
      className={`grid grid-cols-[38px_38px_1fr] gap-3 px-2 py-0.5 ${lineStyle}`}
      style={{ fontFamily: "var(--vscode-editor-font-family)" }}
    >
      <span className="text-[10px] text-right text-[var(--vscode-descriptionForeground)]">
        {line.oldLineNumber ?? ""}
      </span>
      <span className="text-[10px] text-right text-[var(--vscode-descriptionForeground)]">
        {line.newLineNumber ?? ""}
      </span>
      <span className={`text-[11px] whitespace-pre ${lineTextStyle}`}>
        {line.content || " "}
      </span>
    </div>
  );
};

export const DiffDetailsPanel: React.FC<DiffDetailsPanelProps> = ({
  diff,
  selectedFilePath,
  onSelectFile,
  onClose,
}) => {
  const sortedFiles = [...diff.files].sort((a, b) =>
    a.path.localeCompare(b.path)
  );
  const selectedFile =
    sortedFiles.find((file) => file.path === selectedFilePath) ??
    sortedFiles[0];

  return (
    <div className="w-full md:w-[360px] shrink-0 flex flex-col bg-[var(--vscode-editor-background)] shadow-[0_8px_20px_rgba(0,0,0,0.16)] min-h-0">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-[var(--vscode-descriptionForeground)]">
            Diff Details
          </div>
          <div className="text-[12px] font-semibold text-[var(--vscode-foreground)]">
            {diff.summary.filesChanged} files · +{diff.summary.linesAdded} -
            {diff.summary.linesRemoved}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--vscode-foreground)] hover:bg-[var(--vscode-list-hoverBackground)]"
          aria-label="Close diff details"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      <div className="px-3 pb-2">
        <div className="text-[11px] uppercase tracking-wide text-[var(--vscode-descriptionForeground)] mb-1">
          Files
        </div>
        <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto pr-1">
          {sortedFiles.map((file) => {
            const isSelected = file.path === selectedFile?.path;
            return (
              <button
                key={file.path}
                type="button"
                onClick={() => onSelectFile(file.path)}
                className={`flex items-center justify-between gap-3 px-2 py-1.5 rounded-md text-left ${
                  isSelected
                    ? "bg-[var(--vscode-list-activeSelectionBackground)] text-[var(--vscode-list-activeSelectionForeground)]"
                    : "bg-[var(--vscode-textCodeBlock-background)] text-[var(--vscode-foreground)] hover:bg-[var(--vscode-list-hoverBackground)]"
                }`}
                title={file.path}
              >
                <span className="truncate text-[12px]">{file.path}</span>
                <span className="text-[11px] font-mono opacity-80 shrink-0">
                  {formatDelta(file)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 px-3 pb-3">
        {selectedFile ? (
          <div className="flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-[12px] font-semibold text-[var(--vscode-foreground)] truncate">
                {selectedFile.path}
              </div>
              <div className="text-[11px] text-[var(--vscode-descriptionForeground)]">
                {formatDelta(selectedFile)}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto rounded-md bg-[var(--vscode-textCodeBlock-background)]">
              <div className="sticky top-0 grid grid-cols-[38px_38px_1fr] gap-3 px-2 py-1 text-[10px] uppercase tracking-wide text-[var(--vscode-descriptionForeground)] bg-[var(--vscode-editor-background)]">
                <span className="text-right">Old</span>
                <span className="text-right">New</span>
                <span>Content</span>
              </div>
              <div>
                {selectedFile.lines.map((line, index) => (
                  <DiffLineRow key={`${line.type}-${index}`} line={line} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-[var(--vscode-descriptionForeground)]">
            Select a file to view changes.
          </div>
        )}
      </div>
    </div>
  );
};
