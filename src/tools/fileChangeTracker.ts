export interface FileChangeRecord {
  path: string;
  before: string;
  after: string;
  toolName: string;
}

export interface FileChangeTracker {
  recordChange(change: FileChangeRecord): void;
}
