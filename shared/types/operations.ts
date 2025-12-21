export type OperationType =
  | "file_write"
  | "file_edit"
  | "file_insert"
  | "file_delete"
  | "command_execute";

export interface OperationRecord {
  id: string;
  type: OperationType;
  target: string;
  timestamp: string | Date;
  toolName: string;
  description: string;
  details?: {
    linesAdded?: number;
    linesRemoved?: number;
    contentPreview?: string;
    command?: string;
  };
}
