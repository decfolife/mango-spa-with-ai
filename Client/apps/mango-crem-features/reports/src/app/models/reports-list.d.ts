import { SecurityType } from '@mango/data-models/lib-data-models';
import { ReportTag } from '@reports/models/report-tag';

export interface ReportsList {
  id: number;
  category: string;
  type: string;
  isFavorite: boolean;
  reportName: string;
  description: string;
  shared: string;
  datasetName: string;
  isScheduled: string;
  createdBy: string;
  runCount: number;
  lastRun: string;
  lastRunBy: string;
  tags: ReportTag[];
  canEdit: boolean;
  canDelete: boolean;
  folderId: number;
  contactReportId: number;
  reportUrl: string;
  sameWindow: boolean;
  rights: string;
}

export interface ReportUsersGroups {
  id: number;
  name: string;
  rights: SecurityType;
  type: string;
}

export interface DeleteReportUsersGroups {
  userGroupId: number;
  type: string;
}
