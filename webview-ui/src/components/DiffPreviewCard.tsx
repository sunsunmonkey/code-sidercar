import React from "react";
import { FileText } from "lucide-react";
import type { TaskDiff } from "code-sidecar-shared/types/messages";

interface DiffPreviewCardProps {
  diff: TaskDiff;
  onSelectFile?: (filePath: string) => void;
}

const formatFileDelta = (added: number, removed: number): string => {
  const parts: string[] = [];
  if (added > 0) {
    parts.push(`+${added}`);
  }
  if (removed > 0) {
    parts.push(`-${removed}`);
  }
  return parts.length > 0 ? parts.join(" ") : "0";
};

const formatSummary = (diff: TaskDiff): string => {
  const { filesChanged, linesAdded, linesRemoved } = diff.summary;
  return `${filesChanged} files · +${linesAdded} -${linesRemoved}`;
};

const MAX_FILES = 6;

export const DiffPreviewCard: React.FC<DiffPreviewCardProps> = ({
  diff,
  onSelectFile,
}) => {
  const sortedFiles = [...diff.files].sort((a, b) =>
    a.path.localeCompare(b.path)
  );
  const visibleFiles = sortedFiles.slice(0, MAX_FILES);
  const remainingCount = sortedFiles.length - visibleFiles.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[var(--vscode-sideBarSectionHeader-background)] text-[var(--vscode-foreground)]">
            <FileText size={14} strokeWidth={1.9} />
          </span>
          <div className="text-[12px] font-semibold text-[var(--vscode-foreground)]">
            Changes
          </div>
        </div>
        <div className="text-[11px] text-[var(--vscode-descriptionForeground)]">
          {formatSummary(diff)}
        </div>
      </div>

      <div className="text-[11px] text-[var(--vscode-descriptionForeground)]">
        Click a file to open the diff panel.
      </div>

      <div className="flex flex-col gap-1">
        {visibleFiles.map((file) => (
          <button
            key={file.path}
            type="button"
            onClick={() => onSelectFile?.(file.path)}
            className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-md bg-[var(--vscode-textCodeBlock-background)] text-left hover:bg-[var(--vscode-list-hoverBackground)]"
            title={file.path}
          >
            <span className="truncate text-[12px] text-[var(--vscode-foreground)]">
              {file.path}
            </span>
            <span className="text-[11px] font-mono text-[var(--vscode-descriptionForeground)] shrink-0">
              {formatFileDelta(file.added, file.removed)}
            </span>
          </button>
        ))}
        {remainingCount > 0 && (
          <div className="text-[11px] text-[var(--vscode-descriptionForeground)] px-2">
            +{remainingCount} more file{remainingCount === 1 ? "" : "s"}
          </div>
        )}
      </div>
    </div>
  );
};
