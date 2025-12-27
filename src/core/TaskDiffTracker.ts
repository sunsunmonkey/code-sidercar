import * as path from "path";
import * as vscode from "vscode";
import { diffLines } from "diff";

import type {
  DiffLine,
  FileDiff,
  TaskDiff,
} from "code-sidecar-shared/types/diff";
import type {
  FileChangeRecord,
  FileChangeTracker,
} from "../tools/fileChangeTracker";

interface FileSnapshot {
  path: string;
  before: string;
  after: string;
}

const buildDiffLines = (before: string, after: string): DiffLine[] => {
  const segments = diffLines(before, after);
  const lines: DiffLine[] = [];
  let oldLine = 1;
  let newLine = 1;

  for (const segment of segments) {
    const segmentLines = segment.value.split("\n");
    if (segmentLines[segmentLines.length - 1] === "") {
      segmentLines.pop();
    }

    for (const line of segmentLines) {
      const cleanLine = line.endsWith("\r") ? line.slice(0, -1) : line;
      if (segment.added) {
        lines.push({
          type: "add",
          content: cleanLine,
          newLineNumber: newLine,
        });
        newLine += 1;
        continue;
      }

      if (segment.removed) {
        lines.push({
          type: "remove",
          content: cleanLine,
          oldLineNumber: oldLine,
        });
        oldLine += 1;
        continue;
      }

      lines.push({
        type: "context",
        content: cleanLine,
        oldLineNumber: oldLine,
        newLineNumber: newLine,
      });
      oldLine += 1;
      newLine += 1;
    }
  }

  return lines;
};

const getDisplayPath = (filePath: string): string => {
  if (!filePath) {
    return filePath;
  }

  if (path.isAbsolute(filePath)) {
    return vscode.workspace.asRelativePath(filePath, false);
  }

  return filePath;
};

const summarizeFileDiff = (lines: DiffLine[]): { added: number; removed: number } => {
  let added = 0;
  let removed = 0;

  for (const line of lines) {
    if (line.type === "add") {
      added += 1;
    } else if (line.type === "remove") {
      removed += 1;
    }
  }

  return { added, removed };
};

export class TaskDiffTracker implements FileChangeTracker {
  private readonly files = new Map<string, FileSnapshot>();

  constructor(private readonly taskId: string) {}

  recordChange(change: FileChangeRecord): void {
    const displayPath = getDisplayPath(change.path);
    const existing = this.files.get(displayPath);

    if (!existing) {
      this.files.set(displayPath, {
        path: displayPath,
        before: change.before,
        after: change.after,
      });
      return;
    }

    existing.after = change.after;
  }

  buildTaskDiff(): TaskDiff | null {
    const files: FileDiff[] = [];
    let totalAdded = 0;
    let totalRemoved = 0;

    for (const snapshot of this.files.values()) {
      if (snapshot.before === snapshot.after) {
        continue;
      }

      const lines = buildDiffLines(snapshot.before, snapshot.after);
      const { added, removed } = summarizeFileDiff(lines);

      if (added === 0 && removed === 0) {
        continue;
      }

      files.push({
        path: snapshot.path,
        added,
        removed,
        lines,
      });

      totalAdded += added;
      totalRemoved += removed;
    }

    if (files.length === 0) {
      return null;
    }

    return {
      taskId: this.taskId,
      createdAt: new Date().toISOString(),
      summary: {
        filesChanged: files.length,
        linesAdded: totalAdded,
        linesRemoved: totalRemoved,
      },
      files,
    };
  }
}
