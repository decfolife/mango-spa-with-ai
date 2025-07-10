export interface WorkflowStatusInformation {
  leaseAbstractId: number;
  leaseRecognitionId: number;
  workflowStatusId?: number;
  workflowStatus?: string;
  modifiedDate?: Date;
  modifiedBy?: number;
  modifiedByName?: string;
  settings?: WorkflowStatusSettings;
  options?: WorkflowStatusOption[];
}

export interface WorkflowStatusSettings {
  isApproveOwnChangesEnabled: boolean;
  isIncrementOneLevelEnforced: boolean;
  isCommentsEnabled: boolean;
  isCommentsRequired: boolean;
}

export interface WorkflowStatusOption {
  workflowStatusId: number;
  workflowStatus?: string;
  statusOrder: number;
  isApprovedStatus: boolean;
  isReviewStatus: boolean;
  isInitialStatus: boolean;
  allowScheduleEdit: boolean;
  allowJeApproval: boolean;
  allowJeExport: boolean;
  userHasEditRights: boolean;
  allUsersHaveRights: boolean;
}
