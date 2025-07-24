export interface ComposeEmailCommand {
  objectId: number; // project id |
  objectTypeId: number;
  noteTypeId: number;
  ToContactIds: string[];
  body?: string;
  filePath?: string[];
  objectName: string;
  sendUnapprovedTasks: boolean;
  sendFilePath: boolean;
}
