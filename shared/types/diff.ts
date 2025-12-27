export type DiffLineType = "context" | "add" | "remove";

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface FileDiff {
  path: string;
  added: number;
  removed: number;
  lines: DiffLine[];
}

export interface TaskDiff {
  taskId: string;
  createdAt: string;
  summary: {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
  };
  files: FileDiff[];
}
