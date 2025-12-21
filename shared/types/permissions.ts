export interface PermissionRequest {
  toolName: string;
  operation: string;
  target: string;
  details: string;
}

export type PermissionRequestWithId = PermissionRequest & { id: string };
